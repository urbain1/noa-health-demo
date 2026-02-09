export default function Alert({ task, onDismiss, onFollowUp }) {
  return (
    <div className="animate-slide-down fixed top-14 right-0 left-0 z-20 mx-auto max-w-2xl px-4 pt-2 sm:px-6">
      <div className="rounded-xl bg-red-600 p-4 shadow-2xl">
        {/* Heading row */}
        <div className="mb-2 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 shrink-0 text-white"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.499-2.599 4.499H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.004ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-lg font-bold text-white">Task Delayed</h2>
        </div>

        {/* Details */}
        <p className="mb-1 text-sm font-medium text-white">
          {task.description}
        </p>
        <p className="mb-4 text-sm text-red-200">
          {task.department}
          {task.room ? ` \u00B7 Room ${task.room}` : ""}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onFollowUp}
            className="flex-1 rounded-lg border-none bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-all duration-150 hover:bg-red-50 active:scale-[0.97]"
          >
            Follow Up
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-red-400 bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-red-800 active:scale-[0.97]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
