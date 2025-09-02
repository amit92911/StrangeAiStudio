import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Mic } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPanel({ 
  isOpen, 
  onClose, 
  currentChat,
  voiceSettings,
  setVoiceSettings
}) {
  // Chat settings states
  const [temperature, setTemperature] = useState(currentChat?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(currentChat?.max_tokens || 2048);
  const [topP, setTopP] = useState(currentChat?.top_p || 1);
  const [streamingSpeed, setStreamingSpeed] = useState(50);
  const [enableMemory, setEnableMemory] = useState(true);
  const [autoRename, setAutoRename] = useState(true);
  
  // Voice settings states
  const [localVoiceSettings, setLocalVoiceSettings] = useState(voiceSettings || {
    voice: "alloy",
    model: "gpt-4o-realtime-preview-2024-10-01",
    temperature: 0.8,
    vadThreshold: 0.5,
    silenceDuration: 200,
    instructions: "You are a helpful, witty, and friendly AI assistant. Keep your responses concise and conversational."
  });

  const handleVoiceSettingChange = (key, value) => {
    const newSettings = { ...localVoiceSettings, [key]: value };
    setLocalVoiceSettings(newSettings);
    setVoiceSettings?.(newSettings);
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
      <div className="w-80 sm:w-96 lg:w-80 xl:w-96 bg-card/60 backdrop-blur-xl border-l border-white/10 flex flex-col relative z-50 max-w-[90vw]">
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

            {/* Voice Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-medium text-white/80">Voice Settings</h3>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">API Key Status</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${localStorage.getItem('OPENAI_API_KEY') ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-white/50">
                      {localStorage.getItem('OPENAI_API_KEY') ? 'API key configured' : 'No API key found'}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Configure your OpenAI API key in the <span className="text-white/70">API Keys</span> page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Voice Model</Label>
                  <Select
                    value={localVoiceSettings.model}
                    onValueChange={(value) => handleVoiceSettingChange('model', value)}
                  >
                    <SelectTrigger className="text-white/92">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-realtime-preview-2024-10-01">GPT-4o Realtime Preview</SelectItem>
                      <SelectItem value="gpt-4o-mini-realtime-preview-2024-12-17">GPT-4o Mini Realtime Preview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Voice</Label>
                  <Select
                    value={localVoiceSettings.voice}
                    onValueChange={(value) => handleVoiceSettingChange('voice', value)}
                  >
                    <SelectTrigger className="text-white/92">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="ash">Ash</SelectItem>
                      <SelectItem value="ballad">Ballad</SelectItem>
                      <SelectItem value="coral">Coral</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="sage">Sage</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                      <SelectItem value="verse">Verse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Voice Temperature: {localVoiceSettings.temperature.toFixed(2)}</Label>
                  <Slider
                    value={[localVoiceSettings.temperature]}
                    onValueChange={(value) => handleVoiceSettingChange('temperature', value[0])}
                    max={1.2}
                    min={0.6}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-white/50">Higher values make responses more creative</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">VAD Threshold: {localVoiceSettings.vadThreshold.toFixed(2)}</Label>
                  <Slider
                    value={[localVoiceSettings.vadThreshold]}
                    onValueChange={(value) => handleVoiceSettingChange('vadThreshold', value[0])}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-white/50">Voice activity detection sensitivity</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">Silence Duration (ms)</Label>
                  <Input
                    type="number"
                    value={localVoiceSettings.silenceDuration}
                    onChange={(e) => handleVoiceSettingChange('silenceDuration', parseInt(e.target.value))}
                    min="100"
                    max="1000"
                    step="50"
                    className="text-white/92"
                  />
                  <p className="text-xs text-white/50">Wait time before AI responds</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70 text-sm">System Instructions</Label>
                  <Textarea
                    value={localVoiceSettings.instructions}
                    onChange={(e) => handleVoiceSettingChange('instructions', e.target.value)}
                    className="text-white/92 min-h-[100px] text-sm"
                    placeholder="Instructions for the AI assistant..."
                  />
                  <p className="text-xs text-white/50">Define how the AI should behave in voice chat</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}