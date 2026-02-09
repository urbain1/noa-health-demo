import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import VoiceCapture from "./components/VoiceCapture";
import Alert from "./components/Alert";
import DischargeDialog from "./components/DischargeDialog";
import TaskEditDialog from "./components/TaskEditDialog";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import { parseTaskEditCommand } from "./utils/claudeAPI";
import { patients as mockPatients } from "./mockData";

function App() {
  const [patients, setPatients] = useState(mockPatients);
  const [showVoice, setShowVoice] = useState(false);
  const [delayedTasks, setDelayedTasks] = useState([]);
  const [selectedPatientForDischarge, setSelectedPatientForDischarge] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [dismissedTaskIds, setDismissedTaskIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissedTasks") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const delayed = [];
    for (const patient of patients) {
      for (const task of patient.tasks) {
        if (task.status === "Delayed" && !dismissedTaskIds.includes(task.id)) {
          delayed.push({ ...task, room: patient.room });
        }
      }
    }
    setDelayedTasks(delayed);
  }, [patients, dismissedTaskIds]);

  const dismissAlert = (taskId) => {
    setDismissedTaskIds((prev) => {
      const updated = [...prev, taskId];
      localStorage.setItem("dismissedTasks", JSON.stringify(updated));
      return updated;
    });
  };

  const clearDismissed = () => {
    setDismissedTaskIds([]);
    localStorage.removeItem("dismissedTasks");
  };

  const handleFollowUp = (task) => {
    alert(
      `Following up on: ${task.description}\nDepartment: ${task.department}\nRoom: ${task.room}`
    );
    dismissAlert(task.id);
  };

  const simulateStatusChange = (taskId) => {
    setPatients((prev) =>
      prev.map((p) => ({
        ...p,
        tasks: p.tasks.map((t) =>
          t.id === taskId && t.status === "Pending"
            ? { ...t, status: "Delayed" }
            : t
        ),
      }))
    );
  };

  const handleTaskCreated = (taskData) => {
    const newTask = {
      id: Date.now(),
      description: taskData.description,
      department: taskData.department,
      status: taskData.status || "Pending",
      priority: taskData.priority || "Routine",
      createdAt: new Date().toISOString(),
    };

    // Case 1: New patient being created
    if (taskData.isNewPatient) {
      const newPatient = {
        id: Date.now(),
        room: taskData.room,
        name: taskData.patientName || `Patient (Room ${taskData.room})`,
        age: taskData.patientAge || 0,
        tasks: [newTask],
      };
      setPatients([...patients, newPatient]);
    } else {
      // Case 2: Add task to existing patient
      const roomExists = patients.find((p) => p.room === taskData.room);

      if (roomExists) {
        // Add to existing patient
        setPatients(
          patients.map((p) =>
            p.room === taskData.room
              ? { ...p, tasks: [...p.tasks, newTask] }
              : p
          )
        );
      } else {
        // Create new patient card (unknown patient)
        const newPatient = {
          id: Date.now(),
          room: taskData.room,
          name: `Patient (Room ${taskData.room})`,
          age: 0,
          tasks: [newTask],
        };
        setPatients([...patients, newPatient]);
      }
    }

    // Simulate status change after 15 seconds
    setTimeout(() => {
      simulateStatusChange(newTask.id);
    }, 15000);

    setShowVoice(false);
  };

  const handleDischargeClick = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) setSelectedPatientForDischarge(patient);
  };

  const handleDischargeConfirm = (options) => {
    const newTasks = [];

    if (options.notifyPatient) {
      newTasks.push({
        id: `discharge-notify-${Date.now()}`,
        description:
          "Notify patient about discharge plan" +
          (options.notes ? ` — ${options.notes}` : ""),
        department: "Nursing",
        priority: "routine",
        status: "Pending",
        type: "discharge",
        timestamp: new Date().toISOString(),
      });
    }

    if (options.needsNursingHome) {
      newTasks.push({
        id: `discharge-nh-${Date.now()}`,
        description:
          "Arrange nursing home placement" +
          (!options.notifyPatient && options.notes ? ` — ${options.notes}` : ""),
        department: "Social Work",
        priority: "high",
        status: "Pending",
        type: "discharge",
        timestamp: new Date().toISOString(),
      });
    }

    if (newTasks.length > 0) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatientForDischarge.id
            ? { ...p, tasks: [...newTasks, ...p.tasks] }
            : p
        )
      );
    }

    setSelectedPatientForDischarge(null);
  };

  const handleDeleteClick = (task, patientId) => {
    setTaskToDelete({ task, patientId });
  };

  const handleDeleteConfirm = () => {
    if (!taskToDelete) return;

    setPatients((prevPatients) =>
      prevPatients.map((patient) => {
        if (patient.id === taskToDelete.patientId) {
          return {
            ...patient,
            tasks: patient.tasks.filter((t) => t.id !== taskToDelete.task.id),
          };
        }
        return patient;
      })
    );

    setTaskToDelete(null);
  };

  const handleDeleteCancel = () => {
    setTaskToDelete(null);
  };

  const handleEditClick = (task, patientId) => {
    setTaskToEdit({ task, patientId });
  };

  const handleEditUpdate = async (command, task, patientId) => {
    try {
      const result = await parseTaskEditCommand(command, task);

      if (result.action === "delete") {
        setTaskToEdit(null);
        setTaskToDelete({ task, patientId });
        return;
      }

      if (result.updates) {
        setPatients((prevPatients) =>
          prevPatients.map((patient) => {
            if (patient.id === patientId) {
              return {
                ...patient,
                tasks: patient.tasks.map((t) =>
                  t.id === task.id ? { ...t, ...result.updates } : t
                ),
              };
            }
            return patient;
          })
        );
        setTaskToEdit(null);
      }

      if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Edit error:", error);
      alert("Error updating task. Please try again.");
    }
  };

  const handleEditCancel = () => {
    setTaskToEdit(null);
  };

  if (showVoice) {
    return (
      <VoiceCapture
        onClose={() => setShowVoice(false)}
        onTaskCreated={handleTaskCreated}
        allPatients={patients}
      />
    );
  }

  return (
    <>
      {delayedTasks.length > 0 && !showVoice && (
        <Alert
          task={delayedTasks[0]}
          onDismiss={() => dismissAlert(delayedTasks[0].id)}
          onFollowUp={() => handleFollowUp(delayedTasks[0])}
        />
      )}
      <Dashboard
        patients={patients}
        onVoiceClick={() => setShowVoice(true)}
        dismissedCount={dismissedTaskIds.length}
        onClearDismissed={clearDismissed}
        onDischargeClick={handleDischargeClick}
        onDeleteTask={handleDeleteClick}
        onEditTask={handleEditClick}
      />
      {selectedPatientForDischarge && (
        <DischargeDialog
          patient={selectedPatientForDischarge}
          onCancel={() => setSelectedPatientForDischarge(null)}
          onConfirm={handleDischargeConfirm}
        />
      )}
      {taskToDelete && (
        <DeleteConfirmModal
          task={taskToDelete.task}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}
      {taskToEdit && (
        <TaskEditDialog
          task={taskToEdit.task}
          patientId={taskToEdit.patientId}
          onCancel={handleEditCancel}
          onUpdate={handleEditUpdate}
        />
      )}
    </>
  );
}

export default App;
