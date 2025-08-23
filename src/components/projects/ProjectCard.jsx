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
  azure: "from-slate-600 to-slate-700",
  violet: "from-slate-700 to-slate-800", 
  cyan: "from-slate-600 to-slate-700",
  emerald: "from-slate-700 to-slate-800",
  amber: "from-slate-600 to-slate-700",
  rose: "from-slate-700 to-slate-800"
};

export default function ProjectCard({ project, onDelete }) {
  const gradientClass = colorThemes[project.color] || colorThemes.azure;

  return (
    <Card className="hover:border-white/20 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white/95 text-lg">{project.name}</CardTitle>
              <p className="text-white/60 text-sm mt-1">
                {format(new Date(project.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white hover:bg-white/10"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-zinc-200">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-400"
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
          <p className="text-white/80 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {project.memory_enabled && (
            <Badge variant="outline" className="text-white/60 text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Memory
            </Badge>
          )}
          {project.default_model && (
            <Badge variant="outline" className="text-white/60 text-xs">
              {project.default_model}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-white/60">
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
            <Button size="sm" className="bg-slate-700 hover:bg-slate-600 text-white">
              Open
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}