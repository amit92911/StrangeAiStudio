import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";

const colorOptions = [
  { id: 'azure', name: 'Azure', class: 'from-blue-400 to-cyan-500' },
  { id: 'violet', name: 'Violet', class: 'from-violet-400 to-purple-500' },
  { id: 'cyan', name: 'Cyan', class: 'from-cyan-400 to-teal-500' },
  { id: 'emerald', name: 'Emerald', class: 'from-emerald-400 to-green-500' },
  { id: 'amber', name: 'Amber', class: 'from-amber-400 to-orange-500' },
  { id: 'rose', name: 'Rose', class: 'from-rose-400 to-pink-500' }
];

export default function CreateProjectModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memory_enabled: true,
    color: 'azure',
    system_prompt: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onCreate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 text-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-zinc-200">Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label className="text-zinc-400">Project Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name"
              className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500/50"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-zinc-400">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your project..."
              className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500/50 h-20"
            />
          </div>

          {/* Color Theme */}
          <div className="space-y-3">
            <Label className="text-zinc-400">Color Theme</Label>
            <RadioGroup 
              value={formData.color} 
              onValueChange={(value) => handleInputChange('color', value)}
              className="grid grid-cols-3 gap-3"
            >
              {colorOptions.map((color) => (
                <div key={color.id} className="flex items-center">
                  <RadioGroupItem value={color.id} id={color.id} className="sr-only peer" />
                  <label
                    htmlFor={color.id}
                    className={`
                      w-full h-10 rounded-lg bg-gradient-to-r ${color.class} cursor-pointer 
                      border-2 border-transparent peer-checked:border-zinc-300 
                      hover:scale-105 transition-transform duration-200
                      flex items-center justify-center text-white font-medium text-sm
                    `}
                  >
                    {color.name}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Memory Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-zinc-400">Enable Memory</Label>
              <p className="text-xs text-zinc-500 mt-1">Remember context across conversations</p>
            </div>
            <Switch 
              checked={formData.memory_enabled}
              onCheckedChange={(checked) => handleInputChange('memory_enabled', checked)}
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label className="text-zinc-400">System Prompt (Optional)</Label>
            <Textarea
              value={formData.system_prompt}
              onChange={(e) => handleInputChange('system_prompt', e.target.value)}
              placeholder="Set a default system prompt for this project..."
              className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus:border-indigo-500/50 h-24"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}