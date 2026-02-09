import PatientCard from "./PatientCard";

export default function Dashboard({ patients, onVoiceClick, dismissedCount, onClearDismissed, onDischargeClick, onDeleteTask, onEditTask }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-blue-600 px-4 py-4 shadow-md">
        <div className="w-20" />
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Noa Health
        </h1>
        <div className="flex w-20 justify-end">
          {dismissedCount > 0 && (
            <button
              onClick={onClearDismissed}
              className="rounded-lg border-none bg-blue-700 px-2.5 py-1 text-xs font-medium text-blue-100 transition-colors duration-150 hover:bg-blue-800 active:bg-blue-900"
            >
              Clear ({dismissedCount})
            </button>
          )}
        </div>
      </header>

      {/* Patient list */}
      <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4 pb-28 sm:px-6">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            patientId={patient.id}
            onDischargeClick={onDischargeClick}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
          />
        ))}
      </main>

      {/* Floating mic button */}
      <button
        onClick={onVoiceClick}
        className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full border-none bg-red-500 text-white shadow-xl transition-all duration-200 hover:scale-110 hover:bg-red-600 hover:shadow-2xl active:scale-95"
        aria-label="Voice input"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
        >
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
          <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.07A7 7 0 0 0 19 11Z" />
        </svg>
      </button>
    </div>
  );
}
