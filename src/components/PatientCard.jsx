import TaskCard from "./TaskCard";

function hasDischargeTask(tasks) {
  return tasks.some((task) => {
    const desc = task.description.toLowerCase();
    return task.type === "discharge" || desc.includes("discharge") || desc.includes("nursing home");
  });
}

function showDischargeBadge(tasks) {
  return tasks.some((task) => {
    const desc = task.description.toLowerCase();
    return task.department === "Social Work" || desc.includes("discharge");
  });
}

export default function PatientCard({ patient, patientId, onDischargeClick, onDeleteTask, onEditTask }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-md sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">{patient.name}</h2>
            {showDischargeBadge(patient.tasks) && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                Discharge Planning
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Room {patient.room} &middot; Age {patient.age}
          </p>
        </div>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {patient.tasks.length}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {patient.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={() => onEditTask(task, patientId)}
            onDelete={() => onDeleteTask(task, patientId)}
          />
        ))}
      </div>

      {!hasDischargeTask(patient.tasks) && (
        <button
          onClick={() => onDischargeClick(patient.id)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Mark for Discharge
        </button>
      )}
    </div>
  );
}
