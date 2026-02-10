import PatientCard from "./PatientCard";

export default function Dashboard({ patients, onVoiceClick, dismissedCount, onClearDismissed, onDischargeClick, onDeleteTask, onEditTask, onGenerateHandoff, onPatientHandoff, handoffLoading, onAddNote, onEditNote, onDeleteNote, onGeneratePatientUpdate, onShowContacts, patientUpdateLoading, onSwitchToChargeView }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={onGenerateHandoff}
            disabled={handoffLoading}
            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {handoffLoading ? "Generating..." : "Handoff"}
          </button>
          <button
            onClick={onSwitchToChargeView}
            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 active:scale-[0.97]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Unit View
          </button>
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          <span className="text-blue-600">noa</span> health
        </h1>
        <div className="flex w-28 justify-end">
          {dismissedCount > 0 && (
            <button
              onClick={onClearDismissed}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-100"
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
            onPatientHandoff={onPatientHandoff}
            handoffLoading={handoffLoading}
            onAddNote={onAddNote}
            onEditNote={onEditNote}
            onDeleteNote={onDeleteNote}
            onGeneratePatientUpdate={onGeneratePatientUpdate}
            onShowContacts={onShowContacts}
            patientUpdateLoading={patientUpdateLoading}
          />
        ))}
      </main>

      {/* Floating mic button */}
      <button
        onClick={onVoiceClick}
        className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full border-none bg-blue-600 text-white shadow-lg ring-4 ring-blue-600/20 transition-all duration-200 hover:scale-105 hover:bg-blue-700 hover:shadow-xl hover:ring-blue-700/20 active:scale-95"
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
