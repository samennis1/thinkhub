"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

enum TaskStatus {
  ToDo = "To Do",
  InProgress = "In Progress",
  Completed = "Completed",
}

enum TaskPriority {
  Highest = "1",
  High = "2",
  Medium = "3",
  Low = "4",
  Lowest = "5",
}

interface Task {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  dueDate: Date | null;
  milestoneId: number | null;
  order: number;
  status: TaskStatus;
  priority: TaskPriority;
  policyHeader: string;
  policyContent: string;
  recommendedContent: string;
  documentId: number | null;
  projectId: number;
  assignedTo: string;
}

interface DocumentType {
  id: number;
  createdAt: Date;
  projectId: number;
  title: string;
  uploadedBy: string;
  fileUrl: string | null;
}

interface ProjectMember {
  id: number;
  userId: string;
  projectId: number;
  role: "Manager" | "Researcher" | "Viewer";
  joinedAt: Date | null;
  name: string;
}

interface TaskModalProps {
  taskId: number;
  onClose: () => void;
}

export function TaskModal({ taskId, onClose }: TaskModalProps) {
  const [task] = api.tasks.getTask.useSuspenseQuery<Task>({ taskId });
  const [documents] = api.project.getDocuments.useSuspenseQuery<DocumentType[]>(
    {
      projectId: task?.projectId ?? null,
    },
  );

  const [fetchedDocument] =
    api.document.getDocument.useSuspenseQuery<DocumentType>({
      documentId: task?.documentId ?? null,
    });

  const [projectMembers] = api.project.getProjectMembers.useSuspenseQuery<
    ProjectMember[]
  >({
    projectId: task?.projectId ?? null,
  });

  const [assignedDocument, setAssignedDocument] = useState<DocumentType | null>(
    null,
  );

  useEffect(() => {
    setAssignedDocument(fetchedDocument ?? null);
  }, [fetchedDocument]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.ToDo);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [policyHeader, setPolicyHeader] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [recommendedContent, setRecommendedContent] = useState("");
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState<string | undefined>("");

  useEffect(() => {
    if (task) {
      setTitle(task.title ?? "Untitled Task");
      setDescription(task.description ?? "No description provided");
      setStatus(task.status ?? TaskStatus.ToDo);
      setPriority(task.priority ?? TaskPriority.Medium);
      setPolicyHeader(task.policyHeader ?? "No policy header");
      setPolicyContent(task.policyContent ?? "No policy content");
      setRecommendedContent(task.recommendedContent ?? "No recommendations");
      setDocumentId(task.documentId ?? null);
      setAssignedTo(task.assignedTo ?? "");
      setDueDate(
        task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      );
    }
  }, [task]);

  const utils = api.useUtils();
  const editTask = api.tasks.editTask.useMutation({
    onSuccess: async () => {
      await utils.tasks.invalidate();
      onClose();
    },
  });

  const deleteTask = api.tasks.deleteTask.useMutation({
    onSuccess: async () => {
      await utils.tasks.invalidate();
      onClose();
    },
  });
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60">
      <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-800">
          Edit Task
        </h2>

        <div className="flex flex-col gap-4 md:flex-row">
          {/* Left Column - Selection Fields */}
          <div className="flex w-full flex-col gap-4 md:w-2/5 md:pr-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.values(TaskStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.values(TaskPriority).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate ?? ""}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Assigned To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">No Assignee</option>
                {projectMembers?.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name || "Unnamed User"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Associated Document
              </label>
              <select
                className="h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={documentId ?? ""}
                onChange={(e) => {
                  const selectedDoc = documents?.find(
                    (doc) => doc.id === Number(e.target.value),
                  );
                  if (selectedDoc) {
                    setDocumentId(selectedDoc.id);
                  }
                }}
              >
                <option value="">Select a Document</option>
                {documents?.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>

            {assignedDocument?.fileUrl && (
              <div className="mt-1">
                <a
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                  href={assignedDocument.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Open Document
                </a>
              </div>
            )}
          </div>

          {/* Right Column - Text Fields */}
          <div className="flex w-full flex-col gap-4 md:w-3/5 md:pl-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter task description"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Policy Header
              </label>
              <input
                type="text"
                value={policyHeader}
                onChange={(e) => setPolicyHeader(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter policy header"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Policy Content
              </label>
              <textarea
                value={policyContent}
                onChange={(e) => setPolicyContent(e.target.value)}
                className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter policy content"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Recommendations
              </label>
              <textarea
                value={recommendedContent}
                onChange={(e) => setRecommendedContent(e.target.value)}
                className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter recommendations"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              const isValidAssignee =
                assignedTo === "" ||
                projectMembers?.some((member) => member.userId === assignedTo);

              if (task && isValidAssignee) {
                editTask.mutate({
                  ...task,
                  title: title.trim(),
                  description: description.trim(),
                  status,
                  priority,
                  policyHeader: policyHeader.trim(),
                  policyContent: policyContent.trim(),
                  recommendedContent: recommendedContent.trim(),
                  assignedTo: assignedTo || null,
                  documentIds: documentId ?? undefined,
                  dueDate: dueDate
                    ? new Date(dueDate).toISOString()
                    : undefined,
                });
              } else {
                alert("Invalid assignee selected.");
              }
            }}
            className="min-w-24 rounded-md bg-blue-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save
          </button>

          <button
            onClick={() => task && deleteTask.mutate({ id: task.id })}
            className="min-w-24 rounded-md bg-red-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>

          <button
            onClick={onClose}
            className="min-w-24 rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
