
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SocialShareButton from '@/components/social/SocialShareButton';
import { MapPin, Calendar, Target } from 'lucide-react';

interface ProjectShareCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    location: string;
    sdg_goal: string;
    project_status: string;
    created_at: string;
    beneficiaries: number;
  };
}

const ProjectShareCard: React.FC<ProjectShareCardProps> = ({ project }) => {
  const projectUrl = `${window.location.origin}/analytics?tab=reports&id=${project.id}`;
  
  const shareableTitle = `${project.title} - Sustainable Development Project in ${project.location}`;
  const shareableDescription = `${project.description} | Beneficiaries: ${project.beneficiaries.toLocaleString()} | Status: ${project.project_status} | Contributing to SDG goals for a better Africa.`;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {project.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">SDG {project.sdg_goal}</Badge>
              <Badge variant={project.project_status === 'completed' ? 'default' : 'secondary'}>
                {project.project_status}
              </Badge>
            </div>
          </div>
          <SocialShareButton
            title={shareableTitle}
            description={shareableDescription}
            url={projectUrl}
            data={project}
            type="project"
          />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {project.description.length > 150 
            ? `${project.description.slice(0, 150)}...` 
            : project.description
          }
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4 text-green-600" />
            <span className="font-medium">{project.beneficiaries.toLocaleString()}</span>
            <span className="text-muted-foreground">beneficiaries</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectShareCard;
