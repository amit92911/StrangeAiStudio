import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VoiceMode({ 
  isOpen, 
  onClose,
  onTranscriptionUpdate,
  apiKey,
  voiceSettings = {}
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  // WebSocket and audio references
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const activeAudioSourcesRef = useRef(new Set());
  const nextPlaybackTimeRef = useRef(0);
  const currentResponseIdRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isConnected) {
      connect();
    }
    
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isOpen]);

  const connect = async () => {
    if (!apiKey) {
      console.error("No API key provided");
      setConnectionStatus("API key required");
      return;
    }

    setConnectionStatus("Connecting...");

    try {
      const model = voiceSettings.model || "gpt-4o-realtime-preview";
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
      
      wsRef.current = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${apiKey}`,
        'openai-beta.realtime-v1'
      ]);
      
      wsRef.current.onopen = async () => {
        console.log('Connected to Realtime API');
        setIsConnected(true);
        setConnectionStatus("Configuring...");
        
        // Configure session
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: voiceSettings.instructions || "You are a helpful, witty, and friendly AI assistant. Keep your responses concise and conversational.",
            voice: voiceSettings.voice || "alloy",
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: voiceSettings.vadThreshold || 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: voiceSettings.silenceDuration || 200
            },
            temperature: voiceSettings.temperature || 0.8,
            max_response_output_tokens: 4096
          }
        };
        
        console.log('Sending session config:', sessionConfig);
        wsRef.current.send(JSON.stringify(sessionConfig));
        
        // Start audio capture after a short delay
        setTimeout(async () => {
          await startAudioCapture();
          setConnectionStatus("Ready - Start speaking");
        }, 500);
      };
      
      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleRealtimeMessage(message);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus("Connection error");
      };
      
      wsRef.current.onclose = () => {
        console.log('Disconnected from Realtime API');
        setIsConnected(false);
        setConnectionStatus("Disconnected");
        stopAudioCapture();
        stopAllAudio();
      };
      
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionStatus("Failed to connect");
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudioCapture();
    stopAllAudio();
    
    nextPlaybackTimeRef.current = 0;
    currentResponseIdRef.current = null;
    
    setIsConnected(false);
    setConnectionStatus("Disconnected");
  };

  const startAudioCapture = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000
      });
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      
      processorRef.current.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isMuted) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Check if there's actual audio
        const hasAudio = inputData.some(sample => Math.abs(sample) > 0.01);
        if (hasAudio) {
          setIsProcessingAudio(true);
        }
        
        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Send audio to Realtime API
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio
        }));
      };
      
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
    } catch (error) {
      console.error('Error starting audio capture:', error);
      setConnectionStatus("Microphone error");
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const stopAllAudio = () => {
    activeAudioSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
    });
    activeAudioSourcesRef.current.clear();
    nextPlaybackTimeRef.current = 0;
  };

  const handleRealtimeMessage = (message) => {
    console.log('Received message:', message.type, message);
    
    switch (message.type) {
      case 'session.created':
      case 'session.updated':
        console.log('Session configured successfully');
        setConnectionStatus("Ready - Start speaking");
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript) {
          console.log('User transcript:', message.transcript);
          onTranscriptionUpdate?.('user', message.transcript);
        }
        break;
        
      case 'response.audio_transcript.delta':
        if (message.delta) {
          console.log('Assistant delta:', message.delta);
          setCurrentTranscript(prev => prev + message.delta);
        }
        break;
        
      case 'response.audio_transcript.done':
        if (message.transcript) {
          console.log('Assistant complete:', message.transcript);
          onTranscriptionUpdate?.('assistant', message.transcript);
          setCurrentTranscript("");
        }
        break;
        
      case 'response.audio.delta':
        if (message.delta && (!currentResponseIdRef.current || message.response_id === currentResponseIdRef.current)) {
          playAudioDelta(message.delta);
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('Speech detected - user started speaking');
        setConnectionStatus("Listening...");
        // User interruption - stop current audio
        stopAllAudio();
        currentResponseIdRef.current = null;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'response.cancel'
          }));
        }
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('Speech stopped - processing...');
        setConnectionStatus("Processing...");
        break;
        
      case 'input_audio_buffer.committed':
        console.log('Audio buffer committed');
        break;
        
      case 'response.created':
        currentResponseIdRef.current = message.response?.id || message.response_id;
        console.log('Response created:', currentResponseIdRef.current);
        setConnectionStatus("AI is speaking...");
        break;
        
      case 'response.audio.started':
        console.log('Response audio started');
        if (audioContextRef.current) {
          nextPlaybackTimeRef.current = audioContextRef.current.currentTime;
        }
        setCurrentTranscript("");
        break;
        
      case 'response.done':
        console.log('Response completed');
        currentResponseIdRef.current = null;
        setConnectionStatus("Ready - Start speaking");
        break;
        
      case 'response.cancelled':
        console.log('Response cancelled');
        currentResponseIdRef.current = null;
        setConnectionStatus("Ready - Start speaking");
        break;
        
      case 'error':
        console.error('Realtime API error:', message.error);
        setConnectionStatus(`Error: ${message.error.message || JSON.stringify(message.error)}`);
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  const playAudioDelta = async (base64Audio) => {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 24000
        });
      }
      
      const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      activeAudioSourcesRef.current.add(source);
      source.onended = () => {
        activeAudioSourcesRef.current.delete(source);
      };
      
      const currentTime = audioContextRef.current.currentTime;
      const playTime = Math.max(currentTime, nextPlaybackTimeRef.current);
      
      source.start(playTime);
      
      nextPlaybackTimeRef.current = playTime + audioBuffer.duration;
      
      if (nextPlaybackTimeRef.current < currentTime) {
        nextPlaybackTimeRef.current = currentTime;
      }
      
    } catch (error) {
      console.error('Error playing audio delta:', error);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    console.log('Microphone', newMuted ? 'muted' : 'unmuted');
    
    if (newMuted) {
      setConnectionStatus("Muted");
    } else {
      setConnectionStatus("Ready - Start speaking");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-white/5 backdrop-blur-sm rounded-lg">
      {/* Voice Status Indicator */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )}>
            {isConnected && (
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping" />
            )}
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white/90">
            Voice Mode
          </span>
          <span className="text-xs text-white/60">
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Wave Visualizer */}
      <div className="flex-1 mx-4">
        <div className="flex items-center justify-center space-x-1 h-8">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 bg-white/40 rounded-full transition-all duration-100",
                isProcessingAudio && "bg-blue-400",
                currentTranscript && "bg-green-400"
              )}
              style={{
                height: (isConnected && (isProcessingAudio || currentTranscript)) ? 
                  `${Math.random() * 24 + 8}px` : "8px",
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-white/60 hover:text-white hover:bg-white/10"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              console.log('Sending test message');
              // Send a text message to test
              wsRef.current.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{
                    type: 'input_text',
                    text: 'Hello, can you hear me? Please respond.'
                  }]
                }
              }));
              
              // Then create a response
              setTimeout(() => {
                wsRef.current.send(JSON.stringify({
                  type: 'response.create'
                }));
              }, 100);
            }
          }}
          className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
          title="Send test message"
        >
          Test
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              console.log('Manual audio commit and response');
              // First commit the audio buffer
              wsRef.current.send(JSON.stringify({
                type: 'input_audio_buffer.commit'
              }));
              // Then create a response
              setTimeout(() => {
                wsRef.current.send(JSON.stringify({
                  type: 'response.create',
                  response: {
                    modalities: ['text', 'audio']
                  }
                }));
              }, 100);
            }
          }}
          className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
          title="Send audio buffer"
        >
          Send
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDisconnect}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          title="End call"
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>

      {/* Live Transcript (if any) */}
      {(currentTranscript || connectionStatus.includes("Error")) && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-black/80 backdrop-blur-sm rounded-lg">
          <p className="text-xs text-white/80 italic">
            {currentTranscript || connectionStatus}
          </p>
        </div>
      )}
    </div>
  );
}