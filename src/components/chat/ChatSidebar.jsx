import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, X, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ChatSidebar({ 
  isOpen, 
  chats, 
  currentChat, 
  projects,
  selectedProject,
  onChatSelect, 
  onNewChat, 
  onProjectSelect,
  onClose 
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="w-80 bg-zinc-900/60 backdrop-blur-xl border-r border-zinc-800 flex flex-col relative z-50">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-200">Chats</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Project Selector */}
          <div className="mb-3">
            <Select 
              value={selectedProject?.id || ""} 
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value);
                if (project) onProjectSelect(project);
              }}
            >
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-200">
                <div className="flex items-center">
                  <FolderOpen className="w-4 h-4 mr-2 text-zinc-400" />
                  <SelectValue placeholder="Select Project" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-zinc-200 focus:bg-zinc-800">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={onNewChat}
            disabled={!selectedProject}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs">Create your first chat</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onChatSelect(chat)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-all duration-200
                      ${currentChat?.id === chat.id
                        ? 'bg-zinc-800 border border-zinc-700'
                        : 'hover:bg-zinc-800 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-zinc-200 truncate">
                          {chat.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                            {chat.current_model || 'gpt-4'}
                          </Badge>
                          <span className="text-xs text-zinc-500">
                            {format(new Date(chat.updated_date), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}