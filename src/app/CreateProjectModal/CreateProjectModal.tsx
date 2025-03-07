"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
}: CreateProjectModalProps) {
  const utils = api.useUtils();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createProject = api.project.create.useMutation({
    onSuccess: async (data) => {
      console.log("Mutation Success - Response Data:", data);

      await utils.project.invalidate();
      setName("");
      setDescription("");
      onClose();

      if (data?.projectId) {
        console.log("Project ID:", data.projectId);
        router.push(`/projectdetails/${data.projectId}`);
      } else {
        console.error("Project ID missing in response:", data);
      }
    },
    onError: (error) => {
      console.error("Mutation Error:", error);
    },
  });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-300"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transition-transform duration-200"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-lg">
              <Dialog.Title className="text-lg font-semibold text-white">
                Create a New Project
              </Dialog.Title>
              <Dialog.Description className="text-gray-400">
                Enter the project name and description below.
              </Dialog.Description>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Submitting project:", { name, description });
                  createProject.mutate({ name, description });
                }}
                className="mt-4 flex flex-col gap-4"
              >
                <input
                  type="text"
                  placeholder="Project Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2 text-black"
                  required
                />
                <textarea
                  placeholder="Project Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2 text-black"
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

              <button
                onClick={onClose}
                className="mt-3 w-full rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Close
              </button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
