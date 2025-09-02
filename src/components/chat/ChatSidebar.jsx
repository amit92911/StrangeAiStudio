import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, X, FolderOpen, Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider delayDuration={300}>
      {/* Mobile Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar Container with proper layering */}
      <div className={cn(
        "relative z-50 h-full transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-80"
      )}>
        {/* Shadow overlay for depth */}
        <div className="absolute inset-y-0 -right-4 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
        
        {/* Main Sidebar */}
        <div className="h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800 flex flex-col shadow-xl">
          {/* Header */}
          <div className={cn(
            "border-b border-zinc-800 transition-all duration-300",
            isCollapsed ? "p-3" : "p-4"
          )}>
            <div className="flex items-center justify-between mb-4">
              {!isCollapsed && (
                <h2 className="text-lg font-semibold text-white/95 transition-opacity duration-200">
                  Chats
                </h2>
              )}
              
              <div className={cn(
                "flex items-center",
                isCollapsed ? "justify-center w-full" : "space-x-2"
              )}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronLeft className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={isCollapsed ? "right" : "left"}>
                    {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  </TooltipContent>
                </Tooltip>

                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Project Selector */}
            {!isCollapsed && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">
                    Projects
                  </label>
                  <Select 
                    value={selectedProject?.id || ""} 
                    onValueChange={(value) => {
                      const project = projects.find(p => p.id === value);
                      if (project) onProjectSelect(project);
                    }}
                  >
                    <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 transition-colors">
                      <div className="flex items-center">
                        <FolderOpen className="w-4 h-4 mr-2 text-zinc-400" />
                        <SelectValue placeholder="Select Project" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
            )}

            {/* Collapsed State Actions */}
            {isCollapsed && (
              <div className="flex flex-col items-center space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white hover:bg-white/10"
                      disabled={!selectedProject}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {selectedProject?.name || "No project selected"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onNewChat}
                      disabled={!selectedProject}
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    New Chat
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            <div className={cn("p-2", isCollapsed && "px-2")}>
              {chats.length === 0 ? (
                !isCollapsed && (
                  <div className="text-center py-8 text-zinc-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No chats yet</p>
                    <p className="text-xs">Create your first chat</p>
                  </div>
                )
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => {
                    const ChatButton = (
                      <button
                        onClick={() => onChatSelect(chat)}
                        className={cn(
                          "w-full text-left rounded-lg transition-all duration-200 group",
                          currentChat?.id === chat.id
                            ? 'bg-blue-600/20 border border-blue-600/30 shadow-lg shadow-blue-600/10'
                            : 'hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700',
                          isCollapsed ? "p-2.5" : "p-3"
                        )}
                      >
                        {isCollapsed ? (
                          <div className="flex justify-center">
                            {chat.hasVoiceMessages ? (
                              <Mic className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-medium text-zinc-100 truncate flex-1 group-hover:text-white transition-colors">
                                  {chat.title}
                                </h3>
                                {chat.hasVoiceMessages && (
                                  <Mic className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-zinc-500 text-xs border-zinc-700">
                                  {chat.current_model || 'gpt-4'}
                                </Badge>
                                <span className="text-xs text-zinc-600">
                                  {format(new Date(chat.updated_date), 'MMM d')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </button>
                    );

                    if (isCollapsed) {
                      return (
                        <Tooltip key={chat.id}>
                          <TooltipTrigger asChild>
                            {ChatButton}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div>
                              <p className="font-medium">{chat.title}</p>
                              <p className="text-xs text-zinc-400 mt-1">
                                {chat.current_model} • {format(new Date(chat.updated_date), 'MMM d')}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={chat.id}>{ChatButton}</div>;
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  );
}