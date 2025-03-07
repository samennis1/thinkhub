"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const [userID, setUserID] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      setUserID(session.user.id);
    }
  }, [session, status]);

  // ✅ Use the correct procedure: `getProjects` instead of `getProjectDetails`
  const { data: projects, isLoading, error } = api.project.getProjects.useQuery(
    undefined, // No input needed as `getProjects` fetches all for the authenticated user
    { enabled: !!userID } // ✅ Only fetch when `userID` is available
  );

  if (status === "loading") return <p className="text-white">Loading session...</p>;
  if (!session) return <p className="text-red-500">Please log in to view your projects.</p>;
  if (isLoading) return <p className="text-white">Loading projects...</p>;
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-md">
      <h1 className="mb-4 text-xl font-semibold text-white">Your Projects</h1>
      {projects && projects.length > 0 ? (
        <ul className="space-y-4">
          {projects.map((project: { id: number; name: string; description: string | null }) => (
            <li key={project.id} className="rounded-lg bg-gray-700 p-4">
              <h2 className="text-lg font-semibold text-white">{project.name}</h2>
              <p className="text-gray-300">{project.description || "No description provided."}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No projects found.</p>
      )}
    </div>
  );
}
