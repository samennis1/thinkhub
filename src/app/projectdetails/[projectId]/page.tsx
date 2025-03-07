"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

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

  const {
    data: project,
    isLoading,
    error,
  } = api.project.getProjectDetails.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId },
  );

  const { data: milestones, refetch: refetchMilestones } =
    api.milestone.getMilestones.useQuery(
      { projectId: projectId! },
      { enabled: !!projectId },
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
    onSuccess: () => {
      refetchMilestones();
      setShowTaskModal(false);
    },
  });

  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(
    null,
  );
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!project) return <div>Project not found</div>;

  const handleAddMilestone = () => {
    addMilestoneMutation.mutate({
      projectId: projectId!,
      title: newMilestoneTitle,
      description: newMilestoneDescription,
      dueDate: new Date(newMilestoneDueDate),
    });
  };

  const handleAddTask = () => {
    if (selectedMilestoneId !== null) {
      addTaskMutation.mutate({
        projectId: projectId!,
        milestoneId: selectedMilestoneId,
        title: newTaskTitle,
        createdBy: project!.createdBy,
        order: 0,
      });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      const milestone = milestones?.find(
        (m) => m.id.toString() === source.droppableId,
      ) as Milestone;
      if (milestone) {
        const tasks = Array.from(milestone.tasks);
        const [movedTask] = tasks.splice(source.index, 1);
        if (movedTask) {
          tasks.splice(destination.index, 0, movedTask);
        }

        milestone.tasks = tasks;
        reorderTasksMutation.mutate({
          milestoneId: milestone.id,
          tasks: tasks.map((task) => task.id),
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
    <div>
      <h1>{project?.name}</h1>
      <p>{project?.description}</p>
      <p>
        Created at:{" "}
        {project ? new Date(project.createdAt).toLocaleString() : ""}
      </p>

      <h2>Milestones</h2>
      <button onClick={() => setShowMilestoneModal(true)}>Add Milestone</button>

      <DragDropContext onDragEnd={handleDragEnd}>
        {milestones?.length ? (
          milestones.map((milestone, index) => (
            <Droppable key={milestone.id} droppableId={milestone.id.toString()}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    backgroundColor: snapshot.isDraggingOver
                      ? "lightblue"
                      : "lightgrey",
                    padding: 4,
                    width: 250,
                    minHeight: 500,
                  }}
                >
                  <h3>Milestone {index + 1}</h3>
                  <p>
                    <strong>Title:</strong> {milestone.title}
                  </p>
                  <p>
                    <strong>Description:</strong> {milestone.description}
                  </p>
                  <p>
                    Due Date: {new Date(milestone.dueDate).toLocaleDateString()}
                  </p>
                  <h4>Tasks</h4>
                  <ul>
                    {milestone.tasks.map((task: Task, taskIndex: number) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={taskIndex}
                      >
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              userSelect: "none",
                              padding: 16,
                              margin: "0 0 8px 0",
                              minHeight: "50px",
                              backgroundColor: snapshot.isDragging
                                ? "#263B4A"
                                : "#456C86",
                              color: "white",
                              ...provided.draggableProps.style,
                            }}
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
                      setShowTaskModal(true);
                    }}
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

      {showMilestoneModal && (
        <div className="modal">
          <div className="modal-content">
            <span
              className="close"
              onClick={() => setShowMilestoneModal(false)}
            >
              &times;
            </span>
            <h2>Add Milestone</h2>
            <input
              type="text"
              placeholder="Milestone Title"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Milestone Description"
              value={newMilestoneDescription}
              onChange={(e) => setNewMilestoneDescription(e.target.value)}
            />
            <input
              type="date"
              placeholder="Milestone Due Date"
              value={newMilestoneDueDate}
              onChange={(e) => setNewMilestoneDueDate(e.target.value)}
            />
            <button onClick={handleAddMilestone}>Submit</button>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowTaskModal(false)}>
              &times;
            </span>
            <h2>Add Task</h2>
            <input
              type="text"
              placeholder="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button onClick={handleAddTask}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsPage;
