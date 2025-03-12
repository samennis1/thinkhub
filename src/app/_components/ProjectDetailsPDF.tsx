"use client";

import React from "react";
import { api } from "~/trpc/react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

interface ProjectDetailsPDFProps {
  projectId: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string | null;
  priority: string | null;
  assignedTo?: string | null;
  documentId?: number | null;
  policyHeader?: string;
  policyContent?: string;
  recommendedContent?: string;
}

interface ProjectTasks {
  projectTitle: string;
  tasks: Task[];
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: "Helvetica" },
  section: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  taskContainer: { marginBottom: 15, padding: 10, border: "1px solid #ccc" },
  taskTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  taskDesc: { fontSize: 10, color: "#444" },
  label: { fontWeight: "bold" },
});

const ProjectPDFDocument = ({ projectTitle, tasks }: ProjectTasks) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Project: {projectTitle}</Text>
      </View>

      {tasks.map((task) => (
        <View key={task.id} style={styles.taskContainer}>
          <Text style={styles.taskTitle}>Task: {task.title}</Text>
          <Text style={styles.taskDesc}>Description: {task.description}</Text>
          <Text>
            <Text style={styles.label}>Status:</Text> {task.status}
          </Text>
          <Text>
            <Text style={styles.label}>Priority:</Text> {task.priority}
          </Text>
          <Text>
            <Text style={styles.label}>Assigned To:</Text>{" "}
            {task.assignedTo ?? "Unassigned"}
          </Text>
          <Text>
            <Text style={styles.label}>Associated Document:</Text>{" "}
            {task.documentId ? `Document ID: ${task.documentId}` : "None"}
          </Text>
          <Text>
            <Text style={styles.label}>Policy Header:</Text>{" "}
            {task.policyHeader ?? "N/A"}
          </Text>
          <Text>
            <Text style={styles.label}>Policy Content:</Text>{" "}
            {task.policyContent ?? "N/A"}
          </Text>
          <Text>
            <Text style={styles.label}>Recommendations:</Text>{" "}
            {task.recommendedContent ?? "N/A"}
          </Text>
        </View>
      ))}
    </Page>
  </Document>
);

export function ProjectDetailsPDF({ projectId }: ProjectDetailsPDFProps) {
  const { data, isLoading } = api.tasks.getProjectTasks.useQuery({
    projectId,
  });

  if (isLoading) return <p>Loading project tasks...</p>;
  if (!data) return <p>Project not found.</p>;

  return (
    <div className="mt-4">
      <PDFDownloadLink
        document={<ProjectPDFDocument {...data} />}
        fileName="ProjectTasks.pdf"
      >
        {({ loading }) =>
          loading ? (
            <button className="rounded bg-gray-400 px-4 py-2 text-white">
              Generating PDF...
            </button>
          ) : (
            <button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
              Download Project Tasks PDF
            </button>
          )
        }
      </PDFDownloadLink>
    </div>
  );
}
