  "use client";

  import { useState, Fragment } from "react";
  import { useRouter } from "next/navigation";
  import { Dialog, Transition } from "@headlessui/react";
  import { api } from "~/trpc/react";

  interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
  }

  interface SelectedMember {
    id: string;
    email: string;
    name?: string;
    role: "Manager" | "Researcher" | "Viewer";
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
    const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
    const [selectedRole, setSelectedRole] = useState<
      "Manager" | "Researcher" | "Viewer"
    >("Researcher");

    const { data: searchResults } = api.member.searchUsersByEmail.useQuery(
      { email: memberEmail, projectId: 0 }, // Dummy projectId for search
      { enabled: memberEmail.length >= 3 }, // Search only when 3+ characters entered
    );

    const createProject = api.project.create.useMutation({
      onSuccess: async (data) => {
        await utils.project.invalidate();
        setName("");
        setDescription("");

        const projectId = Array.isArray(data) && data[0]?.id ? data[0].id : data;

        if (typeof projectId === "number") {
          // Add selected members to the project
          await Promise.all(
            selectedMembers.map((member) =>
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

    const addMemberMutation = api.member.addMember.useMutation({
      onSuccess: () => {
        setMemberEmail("");
        setSelectedMembers([]);
        setSelectedRole("Researcher");
      },
      onError: (error) => {
        console.error("Error adding member:", error);
        alert(error.message);
      },
    });

    const handleSelectUser = (user: {
      id: string;
      email: string;
      name?: string;
    }) => {
      const newMember: SelectedMember = {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: selectedRole,
      };

      if (!selectedMembers.some((member) => member.id === user.id)) {
        setSelectedMembers([...selectedMembers, newMember]);
      }
    };

    const handleRemoveMember = (userId: string) => {
      setSelectedMembers(
        selectedMembers.filter((member) => member.id !== userId),
      );
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
                          className="cursor-pointer p-2 hover:bg-blue-600"
                          onClick={() => handleSelectUser(user)}
                        >
                          {user.name ?? user.email}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Selected Members Display */}
                  {selectedMembers.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {selectedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-md bg-blue-600 p-2 text-white"
                        >
                          <span>
                            {member.name ?? member.email} - {member.role}
                          </span>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(
                        e.target.value as "Manager" | "Researcher" | "Viewer",
                      )
                    }
                    className="w-full rounded-lg border px-4 py-2 text-black"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Researcher">Researcher</option>
                    <option value="Viewer">Viewer</option>
                  </select>

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
