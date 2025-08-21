
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/api/integrations";
import { Message } from "@/api/entities";
import { deepgramVoice } from "@/api/functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Radio,
  Download,
  Settings,
  X,
  AlertCircle
} from "lucide-react";

export default function VoiceMode({ onClose, currentModel, currentProvider, currentChat, onTranscriptSave }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fullTranscript, setFullTranscript] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [aecEnabled, setAecEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const synthRef = useRef(null);
  const isMountedRef = useRef(true);
  const silenceTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const vadRef = useRef(null);
  const keepAliveIntervalRef = useRef(null); // Add ref for keep-alive

  useEffect(() => {
    isMountedRef.current = true;
    initializeVoices();
    
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const initializeVoices = () => {
    if (!('speechSynthesis' in window)) return;
    
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        if (englishVoice) {
          setSelectedVoiceURI(englishVoice.voiceURI);
        }
      }
    };

    synthRef.current = window.speechSynthesis;
    synthRef.current.onvoiceschanged = loadVoices;
    loadVoices();
  };

  const initializeAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  const detectVoiceActivity = () => {
    if (!analyserRef.current) return false;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    return rms > 15;
  };

  const startVoiceActivityDetection = () => {
    const checkVAD = () => {
      if (!isMountedRef.current || !isConnected) return;
      
      const hasVoice = detectVoiceActivity();
      
      if (hasVoice && currentSpeaker === 'ai') {
        handleBargeIn();
      }
      
      vadRef.current = requestAnimationFrame(checkVAD);
    };
    
    vadRef.current = requestAnimationFrame(checkVAD);
  };

  const stopVoiceActivityDetection = () => {
    if (vadRef.current) {
      cancelAnimationFrame(vadRef.current);
      vadRef.current = null;
    }
  };

  const handleBargeIn = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setCurrentSpeaker(null);
      setIsProcessing(false);
      // Immediately restart listening after barge-in
      setTimeout(() => {
        if (isMountedRef.current && isConnected && !isMuted) {
          startListening();
        }
      }, 100);
    }
  };

  const connectToDeepgram = async () => {
    try {
      setError(null);
      
      const { data: credentials } = await deepgramVoice({ action: 'transcribe' });
      
      if (!credentials.apiKey) {
        throw new Error('Failed to get Deepgram API key');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioStreamRef.current = stream;
      
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      setAecEnabled(settings.echoCancellation === true);
      
      await initializeAudioContext();
      
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
      }

      const wsUrl = `${credentials.wsUrl}?container=webm&encoding=opus&channels=1&interim_results=true&punctuate=true&smart_format=true&model=nova-2`;
      
      wsRef.current = new WebSocket(wsUrl, ['token', credentials.apiKey]);

      wsRef.current.onopen = () => {
        console.log('Connected to Deepgram');
        setIsConnected(true);
        startListening();
        startVoiceActivityDetection();
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.channel && data.channel.alternatives && data.channel.alternatives[0]) {
          const transcriptText = data.channel.alternatives[0].transcript;
          
          if (transcriptText) {
            setTranscript(transcriptText);
            
            if (data.is_final) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = setTimeout(() => {
                // Only handle user speech when we're not processing and the AI isn't speaking
                if (transcriptText.trim() && !isProcessing && currentSpeaker !== 'ai') {
                  handleUserSpeech(transcriptText.trim());
                }
              }, 800);
            }
          }
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        setError('Connection to speech service failed');
      };

      wsRef.current.onclose = (event) => {
        console.log('Disconnected from Deepgram', event.code, event.reason);
        // Don't automatically reconnect on close - this prevents the auto-restart issue
        if (isMountedRef.current && event.code !== 1000) {
          setError('Connection lost. Please restart voice mode.');
        }
        setIsConnected(false);
        setIsListening(false);
      };

    } catch (error) {
      console.error('Failed to connect to Deepgram:', error);
      setError(`Failed to start voice mode: ${error.message}`);
    }
  };

  const startListening = () => {
    if (!audioStreamRef.current || !wsRef.current || isListening || isMuted) return;

    try {
      mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then(buffer => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(buffer);
            }
          });
        }
      };

      mediaRecorderRef.current.onstop = () => {
        setIsListening(false);
      };

      mediaRecorderRef.current.start(100);
      setIsListening(true);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start microphone');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const speak = (text) => {
    if (isSpeakerOff || !text.trim()) {
      setCurrentSpeaker(null);
      setIsProcessing(false);
      setTimeout(() => {
        if (isMountedRef.current && isConnected && !isMuted) {
          startListening();
        }
      }, 200);
      return;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      if (isMountedRef.current) {
        setCurrentSpeaker('ai');
      }
    };

    utterance.onend = () => {
      if (isMountedRef.current) {
        setCurrentSpeaker(null);
        setIsProcessing(false);
      }
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event.error);
      }
      if (isMountedRef.current) {
        setCurrentSpeaker(null);
        setIsProcessing(false);
      }
    };

    synthRef.current.speak(utterance);
  };

  const handleUserSpeech = async (speechText) => {
    if (!speechText.trim() || !currentChat || isProcessing) return;
    
    setIsProcessing(true);
    setCurrentSpeaker('thinking');
    addToFullTranscript('User', speechText);
    setTranscript('');

    try {
      if (currentChat) {
        await Message.create({
          chat_id: currentChat.id,
          role: 'user',
          content: speechText
        });
      }

      const recentTranscript = fullTranscript.slice(-6);
      const conversationHistory = recentTranscript
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n');
      
      const prompt = `You are in a voice conversation. Respond naturally and conversationally. Keep responses concise (1-3 sentences) for spoken dialogue.

${conversationHistory ? `Recent conversation:\n${conversationHistory}\n` : ''}
User: ${speechText}

Respond helpfully and naturally:`;
      
      const response = await InvokeLLM({ prompt });
      const aiResponse = typeof response === 'object' ? response.output || JSON.stringify(response) : response;
      
      if (isMountedRef.current) {
        addToFullTranscript('AI', aiResponse);
        setTranscript(aiResponse);
        speak(aiResponse);
        
        if (currentChat) {
          await Message.create({
            chat_id: currentChat.id,
            role: 'assistant',
            content: aiResponse,
            model_used: currentModel,
            provider_used: currentProvider
          });
        }
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = "I'm sorry, I had trouble processing that. Could you try again?";
      if (isMountedRef.current) {
        addToFullTranscript('AI', errorMessage);
        setTranscript(errorMessage);
        speak(errorMessage);
      }
    }
  };

  const addToFullTranscript = (speaker, text) => {
    const timestamp = new Date().toLocaleTimeString();
    setFullTranscript(prev => [...prev, { timestamp, speaker, text }]);
  };

  const handleConnect = async () => {
    await connectToDeepgram();
  };
  
  const handleDisconnect = () => {
    cleanup();
    
    if (fullTranscript.length > 0 && onTranscriptSave) {
      onTranscriptSave(fullTranscript);
    }
    
    setIsConnected(false);
    setCurrentSpeaker(null);
    setIsProcessing(false);
    setTranscript("");
    setFullTranscript([]);
  };

  const cleanup = () => {
    stopVoiceActivityDetection();
    clearInterval(keepAliveIntervalRef.current); // Ensure keep-alive is cleared on cleanup
    clearTimeout(silenceTimeoutRef.current);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'User disconnected'); // Clean close
      wsRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsListening(false);
  };

  const downloadTranscript = () => {
    const transcriptText = fullTranscript.map(entry => 
      `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`
    ).join('\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const SettingsView = () => (
    <div className="space-y-6 pt-4">
      <h3 className="text-lg font-medium text-white/90">Voice Settings</h3>
      
      {/* AEC Status */}
      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${aecEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white/80 font-medium">Echo Cancellation</span>
        </div>
        <p className="text-xs text-white/60">
          {aecEnabled ? 'Active via WebRTC - Professional quality audio processing' : 'Not available - Consider using headphones'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mic-mute" className="text-white/70">Microphone</Label>
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
            <span>Mute Microphone</span>
            <Switch 
              id="mic-mute" 
              checked={isMuted} 
              onCheckedChange={(checked) => {
                setIsMuted(checked);
                if (checked) {
                  stopListening();
                } else if (isConnected && !isProcessing) { // Only restart listening if not processing
                  startListening();
                }
              }} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="speaker-mute" className="text-white/70">Speaker</Label>
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
            <span>Mute AI Voice</span>
            <Switch 
              id="speaker-mute" 
              checked={isSpeakerOff} 
              onCheckedChange={setIsSpeakerOff} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-voice" className="text-white/70">AI Voice</Label>
          <Select value={selectedVoiceURI || ''} onValueChange={setSelectedVoiceURI}>
            <SelectTrigger id="ai-voice" className="w-full bg-white/5 border-white/10 text-white/92">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border border-white/20">
              {voices.map(voice => (
                <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-white/90 focus:bg-white/10">
                  <div>
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-xs text-white/60">{voice.lang}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button 
          variant="outline" 
          onClick={() => setShowSettings(false)} 
          className="border-white/20 text-white/72 hover:bg-white/10 hover:text-white"
        >
          Back to Call
        </Button>
      </DialogFooter>
    </div>
  );

  const MainView = () => (
    <div className="space-y-6 pt-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Connection Status */}
      <div className="text-center">
        <div className={`
          w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300
          ${isConnected 
            ? currentSpeaker === 'user'
              ? 'bg-gradient-to-br from-cyan-400 to-violet-500 animate-pulse scale-110'
              : currentSpeaker === 'ai'
                ? 'bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse scale-110'
                : currentSpeaker === 'thinking'
                  ? 'bg-gradient-to-br from-orange-400 to-red-500 animate-pulse scale-110'
                  : 'bg-gradient-to-br from-emerald-400 to-green-500'
            : 'bg-white/10 border-2 border-white/20'
          }
        `}>
          {isConnected ? (
            <Radio className="w-8 h-8 text-white" />
          ) : (
            <Phone className="w-8 h-8 text-white/60" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-lg font-semibold text-white/92">
            {isConnected ? 'Voice Mode Active' : 'Voice Mode Ready'}
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-white/60">
            <Badge variant="outline" className="border-white/20 text-white/72">
              Deepgram Live
            </Badge>
            {aecEnabled && (
              <Badge variant="outline" className="border-green-400/20 text-green-300">
                AEC Active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Live Transcript */}
      {(transcript || fullTranscript.length > 0) && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 min-h-[80px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {currentSpeaker === 'thinking' ? 'Processing...' : 'Live Transcript'}
            </span>
            {currentSpeaker && (
              <Badge variant="outline" className={`
                border text-xs
                ${currentSpeaker === 'user' 
                  ? 'border-cyan-400/50 text-cyan-300 bg-cyan-400/10' 
                  : currentSpeaker === 'ai' 
                    ? 'border-violet-400/50 text-violet-300 bg-violet-400/10'
                    : currentSpeaker === 'thinking'
                      ? 'border-orange-400/50 text-orange-300 bg-orange-400/10 animate-pulse'
                      : ''
                }
              `}>
                {currentSpeaker === 'thinking' ? 'AI Thinking' : currentSpeaker === 'ai' ? 'AI Speaking' : 'You Speaking'}
              </Badge>
            )}
          </div>
          <p className="text-white/85 leading-relaxed break-words min-h-[20px]">
            {transcript || (fullTranscript.length > 0 ? fullTranscript[fullTranscript.length - 1].text : '')}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center space-x-3">
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white px-8"
          >
            <Phone className="w-4 h-4 mr-2" />
            Start Voice Mode
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={`text-white/60 hover:text-white/80 hover:bg-white/10 ${isMuted ? 'bg-red-500/20 text-red-400' : ''}`}
              onClick={() => {
                const newMuted = !isMuted;
                setIsMuted(newMuted);
                if (newMuted) {
                  stopListening();
                } else if (!isProcessing) { // Only restart listening if not processing
                  startListening();
                }
              }}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`text-white/60 hover:text-white/80 hover:bg-white/10 ${isSpeakerOff ? 'bg-red-500/20 text-red-400' : ''}`}
              onClick={() => setIsSpeakerOff(!isSpeakerOff)}
            >
              {isSpeakerOff ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            {fullTranscript.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white/80 hover:bg-white/10"
                onClick={downloadTranscript}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(true)} 
              className="text-white/60 hover:text-white/80 hover:bg-white/10"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleDisconnect}
              variant="destructive"
              size="icon"
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/30"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Voice Mode Info */}
      <div className="text-center text-xs text-white/50 leading-relaxed">
        {isConnected ? (
          <div>
            <p>Speak naturally. Advanced echo cancellation is active.</p>
            <p className="text-green-400 mt-1">✓ Professional-grade voice processing via Deepgram Live</p>
          </div>
        ) : (
          <p>Start a natural voice conversation with real-time speech recognition and AI responses.</p>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open onOpenChange={() => { 
      if (isConnected) handleDisconnect(); 
      onClose(); 
    }}>
      <DialogContent className="max-w-md bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white/92">Voice Mode</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 text-white/60 hover:text-white hover:bg-white/10" 
            onClick={() => { 
              if (isConnected) handleDisconnect(); 
              onClose(); 
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {showSettings ? <SettingsView /> : <MainView />}
      </DialogContent>
    </Dialog>
  );
}
