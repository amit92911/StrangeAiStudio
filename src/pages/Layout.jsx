

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
    <div className="h-full bg-card/60 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Header with Collapse Button */}
      <div className={cn("p-6 border-b border-white/10 flex flex-col", isCollapsed ? "p-3 items-center" : "")}> 
        <div className="flex items-center justify-between w-full mb-4">
          <Link to={createPageUrl("Chat")} className={cn("flex items-center space-x-3", isCollapsed && "hidden")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-zinc-50" />
            </div>
            <div className={cn("transition-opacity duration-200", isCollapsed && "opacity-0 w-0")}>
              <h1 className="text-lg font-semibold text-white/95 whitespace-nowrap brand-strangeai-title">strangeAi</h1>
              <p className="text-xs text-white/60 whitespace-nowrap brand-strangeai-subtitle">studio</p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-white/60 hover:text-white hover:bg-white/10"
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
        <div className={cn("relative w-full", isCollapsed && "hidden")}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search..."
            className="pl-10 placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Main Actions */}
        <div className="px-4 mb-6">
          <Link to={createPageUrl("Chat")}>
            <Button className={cn("w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium", isCollapsed && "w-12 h-12 p-0 justify-center")}> 
              <Plus className={cn("w-5 h-5", !isCollapsed && "mr-2")} />
              <span className={cn(isCollapsed && "sr-only")}>New Chat</span>
            </Button>
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="px-4 mb-8">
          <div className="space-y-1">
            {navigationItems.filter(item => item.section === 'main').map((item) => (
              <Link
                key={item.title}
                to={item.url}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-xl transition-all duration-200",
                  location.pathname === item.url
                    ? 'bg-white/10 border border-white/10 text-white shadow'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
                <span className={cn("font-medium", isCollapsed && "sr-only")}>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className="px-4">
          <h3 className={cn("text-xs font-medium text-white/50 uppercase tracking-wider mb-3 px-3", isCollapsed && "sr-only")}> 
            Tools
          </h3>
          <div className="space-y-1">
            {navigationItems.filter(item => item.section === 'tools').map((item) => (
              <Link
                key={item.title}
                to={item.url}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-xl transition-all duration-200",
                  location.pathname === item.url
                    ? 'bg-white/10 border border-white/10 text-white shadow'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
                <span className={cn("font-medium", isCollapsed && "sr-only")}>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient blooms */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
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

