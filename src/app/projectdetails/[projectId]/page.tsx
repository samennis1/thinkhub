"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface Task {
  id: number;
  title: string;
  description: string;
  createdBy: string;
  order: number;
}

interface Milestone {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  tasks: Task[];
}

const ProjectDetailsPage: React.FC = () => {
  const params = useParams();
  const projectId = params.projectId ? Number(params.projectId) : null;
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedTaskId !== null) {
      console.log("Selected Task ID:", selectedTaskId);
    }
  }, [selectedTaskId]);

  const { data: project, isLoading, error } = api.project.getProjectDetails.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const { data: milestones, refetch: refetchMilestones } = api.milestone.getMilestones.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const updateTaskMutation = api.task.updateTask.useMutation({
    onSuccess: () => {
      refetchMilestones();
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    },
  });

  const reorderTasksMutation = api.task.reorderTasks.useMutation({
    onSuccess: () => {
      refetchMilestones();
    },
    onError: (error) => {
      console.error("Error reordering tasks:", error);
      alert("Failed to reorder tasks. Please try again.");
    },
  });

  const addMilestoneMutation = api.milestone.createMilestone.useMutation({
    onSuccess: () => {
      refetchMilestones();
      setShowMilestoneModal(false);
    },
  });

  const addTaskMutation = api.task.createTask.useMutation({
    onSuccess: (data) => {
      refetchMilestones();
      if (data) {
        setSelectedTaskId(data.id);
      }
    },
  });

  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen">Error: {error.message}</div>;
  if (!project) return <div className="flex justify-center items-center h-screen">Project not found</div>;

  const handleAddMilestone = () => {
    addMilestoneMutation.mutate({
      projectId: projectId!,
      title: newMilestoneTitle,
      description: newMilestoneDescription,
      dueDate: new Date(newMilestoneDueDate),
    });
  };

  const handleAddTask = (milestoneId: number, tasksCount: number) => {
    if (milestoneId !== null) {
      addTaskMutation.mutate(
        {
          projectId: projectId!,
          milestoneId,
          title: "",
          createdBy: project!.createdBy,
          order: tasksCount,
        },
        {
          onSuccess: (data) => {
            if (data?.id) {
              setSelectedTaskId(data.id);
            }
            refetchMilestones();
          },
        }
      );
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      const milestone = milestones?.find(m => m.id.toString() === source.droppableId) as Milestone;
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
      <h1 className="text-3xl font-bold mb-4">{project?.name}</h1>
      <p className="text-lg mb-4">{project?.description}</p>
      <p className="text-sm text-gray-500 mb-8">Created at: {project ? new Date(project.createdAt).toLocaleString() : ""}</p>

      <div className="flex flex-col items-center mb-4">
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-semibold mr-2">Milestones</h2>
          <button
            onClick={() => setShowMilestoneModal(true)}
            className="rounded-full w-12 h-12 flex items-center justify-center border-2 border-black text-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" style={{transform: 'translateY(-1px)'}}>
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v7.5h7.5a.75.75 0 010 1.5h-7.5v7.5a.75.75 0 01-1.5 0v-7.5H3.75a.75.75 0 010-1.5h7.5V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
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
                        setSelectedMilestoneId(milestone.id);
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
    </div>
  );
};

export default ProjectDetailsPage;