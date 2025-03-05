import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Project {
  id: number;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Error fetching project details:', error);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Created by: {project.createdBy}</p>
      <p>Created at: {new Date(project.createdAt).toLocaleString()}</p>
    </div>
  );
};

export default ProjectDetailsPage;