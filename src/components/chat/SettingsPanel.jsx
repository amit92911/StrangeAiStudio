import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/api/integrations";
import { Message } from "@/api/entities";
import { deepgramVoice } from "@/api/functions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function SettingsPanel({ 
  isOpen, 
  onClose, 
  currentChat, 
  selectedModel, 
  selectedProvider,
  onTranscriptSave 
}) {
  // Voice mode states
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
  const [aecEnabled, setAecEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Chat settings states
  const [temperature, setTemperature] = useState(currentChat?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(currentChat?.max_tokens || 2048);
  const [topP, setTopP] = useState(currentChat?.top_p || 1);
  const [streamingSpeed, setStreamingSpeed] = useState(50);
  const [enableMemory, setEnableMemory] = useState(true);
  const [autoRename, setAutoRename] = useState(true);
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const synthRef = useRef(null);
  const isMountedRef = useRef(true);
  const silenceTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const vadRef = useRef(null);
  const keepAliveIntervalRef = useRef(null);
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

  // Voice mode functions (copied from VoiceMode.jsx)
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

  const loadTtsVoices = async (provider) => {
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

  const cleanup = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'User disconnected');
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

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div className="w-80 bg-card/60 backdrop-blur-xl border-l border-white/10 flex flex-col relative z-50">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white/95">Settings</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Voice Mode Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/80">Voice Mode</h3>
                <Badge variant="outline" className="text-xs">
                  {isConnected ? 'Active' : 'Ready'}
                </Badge>
              </div>

              {/* Voice Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aecEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-white/80 text-sm">Echo Cancellation</span>
                  </div>
                  <span className="text-xs text-white/60">
                    {aecEnabled ? 'Active' : 'Not available'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="text-white/80 text-sm">Mute Microphone</span>
                  <Switch 
                    checked={isMuted} 
                    onCheckedChange={setIsMuted}
                  />
                </div>

                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                  <span className="text-white/80 text-sm">Mute AI Voice</span>
                  <Switch 
                    checked={isSpeakerOff} 
                    onCheckedChange={setIsSpeakerOff}
                  />
                </div>
              </div>

              {/* TTS Settings */}
              <div className="space-y-3">
                <Label className="text-white/70 text-sm">TTS Provider</Label>
                <Select value={ttsProvider} onValueChange={(val) => { setTtsProvider(val); setDefaultTTSProvider(val); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TTSProvider.WebSpeech}>Browser (Web Speech)</SelectItem>
                    <SelectItem value={TTSProvider.OpenAI}>OpenAI</SelectItem>
                    <SelectItem value={TTSProvider.Google}>Google</SelectItem>
                  </SelectContent>
                </Select>

                <Label className="text-white/70 text-sm">AI Voice</Label>
                <Select value={selectedTtsVoiceId || ''} onValueChange={(val) => { setSelectedTtsVoiceId(val); setDefaultTTSVoice(val); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTtsVoices.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        <div>
                          <div className="font-medium">{v.name}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Status */}
              {isConnected && (
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="text-center">
                    <div className={`
                      w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 transition-all duration-300
                      ${currentSpeaker === 'user'
                        ? 'bg-gradient-to-br from-cyan-400 to-violet-500 animate-pulse scale-110'
                        : currentSpeaker === 'ai'
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse scale-110'
                          : currentSpeaker === 'thinking'
                            ? 'bg-gradient-to-br from-orange-400 to-red-500 animate-pulse scale-110'
                            : 'bg-gradient-to-br from-emerald-400 to-green-500'
                      }
                    `}>
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-white/80">
                      {currentSpeaker === 'thinking' ? 'AI Thinking' : currentSpeaker === 'ai' ? 'AI Speaking' : 'Voice Active'}
                    </p>
                  </div>
                </div>
              )}

              {/* Voice Controls */}
              <div className="flex items-center justify-center space-x-2">
                {!isConnected ? (
                  <Button
                    className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white"
                    size="sm"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Start Voice Mode
                  </Button>
                ) : (
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    size="sm"
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    Stop Voice Mode
                  </Button>
                )}
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Chat Settings Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/80">Chat Settings</h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Temperature: {temperature.toFixed(2)}</Label>
                  <Slider
                    value={[temperature]}
                    onValueChange={(value) => setTemperature(value[0])}
                    max={2}
                    min={0}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="text-xs text-white/50">Higher values make output more random</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Max Tokens</Label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="text-white/92"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Top P: {topP.toFixed(2)}</Label>
                  <Slider
                    value={[topP]}
                    onValueChange={(value) => setTopP(value[0])}
                    max={1}
                    min={0}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Streaming Speed: {streamingSpeed}%</Label>
                  <Slider
                    value={[streamingSpeed]}
                    onValueChange={(value) => setStreamingSpeed(value[0])}
                    max={100}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white/70 text-sm">Auto-rename chats</Label>
                  <Switch checked={autoRename} onCheckedChange={setAutoRename} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white/70 text-sm">Enable memory</Label>
                  <Switch checked={enableMemory} onCheckedChange={setEnableMemory} />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
