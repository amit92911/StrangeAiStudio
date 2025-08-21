import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Settings, 
  Trash2, 
  MessageSquare, 
  FileText,
  Brain,
  Calendar
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

const colorThemes = {
  azure: "from-blue-400 to-cyan-500",
  violet: "from-violet-400 to-purple-500", 
  cyan: "from-cyan-400 to-teal-500",
  emerald: "from-emerald-400 to-green-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-pink-500"
};

export default function ProjectCard({ project, onDelete }) {
  const gradientClass = colorThemes[project.color] || colorThemes.azure;

  return (
    <Card className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-zinc-200 text-lg">{project.name}</CardTitle>
              <p className="text-zinc-400 text-sm mt-1">
                {format(new Date(project.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800">
              <DropdownMenuItem className="text-zinc-200 focus:bg-zinc-800">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-400 focus:bg-red-500/20 focus:text-red-300"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {project.description && (
          <p className="text-zinc-300 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {project.memory_enabled && (
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Memory
            </Badge>
          )}
          {project.default_model && (
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
              {project.default_model}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              <span>0 chats</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              <span>0 files</span>
            </div>
          </div>
          
          <Link to={createPageUrl("Chat", `project=${project.id}`)}>
            <Button size="sm" className={`bg-gradient-to-r ${gradientClass} text-white hover:opacity-90`}>
              Open
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}