import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, X, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "bg-card/60 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-80"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn("text-lg font-semibold text-white/95", isCollapsed && "sr-only")}>Chats</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
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

          {/* Project Selector */}
          <div className={cn("mb-3", isCollapsed && "hidden")}>
            <Select 
              value={selectedProject?.id || ""} 
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value);
                if (project) onProjectSelect(project);
              }}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <FolderOpen className="w-4 h-4 mr-2 text-white/60" />
                  <SelectValue placeholder="Select Project" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-white/90">
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
            className={cn(
              "w-full bg-slate-700 hover:bg-slate-600 text-white",
              isCollapsed && "w-10 h-10 p-0 justify-center"
            )}
          >
            <Plus className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
            <span className={cn(isCollapsed && "sr-only")}>New Chat</span>
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {chats.length === 0 ? (
              <div className={cn("text-center py-8 text-white/60", isCollapsed && "hidden")}>
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
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all duration-200",
                      currentChat?.id === chat.id
                        ? 'bg-white/10 border border-white/10'
                        : 'hover:bg-white/5 border border-transparent'
                    )}
                    title={isCollapsed ? chat.title : undefined}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className={cn("text-sm font-medium text-white/90 truncate", isCollapsed && "sr-only")}>
                          {chat.title}
                        </h3>
                        <div className={cn("flex items-center space-x-2 mt-1", isCollapsed && "hidden")}>
                          <Badge variant="outline" className="text-white/60 text-xs">
                            {chat.current_model || 'gpt-4'}
                          </Badge>
                          <span className="text-xs text-white/50">
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