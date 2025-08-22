import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Sparkles, Code } from "lucide-react";

const providerIcons = {
  openai: Sparkles,
  anthropic: Brain,
  google: Zap,
  deepseek: Code
};

const providerColors = {
  openai: "from-green-400 to-emerald-500",
  anthropic: "from-orange-400 to-red-500", 
  google: "from-blue-400 to-indigo-500",
  deepseek: "from-purple-400 to-violet-500"
};

export default function ModelSelector({ 
  providers, 
  selectedProvider, 
  selectedModel, 
  onProviderChange, 
  onModelChange 
}) {
  const currentProvider = providers.find(p => p.id === selectedProvider);
  const Icon = providerIcons[selectedProvider] || Sparkles;

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedProvider} onValueChange={onProviderChange}>
        <SelectTrigger className="w-40">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded bg-gradient-to-r ${providerColors[selectedProvider]} flex items-center justify-center`}>
              <Icon className="w-2.5 h-2.5 text-white" />
            </div>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => {
            const ProviderIcon = providerIcons[provider.id] || Sparkles;
            return (
              <SelectItem key={provider.id} value={provider.id} className="text-zinc-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded bg-gradient-to-r ${providerColors[provider.id]} flex items-center justify-center`}>
                    <ProviderIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span>{provider.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currentProvider?.models.map((model) => (
            <SelectItem key={model} value={model} className="text-zinc-200">
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}