import React, { useState, useEffect } from "react";
import { Prompt } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Library } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import PromptCard from "../components/prompts/PromptCard";
import PromptEditorModal from "../components/prompts/PromptEditorModal";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = prompts.filter(p => 
      p.title.toLowerCase().includes(lowercasedQuery) ||
      p.body.toLowerCase().includes(lowercasedQuery) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(lowercasedQuery)))
    );
    setFilteredPrompts(filtered);
  }, [searchQuery, prompts]);

  const loadPrompts = async () => {
    setLoading(true);
    const data = await Prompt.list('-updated_date');
    setPrompts(data);
    setFilteredPrompts(data);
    setLoading(false);
  };

  const handleSavePrompt = async (promptData) => {
    if (editingPrompt && editingPrompt.id) {
      await Prompt.update(editingPrompt.id, promptData);
    } else {
      await Prompt.create(promptData);
    }
    setEditingPrompt(null);
    await loadPrompts();
  };

  const handleDeletePrompt = async (promptId) => {
    await Prompt.delete(promptId);
    await loadPrompts();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/92">Prompt Library</h1>
          <Button
            onClick={() => setEditingPrompt({})}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Prompt
          </Button>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search prompts by title, content, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-white/5 border-white/10 text-white/92 placeholder:text-white/40 focus:border-cyan-400/50"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-7xl mx-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-white/60">Loading...</div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <Library className="w-12 h-12 mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-semibold text-white/92">No Prompts Found</h3>
              <p className="text-white/60 mt-2">Create a prompt to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onEdit={() => setEditingPrompt(prompt)}
                  onDelete={() => handleDeletePrompt(prompt.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {editingPrompt && (
        <PromptEditorModal
          prompt={editingPrompt}
          onClose={() => setEditingPrompt(null)}
          onSave={handleSavePrompt}
        />
      )}
    </div>
  );
}