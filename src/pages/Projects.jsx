import React, { useState, useEffect } from "react";
import { Project } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Settings, Trash2, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import ProjectCard from "../components/projects/ProjectCard";
import CreateProjectModal from "../components/projects/CreateProjectModal";

const colorThemes = {
  azure: "from-blue-400 to-cyan-500",
  violet: "from-violet-400 to-purple-500", 
  cyan: "from-cyan-400 to-teal-500",
  emerald: "from-emerald-400 to-green-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-pink-500"
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await Project.list('-created_date');
    setProjects(data);
    setLoading(false);
  };

  const handleCreateProject = async (projectData) => {
    await Project.create(projectData);
    await loadProjects();
    setShowCreateModal(false);
  };

  const handleDeleteProject = async (projectId) => {
    await Project.delete(projectId);
    await loadProjects();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white/92 mb-2">Projects</h1>
            <p className="text-white/60">Organize your AI conversations by project</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-xl font-semibold text-white/92 mb-2">No projects yet</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Create your first project to organize your AI conversations and manage prompts, files, and settings.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateProject}
          />
        )}
      </div>
    </div>
  );
}