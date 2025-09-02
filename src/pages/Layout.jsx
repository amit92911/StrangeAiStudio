

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MessageSquare,
  FolderOpen,
  Library,
  Settings,
  Search,
  Plus,
  Menu,
  X,
  Sparkles,
  BarChart3,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigationItems = [
  {
    title: "Chat",
    url: createPageUrl("Chat"),
    icon: MessageSquare,
    section: "main"
  },
  {
    title: "Projects",
    url: createPageUrl("Projects"),
    icon: FolderOpen,
    section: "main"
  },
  {
    title: "Prompts",
    url: createPageUrl("Prompts"),
    icon: Library,
    section: "main"
  },
  {
    title: "API Keys",
    url: createPageUrl("APIKeys"),
    icon: Key,
    section: "tools"
  },
  {
    title: "Usage",
    url: createPageUrl("Usage"),
    icon: BarChart3,
    section: "tools"
  },
  
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
    section: "tools"
  }
];


export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const SidebarContent = () => (
    <TooltipProvider delayDuration={300}>
      <div className="h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800 flex flex-col shadow-2xl relative">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/0 via-zinc-900/50 to-zinc-900/0 pointer-events-none" />
      {/* Header with Collapse Button */}
      <div className={cn(
        "border-b border-zinc-800 flex flex-col transition-all duration-300 relative z-10",
        isCollapsed ? "p-3 items-center" : "p-6"
      )}>
        <div className="flex items-center justify-between w-full mb-4">
          <Link to={createPageUrl("Chat")} className={cn("flex items-center space-x-3", isCollapsed && "hidden")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className={cn("transition-opacity duration-200", isCollapsed && "opacity-0 w-0")}>
              <h1 className="text-lg font-semibold text-white/95 whitespace-nowrap brand-strangeai-title">strangeAi</h1>
              <p className="text-xs text-white/60 whitespace-nowrap brand-strangeai-subtitle">studio</p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-zinc-800/50 border-zinc-700 placeholder:text-zinc-500 hover:bg-zinc-800 focus:bg-zinc-800 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 relative z-10">
        {/* Main Navigation */}
        <div className={cn("mb-8", isCollapsed ? "px-3" : "px-4")}>
          <div className="space-y-1">
            {navigationItems.filter(item => item.section === 'main').map((item) => (
              <Link
                key={item.title}
                to={item.url}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 group",
                  location.pathname === item.url
                    ? 'bg-blue-600/20 border border-blue-600/30 text-white shadow-lg shadow-blue-600/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent',
                  isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  !isCollapsed && "mr-3",
                  location.pathname === item.url ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                {!isCollapsed && (
                  <span className="font-medium">{item.title}</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className={cn(isCollapsed ? "px-3" : "px-4")}>
          {!isCollapsed && (
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-3">
              Tools
            </h3>
          )}
          <div className="space-y-1">
            {navigationItems.filter(item => item.section === 'tools').map((item) => (
              <Link
                key={item.title}
                to={item.url}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 group",
                  location.pathname === item.url
                    ? 'bg-blue-600/20 border border-blue-600/30 text-white shadow-lg shadow-blue-600/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent',
                  isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  !isCollapsed && "mr-3",
                  location.pathname === item.url ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                {!isCollapsed && (
                  <span className="font-medium">{item.title}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-slate-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-slate-300/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-slate-400/5 rounded-full blur-3xl" />
      </div>

      <div className="flex h-screen relative">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-24" : "w-80"
        )}>
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <aside className={cn(`
          fixed lg:hidden inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `)}>
          <SidebarContent />
        </aside>

        {/* Overlay for mobile */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="lg:hidden bg-card/60 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold text-white/95 brand-strangeai-title">strangeAi</h2>
              <div className="w-10" /> {/* Spacer */}
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

