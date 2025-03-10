"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Import useRouter
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import CreateProjectModal from "../CreateProjectModal/CreateProjectModal";

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter(); // ✅ Initialize router
  const [userID, setUserID] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false); // Modal control

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      setUserID(session.user.id);
    }
  }, [session, status]);

  const {
    data: projects,
    isLoading,
    error,
  } = api.project.getProjects.useQuery(undefined, { enabled: !!userID });

  if (status === "loading")
    return <p className="text-white">Loading session...</p>;
  if (!session)
    return <p className="text-red-500">Please log in to view your projects.</p>;
  if (isLoading) return <p className="text-white">Loading projects...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  // ✅ Function to handle project click
  const handleProjectClick = (projectId: number) => {
    router.push(`/projectdetails/${projectId}`);
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-md">
      <h1 className="mb-4 text-xl font-semibold text-white">Your Projects</h1>

      {/* Create New Project Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="mb-4 w-full rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
      >
        Create New Project
      </button>

      {/* Project List */}
      {projects && projects.length > 0 ? (
        <ul className="space-y-4">
          {projects.map(
            (project: {
              id: number;
              name: string;
              description: string | null;
            }) => (
              <li
                key={project.id}
                className="cursor-pointer rounded-lg bg-gray-700 p-4 transition hover:bg-gray-600"
                onClick={() => handleProjectClick(project.id)} // ✅ Clickable project
              >
                <h2 className="text-lg font-semibold text-white">
                  {project.name}
                </h2>
                <p className="text-gray-300">
                  {project.description ?? "No description provided."}
                </p>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="text-gray-400">No projects found.</p>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
