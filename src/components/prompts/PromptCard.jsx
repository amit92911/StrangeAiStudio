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
    <Card className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 group flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-zinc-200 text-base">{prompt.title}</CardTitle>
          <p className="text-xs text-zinc-500 mt-1">Version {prompt.version || '1.0'}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800">
            <DropdownMenuItem onClick={onEdit} className="text-zinc-200 focus:bg-zinc-800">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:bg-red-500/20 focus:text-red-300">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-zinc-300 line-clamp-3 flex-1">{prompt.body}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {prompt.folder && <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">{prompt.folder}</Badge>}
          {prompt.tags?.map(tag => (
            <Badge key={tag} variant="outline" className="border-zinc-700 text-zinc-400">{tag}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}