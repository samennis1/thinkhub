"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { api } from "~/trpc/react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PendingMember {
  id: string;
  email: string;
  name?: string;
  role: "Manager" | "Researcher" | "Viewer";
}

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
}: CreateProjectModalProps) {
  const utils = api.useUtils();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Member Management
  const [memberEmail, setMemberEmail] = useState("");
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);

  const { data: searchResults } = api.project.searchUsersByEmail.useQuery(
    { email: memberEmail },
    { enabled: memberEmail.length >= 3 },
  );

  const { data: preciseUser, refetch: refetchUser } =
    api.project.getUserIdByEmail.useQuery(
      { email: memberEmail },
      { enabled: false },
    );

  const createProject = api.project.create.useMutation({
    onSuccess: async (data) => {
      await utils.project.invalidate();
      setName("");
      setDescription("");

      const projectId = Array.isArray(data) && data[0]?.id ? data[0].id : data;

      if (typeof projectId === "number") {
        await Promise.all(
          pendingMembers.map((member) =>
            addMemberMutation.mutateAsync({
              projectId,
              email: member.email,
              role: member.role,
            }),
          ),
        );

        router.push(`/projectdetails/${projectId}`);
      } else {
        console.error("Unexpected data format:", data);
      }

      onClose();
    },
  });

  const addMemberMutation = api.project.addMember.useMutation({
    onSuccess: () => {
      setMemberEmail("");
      setPendingMembers([]);
    },
    onError: (error) => {
      console.error("Error adding member:", error);
      alert(error.message);
    },
  });

  // Add a selected user to pending members
  const handleSelectUser = (user: User) => {
    const isAlreadyAdded = pendingMembers.some(
      (member) => member.id === user.id,
    );

    if (!isAlreadyAdded) {
      setPendingMembers((prev) => [
        ...prev,
        { ...user, role: "Researcher" }, // Default role
      ]);
    }
    setMemberEmail(""); // Clear search field after adding
  };

  const handleAddExactUser = async () => {
    await refetchUser();

    if (!preciseUser) {
      alert("User not found.");
      return;
    }

    const isAlreadyAdded = pendingMembers.some(
      (member) => member.id === preciseUser.id,
    );

    if (!isAlreadyAdded) {
      setPendingMembers((prev) => [
        ...prev,
        { ...preciseUser, role: "Researcher", name: preciseUser.name ?? undefined }, // Default role
      ]);
    }

    setMemberEmail(""); // Clear search field after adding
  };

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
                Enter the project details and add members.
              </Dialog.Description>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
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

                {/* Member Search Input */}
                <input
                  type="text"
                  placeholder="Search by Email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2 text-black"
                />

                {/* Search Results List */}
                {searchResults && searchResults.length > 0 && (
                  <ul className="rounded-md bg-gray-700 p-2 text-white">
                    {searchResults.map((user) => (
                      <li
                        key={user.id}
                        className={`cursor-pointer p-2 hover:bg-blue-600`}
                        onClick={() =>
                          handleSelectUser({
                            id: user.id,
                            email: user.email,
                            name: user.name ?? undefined,
                          })
                        }
                      >
                        {user.name ?? user.email}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Exact Match Add */}
                <button
                  type="button"
                  className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-white"
                  onClick={handleAddExactUser}
                >
                  Add Exact Match
                </button>

                {/* Pending Members List */}
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-700">
                    Pending Members
                  </h3>
                  {pendingMembers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No members added yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {pendingMembers.map((member, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded-md bg-gray-200 p-2"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {member.name ?? member.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.email}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

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
