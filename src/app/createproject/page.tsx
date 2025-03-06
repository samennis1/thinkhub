"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function CreateProjectPage() {
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createProject = api.project.create.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setDescription("");
    },
  });

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-md">
      <h1 className="mb-4 text-xl font-semibold text-white">Create Project</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createProject.mutate({
            name,
            description,
          });
        }}
        className="flex flex-col gap-4"
      >
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-4 py-2 text-black"
          required
        />
        <textarea
          placeholder="Project Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg px-4 py-2 text-black"
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
          disabled={createProject.isPending}
        >
          {createProject.isPending ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
