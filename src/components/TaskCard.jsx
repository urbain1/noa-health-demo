const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-green-100 text-green-800",
  Delayed: "bg-red-100 text-red-800",
};

function getTimeElapsed(timestamp) {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diff < 1) return "just now";
  return `${diff} min ago`;
}

export default function TaskCard({ task, onEdit, onDelete }) {
  const badgeClass = statusStyles[task.status] || "bg-gray-100 text-gray-800";
  const priorityLabel = task.priority === "high" ? "Stat" : "Routine";

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{task.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>{task.department}</span>
          <span className="text-gray-300">|</span>
          <span>{getTimeElapsed(task.timestamp)}</span>
          <span className="text-gray-300">|</span>
          <span
            className={`font-semibold ${task.priority === "high" ? "text-red-600" : "text-gray-500"}`}
          >
            {priorityLabel}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-300 ${badgeClass}`}
        >
          {task.status}
        </span>
        <button
          onClick={() => onEdit?.(task)}
          className="rounded p-1 text-gray-400 transition-colors duration-150 hover:text-blue-500"
          aria-label="Edit task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete?.(task)}
          className="rounded p-1 text-gray-400 transition-colors duration-150 hover:text-red-500"
          aria-label="Delete task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
