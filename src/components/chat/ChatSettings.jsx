import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function ChatSettings({ onClose, currentChat }) {
  const [temperature, setTemperature] = useState(currentChat?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(currentChat?.max_tokens || 2048);
  const [topP, setTopP] = useState(currentChat?.top_p || 1);
  const [streamingSpeed, setStreamingSpeed] = useState(50);
  const [enableMemory, setEnableMemory] = useState(true);
  const [autoRename, setAutoRename] = useState(true);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white/92">Chat Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Model Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80">Model Parameters</h3>
            
            <div className="space-y-2">
              <Label className="text-white/72">Temperature: {temperature.toFixed(2)}</Label>
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
              <Label className="text-white/72">Max Tokens</Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="bg-white/8 border-white/20 text-white/92"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/72">Top P: {topP.toFixed(2)}</Label>
              <Slider
                value={[topP]}
                onValueChange={(value) => setTopP(value[0])}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* UI Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80">Interface</h3>
            
            <div className="space-y-2">
              <Label className="text-white/72">Streaming Speed: {streamingSpeed}%</Label>
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
              <Label className="text-white/72">Auto-rename chats</Label>
              <Switch checked={autoRename} onCheckedChange={setAutoRename} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-white/72">Enable memory</Label>
              <Switch checked={enableMemory} onCheckedChange={setEnableMemory} />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="border-white/20 text-white/72">
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-cyan-500 to-violet-500">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}