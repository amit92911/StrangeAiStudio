
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
  TTSProvider,
  listVoices as listTtsVoices,
  getAudioURL,
  getDefaultTTSProvider,
  setDefaultTTSProvider,
  getDefaultTTSVoice,
  setDefaultTTSVoice
} from "@/api/tts";
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
  const [ttsProvider, setTtsProvider] = useState(getDefaultTTSProvider());
  const [availableTtsVoices, setAvailableTtsVoices] = useState([]);
  const [selectedTtsVoiceId, setSelectedTtsVoiceId] = useState(getDefaultTTSVoice() || null);
  const [showSettings, setShowSettings] = useState(false);
  const [aecEnabled, setAecEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [speechBuffer, setSpeechBuffer] = useState('');
  
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
  const ttsAudioRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    initializeVoices();
    loadTtsVoices(ttsProvider);
    
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    loadTtsVoices(ttsProvider);
  }, [ttsProvider]);

  const initializeVoices = () => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        if (englishVoice) {
          setSelectedVoiceURI(englishVoice.voiceURI);
          console.log('WebSpeech voices loaded:', availableVoices.length, 'voices available');
        }
      } else {
        console.log('No WebSpeech voices available');
      }
    };

    synthRef.current = window.speechSynthesis;
    synthRef.current.onvoiceschanged = loadVoices;

    // Try to load voices immediately, and also after a delay in case they're not ready
    loadVoices();
    setTimeout(loadVoices, 1000); // Some browsers need extra time
  };

  const isProviderAvailable = (provider) => {
    if (provider === TTSProvider.WebSpeech) return true;
    if (provider === TTSProvider.OpenAI) return !!localStorage.getItem('OPENAI_API_KEY');
    if (provider === TTSProvider.Google) return !!localStorage.getItem('GOOGLE_TTS_API_KEY');
    return false;
  };

  const loadTtsVoices = async (provider) => {
    if (!isProviderAvailable(provider)) {
      console.warn(`Cannot load voices for ${provider}: API key missing`);
      setAvailableTtsVoices([]);
      return;
    }

    try {
      const list = await listTtsVoices(provider);
      setAvailableTtsVoices(list);
      const stored = getDefaultTTSVoice();
      const exists = list.find(v => v.id === stored);
      if (exists) {
        setSelectedTtsVoiceId(stored);
      } else if (list[0]) {
        setSelectedTtsVoiceId(list[0].id);
        setDefaultTTSVoice(list[0].id);
      }
    } catch (e) {
      console.warn('Failed to load TTS voices', e);
      setAvailableTtsVoices([]);
    }
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

    // Lower threshold for better barge-in sensitivity
    return rms > 10;
  };

  const startVoiceActivityDetection = () => {
    const checkVAD = () => {
      if (!isMountedRef.current || !isConnected) return;

      const hasVoice = detectVoiceActivity();

      // Barge-in: interrupt AI if user speaks while AI is speaking
      if (hasVoice && currentSpeaker === 'ai' && isAISpeaking) {
        console.log('Barge-in detected! User interrupted AI');
        handleBargeIn();
        return; // Don't continue VAD after barge-in
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
    console.log('Handling barge-in...');

    // Cancel any ongoing TTS playback
    cancelAnyTtsPlayback();

    // Reset AI speaking state
    setIsAISpeaking(false);
    setCurrentSpeaker('user');

    // Stop processing any ongoing AI response
    setIsProcessing(false);

    // For continuous listening, we don't need to restart listening
    // The WebSocket and MediaRecorder should already be active
    console.log('Barge-in handled - listening for user speech');
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

        // Start continuous listening for barge-in capability
        startContinuousListening();

        // Start voice activity detection for barge-in
        startVoiceActivityDetection();

        // Set up keep-alive to prevent WebSocket timeout
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
        }
        keepAliveIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Send a small keep-alive packet (silence) to prevent timeout
            const silence = new Uint8Array(128).fill(128); // 128 bytes of silence
            wsRef.current.send(silence.buffer);
          }
        }, 10000); // Every 10 seconds
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.channel && data.channel.alternatives && data.channel.alternatives[0]) {
          const transcriptText = data.channel.alternatives[0].transcript;

          if (transcriptText && transcriptText.trim()) {
            // Echo cancellation: ignore transcripts when AI is speaking
            if (isAISpeaking) {
              console.log('Echo cancellation: Ignoring transcript while AI is speaking:', transcriptText);
              return;
            }

            setTranscript(transcriptText);

            if (data.is_final) {
              // Accumulate speech segments
              const newBuffer = speechBuffer ? `${speechBuffer} ${transcriptText}` : transcriptText;
              setSpeechBuffer(newBuffer);

              clearTimeout(silenceTimeoutRef.current);
              // Use a longer timeout to allow for natural speech patterns
              silenceTimeoutRef.current = setTimeout(() => {
                // Only process user speech when we're not already processing
                if (newBuffer.trim() && !isProcessing && !isAISpeaking) {
                  console.log('Processing complete user speech:', newBuffer.trim());
                  handleUserSpeech(newBuffer.trim());
                  setSpeechBuffer(''); // Clear buffer after processing
                }
              }, 2000); // Increased to 2 seconds for complete speech
            }
          }
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        // Don't immediately set error - let onclose handle it
        // This prevents premature error messages
      };

      wsRef.current.onclose = (event) => {
        console.log('Disconnected from Deepgram', event.code, event.reason);

        // Clear keep-alive interval
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }

        if (isMountedRef.current) {
          setIsConnected(false);
          setIsListening(false);
          setIsContinuousListening(false);

          // Only show error if it wasn't a clean disconnect (user initiated)
          if (event.code !== 1000) {
            console.warn('Unexpected WebSocket disconnect, reason:', event.reason);
            setError('Connection lost. Please restart voice mode.');
          } else {
            console.log('Clean disconnect from Deepgram - user initiated');
          }
        }
      };

    } catch (error) {
      console.error('Failed to connect to Deepgram:', error);
      setError(`Failed to start voice mode: ${error.message}`);
    }
  };

  const startContinuousListening = () => {
    if (!audioStreamRef.current || !wsRef.current || isContinuousListening || isMuted) {
      if (isMuted) console.log('Not starting continuous listening: muted');
      if (isContinuousListening) console.log('Not starting continuous listening: already active');
      if (!audioStreamRef.current) console.log('Not starting continuous listening: no audio stream');
      if (!wsRef.current) console.log('Not starting continuous listening: no WebSocket');
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not ready for continuous listening, state:', wsRef.current.readyState);
      return;
    }

    try {
      console.log('Starting continuous listening for barge-in...');
      mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Always send audio data to Deepgram for continuous transcription
          // Echo cancellation happens in the message handler
          event.data.arrayBuffer().then(buffer => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(buffer);
            }
          }).catch(err => console.error('Error sending audio data:', err));
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('Continuous MediaRecorder stopped');
        setIsContinuousListening(false);
        setIsListening(false);
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('Continuous MediaRecorder error:', event.error);
        // Don't stop continuous listening on errors - try to recover
        console.log('Attempting to recover from MediaRecorder error...');
        setTimeout(() => {
          if (isMountedRef.current && isConnected && !isMuted) {
            console.log('Restarting continuous listening after error...');
            startContinuousListening();
          }
        }, 1000);
      };

      mediaRecorderRef.current.start(100);
      setIsContinuousListening(true);
      setIsListening(true);
      console.log('Continuous listening started successfully - barge-in enabled');

    } catch (error) {
      console.error('Failed to start continuous recording:', error);
      setError('Failed to start microphone');
      setIsContinuousListening(false);
      setIsListening(false);
    }
  };

  const startListening = () => {
    // For backwards compatibility - start continuous listening
    startContinuousListening();
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping MediaRecorder and continuous listening');
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setIsContinuousListening(false);
  };

  const pauseListening = () => {
    // Don't stop the MediaRecorder, just pause processing
    // This allows for barge-in capability
    console.log('Pausing audio processing (continuous listening remains active)');
  };

  const resumeListening = () => {
    // Resume processing audio
    console.log('Resuming audio processing');
  };

  const cancelAnyTtsPlayback = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = '';
      } catch {}
      ttsAudioRef.current = null;
    }
  };

  const speak = async (text) => {
    if (isSpeakerOff || !text.trim()) {
      setCurrentSpeaker(null);
      setIsProcessing(false);
      setIsAISpeaking(false);
      resumeListening();
      return;
    }

    cancelAnyTtsPlayback();
    // For continuous listening, just pause processing instead of stopping
    if (isContinuousListening) {
      pauseListening();
    } else {
      stopListening();
    }

    setIsAISpeaking(true);
    setCurrentSpeaker('ai');

    if (ttsProvider === TTSProvider.WebSpeech) {
      if (!synthRef.current) {
        console.error('WebSpeech synthesis not available');
        setCurrentSpeaker(null);
        setIsProcessing(false);
        setIsAISpeaking(false);
        resumeListening();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Find a suitable voice - prefer selected voice, fall back to any English voice
      let voice = voices.find(v => v.voiceURI === (selectedTtsVoiceId || selectedVoiceURI));
      if (!voice) {
        voice = voices.find(v => v.lang && v.lang.startsWith('en'));
      }
      if (!voice && voices.length > 0) {
        voice = voices[0]; // Last resort: use any available voice
      }

      if (voice) {
        utterance.voice = voice;
        console.log('Using WebSpeech voice:', voice.name, voice.lang);
      } else {
        console.warn('No suitable WebSpeech voice found');
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        if (isMountedRef.current) {
          setCurrentSpeaker('ai');
          console.log('Direct WebSpeech started with voice:', voice?.name);
        }
      };

      utterance.onend = () => {
        if (isMountedRef.current) {
          setCurrentSpeaker(null);
          setIsProcessing(false);
          setIsAISpeaking(false);
          console.log('Direct WebSpeech ended, resuming continuous listening...');
          resumeListening();
        }
      };

      utterance.onerror = (event) => {
        if (isMountedRef.current) {
          console.error('Direct WebSpeech error:', event.error, 'for text:', text);
          setCurrentSpeaker(null);
          setIsProcessing(false);
          setIsAISpeaking(false);
          console.log('Direct WebSpeech error, resuming continuous listening...');
          resumeListening();
        }
      };

      try {
        synthRef.current.speak(utterance);
      } catch (error) {
        console.error('Failed to start WebSpeech:', error);
        setCurrentSpeaker(null);
        setIsProcessing(false);
        setIsAISpeaking(false);
        resumeListening();
      }
      return;
    }

    try {
      const url = await getAudioURL(ttsProvider, text, selectedTtsVoiceId);

      // If getAudioURL returns null, it means we should use WebSpeech
      if (!url) {
        if (ttsProvider !== TTSProvider.WebSpeech) {
          console.warn(`Switching to WebSpeech because ${ttsProvider} TTS failed`);
          setTtsProvider(TTSProvider.WebSpeech);
          setDefaultTTSProvider(TTSProvider.WebSpeech);
        }
        // Use WebSpeech directly - no error needed
        console.log('Using WebSpeech synthesis');

        if (!synthRef.current) {
          console.error('WebSpeech synthesis not available');
          setCurrentSpeaker(null);
          setIsProcessing(false);
          setTimeout(() => { if (!isMuted) startListening(); }, 150);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voices.find(v => v.voiceURI === (selectedVoiceURI));
        if (voice) {
          utterance.voice = voice;
          console.log('Using voice:', voice.name, voice.lang);
        } else {
          console.log('No specific voice selected, using browser default');
        }

        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          if (isMountedRef.current) {
            setCurrentSpeaker('ai');
            console.log('Fallback WebSpeech started');
          }
        };

        utterance.onend = () => {
          if (isMountedRef.current) {
            setCurrentSpeaker(null);
            setIsProcessing(false);
            setIsAISpeaking(false);
            console.log('Fallback WebSpeech ended, resuming continuous listening...');
            resumeListening();
          }
        };

        utterance.onerror = (event) => {
          if (isMountedRef.current) {
            console.error('Fallback WebSpeech error:', event.error);
            setCurrentSpeaker(null);
            setIsProcessing(false);
            setIsAISpeaking(false);
            console.log('Fallback WebSpeech error, resuming continuous listening...');
            resumeListening();
          }
        };

        try {
          synthRef.current.speak(utterance);
        } catch (error) {
          console.error('Failed to start WebSpeech:', error);
          setCurrentSpeaker(null);
          setIsProcessing(false);
          setTimeout(() => { if (!isMuted) startListening(); }, 150);
        }
        return;
      }

      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onplay = () => { if (isMountedRef.current) setCurrentSpeaker('ai'); };
      audio.onended = () => {
        if (isMountedRef.current) {
          setCurrentSpeaker(null);
          setIsProcessing(false);
          setIsAISpeaking(false);
          console.log('External TTS ended, resuming continuous listening...');
          resumeListening();
        }
        try { URL.revokeObjectURL(url); } catch {}
      };
      audio.onerror = () => {
        if (isMountedRef.current) {
          setCurrentSpeaker(null);
          setIsProcessing(false);
          setIsAISpeaking(false);
          console.log('External TTS error, resuming continuous listening...');
          resumeListening();
        }
      };
      await audio.play();
    } catch (e) {
      console.error('TTS playback failed:', e.message);

      // Fallback to WebSpeech if not already using it
      if (ttsProvider !== TTSProvider.WebSpeech) {
        console.warn('Attempting fallback to WebSpeech synthesis...');
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          const voice = voices.find(v => v.voiceURI === (selectedVoiceURI));
          if (voice) {
            utterance.voice = voice;
          }
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          utterance.onstart = () => {
            if (isMountedRef.current) {
              setCurrentSpeaker('ai');
              console.log('Final fallback WebSpeech started');
            }
          };
          utterance.onend = () => {
            if (isMountedRef.current) {
              setCurrentSpeaker(null);
              setIsProcessing(false);
              setIsAISpeaking(false);
              console.log('Final fallback WebSpeech ended, resuming continuous listening...');
              resumeListening();
            }
          };
          utterance.onerror = () => {
            if (isMountedRef.current) {
              setCurrentSpeaker(null);
              setIsProcessing(false);
              setIsAISpeaking(false);
              console.log('Final fallback WebSpeech error, resuming continuous listening...');
              resumeListening();
            }
          };
          synthRef.current.speak(utterance);
          return;
        } catch (fallbackError) {
          console.error('WebSpeech fallback also failed:', fallbackError);
        }
      }

      if (isMountedRef.current) {
        setCurrentSpeaker(null);
        setIsProcessing(false);
        setIsAISpeaking(false);
        console.log('TTS failed completely, resuming continuous listening...');
        resumeListening();
      }
    }
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
    console.log('User initiated disconnect - cleaning up all connections');
    cleanup();

    if (fullTranscript.length > 0 && onTranscriptSave) {
      onTranscriptSave(fullTranscript);
    }

    setIsConnected(false);
    setCurrentSpeaker(null);
    setIsProcessing(false);
    setTranscript("");
    setFullTranscript([]);
    setSpeechBuffer('');
  };

  const cleanup = () => {
    stopVoiceActivityDetection();

    // Clear keep-alive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }

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
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); ttsAudioRef.current.src = ''; } catch {}
      ttsAudioRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
    setIsContinuousListening(false);
    setIsAISpeaking(false);
    setSpeechBuffer('');
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
          <Label className="text-white/70">TTS Provider</Label>
          <Select value={ttsProvider} onValueChange={(val) => {
            if (isProviderAvailable(val)) {
              setTtsProvider(val);
              setDefaultTTSProvider(val);
            }
          }}>
            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/92">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border border-white/20">
              <SelectItem value={TTSProvider.WebSpeech} className="text-white/90 focus:bg-white/10">
                <div className="flex items-center justify-between w-full">
                  <span>Browser (Web Speech)</span>
                  <Badge variant="outline" className="border-green-400/50 text-green-300 text-xs">✓ Available</Badge>
                </div>
              </SelectItem>
              <SelectItem value={TTSProvider.OpenAI} className={`text-white/90 focus:bg-white/10 ${!isProviderAvailable(TTSProvider.OpenAI) ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between w-full">
                  <span>OpenAI</span>
                  {isProviderAvailable(TTSProvider.OpenAI) ? (
                    <Badge variant="outline" className="border-green-400/50 text-green-300 text-xs">✓ Available</Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-400/50 text-red-300 text-xs">API Key Needed</Badge>
                  )}
                </div>
              </SelectItem>
              <SelectItem value={TTSProvider.Google} className={`text-white/90 focus:bg-white/10 ${!isProviderAvailable(TTSProvider.Google) ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between w-full">
                  <span>Google</span>
                  {isProviderAvailable(TTSProvider.Google) ? (
                    <Badge variant="outline" className="border-green-400/50 text-green-300 text-xs">✓ Available</Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-400/50 text-red-300 text-xs">API Key Needed</Badge>
                  )}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {!isProviderAvailable(ttsProvider) && (
            <p className="text-xs text-red-400 mt-1">
              Selected provider requires an API key. Go to Settings → API Keys to configure.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-voice" className="text-white/70">AI Voice</Label>
          <Select value={selectedTtsVoiceId || ''} onValueChange={(val) => { setSelectedTtsVoiceId(val); setDefaultTTSVoice(val); }}>
            <SelectTrigger id="ai-voice" className="w-full bg-white/5 border-white/10 text-white/92">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border border-white/20">
              {availableTtsVoices.map(v => (
                <SelectItem key={v.id} value={v.id} className="text-white/90 focus:bg-white/10">
                  <div>
                    <div className="font-medium">{v.name}</div>
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
            w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300 relative
            ${isConnected
              ? currentSpeaker === 'user'
                ? 'bg-gradient-to-br from-cyan-400 to-violet-500 animate-pulse scale-110'
                : currentSpeaker === 'ai'
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse scale-110'
                  : currentSpeaker === 'thinking'
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 animate-pulse scale-110'
                    : isContinuousListening
                      ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-400/30'
                      : 'bg-gradient-to-br from-emerald-400 to-green-500'
              : 'bg-white/10 border-2 border-white/20'
            }
          `}>
            {isConnected ? (
              <Radio className="w-8 h-8 text-white" />
            ) : (
              <Phone className="w-8 h-8 text-white/60" />
            )}
            {/* Continuous listening indicator */}
            {isContinuousListening && !currentSpeaker && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
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
            {isContinuousListening && (
              <Badge variant="outline" className="border-emerald-400/20 text-emerald-300">
                Barge-in Active
              </Badge>
            )}
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
