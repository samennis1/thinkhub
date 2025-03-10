"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { TaskModal } from "~/app/_components/taskmodal";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { DropResult } from "react-beautiful-dnd";
import { useSession } from "next-auth/react";

interface Task {
  id: number;
  title: string;
  description: string | null;
  createdBy: string;
  order: number;
}


interface Document {
  id: number;
  title: string;
  fileUrl: string | null;
}

const ProjectDetailsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId ? Number(params.projectId) : null;
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [newDocumentUrl, setNewDocumentUrl] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"Manager" | "Researcher" | "Viewer">("Viewer");
  const [addMemberError, setAddMemberError] = useState("");
  const [memberToDelete, setMemberToDelete] = useState<{ userId: string; email: string } | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showMembers, setShowMembers] = useState(true);

  useEffect(() => {
    if (selectedTaskId !== null) {
      console.log("Selected Task ID:", selectedTaskId);
    }
  }, [selectedTaskId]);


  const { data: project, isLoading, error, refetch: refetchProject } = api.project.getProjectDetails.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: milestones, refetch: refetchMilestones } = api.details.getMilestones.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: documents, refetch: refetchDocuments } = api.project.getDocuments.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const {refetch: refetchUserId } = api.project.getUserIdByEmail.useQuery(
    { email: newMemberEmail },
    { enabled: false }
  );

  const updateTaskMutation = api.details.updateTask.useMutation({
    onSuccess: () => {
      void refetchMilestones();
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    },
  });

  const deleteMemberMutation = api.project.deleteMember.useMutation({
    onSuccess: () => {
      void refetchProject();
    },
    onError: (error) => {
      console.error("Error deleting member:", error);
      alert("Failed to delete member. Please try again.");
    },
  });

  const addMemberMutation = api.project.addMember.useMutation({
    onSuccess: () => {
      setShowAddMemberModal(false);
      setNewMemberEmail("");
      setNewMemberRole("Viewer");
      void refetchProject();
    },
    onError: (error) => {
      setAddMemberError("Failed to add member. Please try again.");
      console.error("Error adding member:", error);
    },
  });

  const reorderTasksMutation = api.details.reorderTasks.useMutation({
    onSuccess: () => {
      void refetchMilestones();
    },
    onError: (error) => {
      console.error("Error reordering tasks:", error);
      alert("Failed to reorder tasks. Please try again.");
    },
  });

  const addMilestoneMutation = api.details.createMilestone.useMutation({
    onSuccess: () => {
      void refetchMilestones();
      setShowMilestoneModal(false);
    },
  });

  const addTaskMutation = api.details.createTask.useMutation({
    onSuccess: (data) => {
      void refetchMilestones();
      if (data) {
        setSelectedTaskId(data.id);
      }
    },
  });

  const addDocumentMutation = api.project.assignDocument.useMutation({
    onSuccess: () => {
      void refetchDocuments();
      setShowDocumentModal(false);
    },
  });

  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const [isMember, setIsMember] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "authenticated" && project && session) {
      console.log("Project Members:", project.members);
      const memberStatus = project.members.some(member => member.userId === session.user.id);
      console.log("Is current user a member:", memberStatus);
      setIsMember(memberStatus);
    }
  }, [status, project, session]);

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen">Error: {error.message}</div>;
  if (!project) return <div className="flex justify-center items-center h-screen">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Project not found</h1>
      <button
        onClick={() => router.push('/homePage')}
        className="bg-blue-500 text-white py-2 px-4 rounded mt-4"
      >
        Go to Home Page
      </button>
    </div>
  </div>;

  if (isMember === false) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">You are not a member of this project</h1>
          <p className="text-lg mb-4">Please contact {project.creatorEmail} to be added to the project.</p>
          <button
            onClick={() => router.push('/homePage')}
            className="bg-blue-500 text-white py-2 px-4 rounded mt-4"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  const handleAddMilestone = () => {
    addMilestoneMutation.mutate({
      projectId: projectId!,
      title: newMilestoneTitle,
      description: newMilestoneDescription,
      dueDate: new Date(newMilestoneDueDate),
    });
  };

  const handleDeleteMember = () => {
    if (memberToDelete) {
      deleteMemberMutation.mutate({
        projectId: projectId!,
        userId: memberToDelete.userId,
      }, {
        onSuccess: () => {
          setShowDeleteConfirmation(false);
          setMemberToDelete(null);
          void refetchProject();
        },
        onError: (error) => {
          console.error("Error deleting member:", error);
          alert("Failed to delete member. Please try again.");
        },
      });
    }
  };



  const handleAddMember = async () => {
    setAddMemberError("");
    const { data: userId } = await refetchUserId();
    if (!userId) {
      setAddMemberError("User not registered");
      return;
    }

    addMemberMutation.mutate({
      projectId: projectId!,
      userId,
      role: newMemberRole,
    }, {
      onSuccess: () => {
        setShowAddMemberModal(false);
        setNewMemberEmail("");
        setNewMemberRole("Viewer");
        void refetchProject();
      },
      onError: (error) => {
        setAddMemberError("Failed to add member. Please try again.");
        console.error("Error adding member:", error);
      },
    });
  };

  const handleAddTask = (milestoneId: number, tasksCount: number) => {
    if (milestoneId !== null) {
      addTaskMutation.mutate(
        {
          projectId: projectId!,
          milestoneId,
          title: "",
          createdBy: project.createdBy,
          order: tasksCount,
        },
        {
          onSuccess: (data) => {
            if (data?.id) {
              setSelectedTaskId(data.id);
            }
            void refetchMilestones();
          },
        }
      );
    }
  };

  const handleAddDocument = () => {
    console.log("Document URL being sent:", newDocumentUrl);
    addDocumentMutation.mutate({
      title: newDocumentTitle,
      fileUrl: newDocumentUrl,
      projectId: projectId!,
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      const milestone = milestones?.find(m => m.id.toString() === source.droppableId);
      if (milestone) {
        const tasks = Array.from(milestone.tasks);
        const [movedTask] = tasks.splice(source.index, 1);
        if (movedTask) {
          tasks.splice(destination.index, 0, movedTask);
        }

        milestone.tasks = tasks;
        reorderTasksMutation.mutate({
          milestoneId: milestone.id,
          tasks: tasks.map(task => task.id),
        });
      }
    } else {
      const destinationMilestoneId = parseInt(destination.droppableId);
      const taskId = parseInt(draggableId);

      updateTaskMutation.mutate({
        taskId,
        milestoneId: destinationMilestoneId,
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-8">
        <div className="w-1/4">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold mr-2">Members</h2>
            {isMember && session && project.members.some(member => member.userId === session.user.id && member.role === "Manager") && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="rounded-full w-8 h-8 flex items-center justify-center border-2 border-black text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v7.5h7.5a.75.75 0 010 1.5h-7.5v7.5a.75.75 0 01-1.5 0v-7.5H3.75a.75.75 0 010-1.5h7.5V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          {showMembers && (
            <ul>
              {project.members.map((member) => (
                <li key={member.userId} className="mb-2 flex justify-between items-center">
                  <span>{member.email} - {member.role}</span>
                  {isMember && session && project.members.some(m => m.userId === session.user.id && m.role === "Manager") && (
                    <button
                      onClick={() => {
                        setMemberToDelete({ userId: member.userId, email: member.email });
                        setShowDeleteConfirmation(true);
                      }}
                      className="rounded-full w-8 h-8 flex items-center justify-center border-2 border-red-500 text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.5 12a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setShowMembers(!showMembers)} className="btn btn-secondary mt-2">
            {showMembers ? "Hide Members" : "Show Members"}
          </button>
        </div>
        <div className="w-1/2 text-center">
          <h1 className="text-3xl font-bold mb-2">{project?.name}</h1>
          <p className="text-lg mb-2">{project?.description}</p>
          <p className="text-sm text-gray-500 mb-2">Created at: {project ? new Date(project.createdAt).toLocaleString() : ""}</p>
          <p className="text-sm text-gray-500">Creator Email: {project.creatorEmail}</p>
        </div>
        <div className="w-1/4 text-right">
          <div className="flex justify-end items-center mb-4">
            <h2 className="text-xl font-semibold mr-2">Documents</h2>
            <button
              onClick={() => setShowDocumentModal(true)}
              className="rounded-full w-8 h-8 flex items-center justify-center border-2 border-black text-black"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v7.5h7.5a.75.75 0 010 1.5h-7.5v7.5a.75.75 0 01-1.5 0v-7.5H3.75a.75.75 0 010-1.5h7.5V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {showDocuments && (
            <ul className="mb-4 text-right">
              {documents?.map((doc: Document) => (
                <li key={doc.id} className="mb-2">
                  <a href={doc.fileUrl ?? '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setShowDocuments(!showDocuments)} className="btn btn-secondary">
            {showDocuments ? "Hide Documents" : "Show Documents"}
          </button>
        </div>
      </div>
      <div className="w-full flex flex-col items-center">
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-semibold mr-2">Milestones</h2>
          <button
            onClick={() => setShowMilestoneModal(true)}
            className="rounded-full w-12 h-12 flex items-center justify-center border-2 border-black text-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" style={{ transform: 'translateY(-1px)' }}>
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v7.5h7.5a.75.75 0 010 1.5h-7.5v7.5a.75.75 0 01-1.5 0v-7.5H3.75a.75.75 0 010-1.5h7.5V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            {milestones?.length ? (
              milestones.map((milestone, index) => (
                <Droppable key={milestone.id} droppableId={milestone.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 w-64 min-h-[500px] ${snapshot.isDraggingOver ? 'bg-blue-200' : 'bg-gray-200'} rounded-lg shadow-md`}
                    >
                      <h3 className="text-xl font-semibold mb-2">Milestone {index + 1}</h3>
                      <p className="text-sm mb-1"><strong>Title:</strong> {milestone.title}</p>
                      <p className="text-sm mb-1"><strong>Description:</strong> {milestone.description}</p>
                      <p className="text-sm mb-4">Due Date: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                      <h4 className="text-lg font-semibold mb-2">Tasks</h4>
                      <ul>
                        {milestone.tasks.map((task: Task, taskIndex: number) => (
                          <Draggable key={task.id} draggableId={task.id.toString()} index={taskIndex}>
                            {(provided, snapshot) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-4 mb-2 min-h-[50px] ${snapshot.isDragging ? 'bg-blue-800' : 'bg-blue-600'} text-white rounded-lg shadow-md`}
                                onClick={() => setSelectedTaskId(task.id)}
                              >
                                Task {taskIndex + 1}: {task.title}
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>

                      <button
                        onClick={() => {
                          handleAddTask(milestone.id, milestone.tasks.length);
                        }}
                        className="btn btn-secondary mt-2 w-full"
                      >
                        Add Task
                      </button>
                    </div>
                  )}
                </Droppable>
              ))
            ) : (
              <p>No milestones yet.</p>
            )}
          </DragDropContext>
        </div>
      </div>

      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <span className="absolute top-2 right-2 text-2xl cursor-pointer" onClick={() => setShowAddMemberModal(false)}>
              &times;
            </span>
            <h2 className="text-xl mb-4">Add Member</h2>
            <input
              type="email"
              placeholder="Member Email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as "Manager" | "Researcher" | "Viewer")}
              className="input input-bordered w-full mb-4"
            >
              <option value="Manager">Manager</option>
              <option value="Researcher">Researcher</option>
              <option value="Viewer">Viewer</option>
            </select>
            {addMemberError && <p className="text-red-500 mb-4">{addMemberError}</p>}
            <button onClick={handleAddMember} className="btn btn-primary w-full">Submit</button>
          </div>
        </div>
      )}

      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <span className="absolute top-2 right-2 text-2xl cursor-pointer" onClick={() => setShowMilestoneModal(false)}>
              &times;
            </span>
            <h2 className="text-xl mb-4">Add Milestone</h2>
            <input
              type="text"
              placeholder="Milestone Title"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
            <input
              type="text"
              placeholder="Milestone Description"
              value={newMilestoneDescription}
              onChange={(e) => setNewMilestoneDescription(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
            <input
              type="date"
              placeholder="Milestone Due Date"
              value={newMilestoneDueDate}
              onChange={(e) => setNewMilestoneDueDate(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
            <button onClick={handleAddMilestone} className="btn btn-primary w-full">Submit</button>
          </div>
        </div>
      )}

      {showDeleteConfirmation && memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <span className="absolute top-2 right-2 text-2xl cursor-pointer" onClick={() => setShowDeleteConfirmation(false)}>
              &times;
            </span>
            <h2 className="text-xl mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to remove {memberToDelete.email} from the project?</p>
            <div className="flex flex-col justify-end mt-4">
              <button
                onClick={handleDeleteMember}
                className="btn bg-red-500 text-white mb-2"
              >
                Remove Member
              </button>
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative">
            <span className="absolute top-2 right-2 text-2xl cursor-pointer" onClick={() => setShowDocumentModal(false)}>
              &times;
            </span>
            <h2 className="text-xl mb-4">Add Document</h2>
            <input
              type="text"
              placeholder="Document Title"
              value={newDocumentTitle}
              onChange={(e) => setNewDocumentTitle(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
            <input
              type="text"
              placeholder="Document URL"
              value={newDocumentUrl}
              onChange={(e) => setNewDocumentUrl(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
            <button onClick={handleAddDocument} className="btn btn-primary w-full">Submit</button>
          </div>
        </div>
      )}

      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
};

export default ProjectDetailsPage;