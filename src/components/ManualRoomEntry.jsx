import { useState, useEffect } from "react";

export default function ManualRoomEntry({ defaultRoom = "", onConfirm, onCancel, allPatients }) {
  const [room, setRoom] = useState(defaultRoom);
  const [searchName, setSearchName] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState([]);

  const isValid = (searchName.trim() !== "" || room.trim() !== "") && (!isNewPatient || (patientName.trim() !== "" && patientAge !== ""));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function filterPatients(value) {
    if (value.trim().length > 0) {
      const query = value.toLowerCase().trim();
      const matches = (allPatients || []).filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const roomMatch = p.room.toLowerCase().includes(query);
        return nameMatch || roomMatch;
      });
      setFilteredPatients(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredPatients([]);
    }
  }

  function handleSearchNameChange(value) {
    setSearchName(value);
    filterPatients(value);
  }

  function handleRoomChange(value) {
    setRoom(value);
    filterPatients(value);
  }

  function handleSelectPatient(p) {
    setSearchName(p.name);
    setRoom(p.room);
    setIsNewPatient(false);
    setShowSuggestions(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;

    const result = { room: room.trim(), searchName: searchName.trim(), isNewPatient };
    if (isNewPatient) {
      result.patientName = patientName.trim();
      result.patientAge = Number(patientAge);
    }
    onConfirm(result);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900">Enter Patient Information</h2>
        <p className="mt-1 text-sm text-gray-600">You can enter patient name, room number, or both to find the patient.</p>

        <form onSubmit={handleSubmit} className="mt-4">
          {/* Patient Name Input */}
          <div className="relative mb-4" onClick={(e) => e.stopPropagation()}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name (optional)
            </label>
            <input
              type="text"
              autoFocus
              value={searchName}
              onChange={(e) => handleSearchNameChange(e.target.value)}
              placeholder="e.g., Sarah Johnson, Johnson"
              className="w-full text-lg border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
            />
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPatient(p)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-blue-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">Room {p.room} · Age {p.age}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Room Input */}
          <div className="relative mb-4" onClick={(e) => e.stopPropagation()}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Number (optional)
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => handleRoomChange(e.target.value)}
              placeholder="e.g., 2A-208, 415"
              className="w-full text-lg border border-gray-300 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* New Patient Checkbox */}
          <label className="mt-4 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isNewPatient}
              onChange={(e) => setIsNewPatient(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">This is a new patient</span>
          </label>

          {/* New Patient Fields */}
          {isNewPatient && (
            <div className="mt-3 space-y-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Age"
                  min="0"
                  max="150"
                  className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
