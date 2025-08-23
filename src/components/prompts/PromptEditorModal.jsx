import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PromptEditorModal({ prompt, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: prompt?.title || '',
    body: prompt?.body || '',
    folder: prompt?.folder || '',
    tags: prompt?.tags?.join(', ') || '',
    version: prompt?.version || '1.0'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    onSave(finalData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl text-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-zinc-200">{prompt?.id ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="text-zinc-200"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Prompt Body</Label>
            <Textarea
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              className="text-zinc-200 min-h-[200px]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Folder (Optional)</Label>
              <Input
                value={formData.folder}
                onChange={(e) => handleInputChange('folder', e.target.value)}
                className="text-zinc-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="text-zinc-200"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="text-zinc-400">Cancel</Button>
            <Button type="submit" className="bg-slate-700 hover:bg-slate-600">Save Prompt</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}