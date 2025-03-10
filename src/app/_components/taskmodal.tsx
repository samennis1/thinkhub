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

interface TaskModalProps {
  taskId: number;
  onClose: () => void;
}

export function TaskModal({ taskId, onClose }: TaskModalProps) {
  const [task] = api.tasks.getTask.useSuspenseQuery<Task>({ taskId });
  const [documents] = api.project.getDocuments.useSuspenseQuery<DocumentType[]>(
    { projectId: task?.projectId ?? 0 },
  );
  const [fetchedDocument] =
    api.document.getDocument.useSuspenseQuery<DocumentType>({
      documentId: task?.documentId ?? 0,
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
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentLink, setDocumentLink] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setPolicyHeader(task.policyHeader);
      setPolicyContent(task.policyContent);
      setRecommendedContent(task.recommendedContent);
      setDocumentId(task.documentId ?? null);
    }
  }, [task]);

  useEffect(() => {
    setDocumentTitle(assignedDocument?.title ?? "");
    setDocumentLink(assignedDocument?.fileUrl ?? "");
  }, [assignedDocument]);

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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Edit Task</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border p-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border p-2"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full rounded border p-2"
          >
            {Object.values(TaskStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full rounded border p-2"
          >
            {Object.values(TaskPriority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={policyHeader}
            onChange={(e) => setPolicyHeader(e.target.value)}
            className="w-full rounded border p-2"
          />
          <textarea
            value={policyContent}
            onChange={(e) => setPolicyContent(e.target.value)}
            className="w-full rounded border p-2"
          />
          <textarea
            value={recommendedContent}
            onChange={(e) => setRecommendedContent(e.target.value)}
            className="w-full rounded border p-2"
          />
          <div>
            <p className="text-sm font-medium">
              Selected Document: {documentTitle || "None"}
            </p>
            <p
              className="cursor-pointer text-blue-600 underline"
              onClick={() =>
                documentLink && window.open(documentLink, "_blank")
              }
            >
              {documentLink ? "Open Document" : "No Document Selected"}
            </p>
          </div>
          <select
            className="w-full rounded border p-2"
            onChange={(e) => {
              const selectedDoc = documents?.find(
                (doc) => doc.id === Number(e.target.value),
              );
              if (selectedDoc) {
                setDocumentId(selectedDoc.id);
                setDocumentTitle(selectedDoc.title);
                setDocumentLink(selectedDoc.fileUrl ?? "");
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
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() =>
              task &&
              editTask.mutate({
                ...task,
                title,
                description,
                status,
                priority,
                policyHeader,
                policyContent,
                recommendedContent,
                documentIds: documentId ?? 0,
                dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
              })
            }
            className="rounded bg-blue-500 px-4 py-2 text-white"
          >
            Save
          </button>
          <button
            onClick={() => task && deleteTask.mutate({ id: task.id })}
            className="rounded bg-red-500 px-4 py-2 text-white"
          >
            Delete
          </button>
          <button onClick={onClose} className="rounded bg-gray-300 px-4 py-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
