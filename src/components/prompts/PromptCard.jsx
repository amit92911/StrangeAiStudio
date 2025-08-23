import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Box } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function PromptCard({ prompt, onEdit, onDelete }) {
  return (
    <Card className="hover:border-white/20 transition-all duration-300 group flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-white/95 text-base">{prompt.title}</CardTitle>
          <p className="text-xs text-white/60 mt-1">Version {prompt.version || '1.0'}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 text-white/60 hover:text-white hover:bg-white/10">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} className="text-zinc-200">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-400">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-white/85 line-clamp-3 flex-1">{prompt.body}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {prompt.folder && <Badge className="bg-slate-600/10 text-slate-300 border-slate-600/20">{prompt.folder}</Badge>}
          {prompt.tags?.map(tag => (
            <Badge key={tag} variant="outline" className="text-white/60">{tag}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}