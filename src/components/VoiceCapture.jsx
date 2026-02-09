import { useState, useRef, useCallback, useEffect } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { findMatchingPatients } from "../utils/roomMatcher";
import RoomDisambiguationDialog from "./RoomDisambiguationDialog";
import ManualRoomEntry from "./ManualRoomEntry";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

function parseTranscriptFallback(text) {
  const lower = text.toLowerCase();

  const roomMatch = lower.match(/room\s+([\w-]+)/);
  const room = roomMatch ? roomMatch[1].toUpperCase() : "000";

  const isDischarge = /\b(discharge|ready for discharge)\b/.test(lower);
  const needsPlacement = /\b(nursing home|snf|skilled nursing facility)\b/.test(lower);

  let department = "Other";
  if (isDischarge || needsPlacement) {
    department = "Social Work";
  } else if (/\b(mri|ct|x[\s-]?ray|radiology|ultrasound|imaging)\b/.test(lower)) {
    department = "Radiology";
  } else if (/\b(blood|lab|panel|cbc|metabolic|lipid)\b/.test(lower)) {
    department = "Lab";
  } else if (/\b(medication|drug|pharmacy|administer|dispense|dose|mg)\b/.test(lower)) {
    department = "Pharmacy";
  } else if (/\b(transport|wheelchair|stretcher|transfer|move)\b/.test(lower)) {
    department = "Transport";
  }

  const priority = /\b(stat|urgent)\b/.test(lower) ? "Stat" : "Routine";

  return {
    id: Date.now(),
    description: text.trim(),
    department,
    status: "Pending",
    createdAt: new Date().toISOString(),
    priority,
    room,
    ...(isDischarge && { isDischarge: true }),
    ...(needsPlacement && { needsPlacement: true }),
  };
}

async function parseTranscript(text) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  console.log("[VoiceCapture] VITE_ANTHROPIC_API_KEY loaded:", apiKey ? `yes (${apiKey.slice(0, 8)}...)` : "NO - key is missing");

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    system:
      "You are a medical documentation AI helping nurses create professional task entries.",
    messages: [
      {
        role: "user",
        content: `You are a medical documentation AI helping nurses create professional task entries.\n\nTranscript from voice recording: "${text}"\n\nParse this into a structured task. Clean up any speech recognition errors and create a PROFESSIONAL medical task description.\n\nGuidelines:\n- description: Should be detailed and professional (e.g., "Chest X-ray PA and lateral" not just "chest x-ray")\n- Include the ordering provider if mentioned (e.g., "ordered by Dr. Chen")\n- Use proper medical terminology\n- Be specific about the procedure/task\n- room: Extract room number (or "000" if not mentioned)\n- department: Choose from: Radiology, Lab, Pharmacy, Transport, Social Work, Other (use "Social Work" for discharge or nursing home/SNF placement requests)\n- priority: "Stat" (urgent) or "Routine"\n\nCommon medical abbreviations - expand these when they appear:\n- PA = posteroanterior\n- Lat = lateral\n- CBC = complete blood count\n- BMP = basic metabolic panel\n- CMP = comprehensive metabolic panel\n- CT = computed tomography\n- MRI = magnetic resonance imaging\n- CXR = chest X-ray\n- ABG = arterial blood gas\n- EKG/ECG = electrocardiogram\n- IV = intravenous\n- IM = intramuscular\n- subQ/SC = subcutaneous\n- Stat = immediately/urgently\n- PRN = as needed\n- BID = twice daily\n- TID = three times daily\n- QID = four times daily\n\nWhen you see abbreviations, expand them in the description for clarity.\n\nExamples of GOOD descriptions:\n- "Chest X-ray PA and lateral ordered by Dr. Chen"\n- "MRI brain with and without contrast"\n- "CBC with differential and metabolic panel"\n- "Lantus 10 units subcutaneous before meals"\n\nReturn ONLY raw JSON (no markdown, no backticks):\n{"room": "312", "description": "Chest X-ray PA and lateral ordered by Dr. Chen", "department": "Radiology", "priority": "Stat"}\n\nFor discharge or nursing home/SNF requests, also include:\n- "isDischarge": true if transcript mentions discharge or ready for discharge\n- "needsPlacement": true if transcript mentions nursing home, SNF, or skilled nursing facility\nExample: {"room": "312", "description": "Patient ready for discharge, requires SNF placement", "department": "Social Work", "priority": "Routine", "isDischarge": true, "needsPlacement": true}`,
      },
    ],
  });

  const content = message.content[0].text;
  const cleanedContent = content
    .replace(/^```json\s*\n?/i, '')
    .replace(/^```\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  const parsed = JSON.parse(cleanedContent);

  return {
    id: Date.now(),
    room: parsed.room || "000",
    description: parsed.description || text.trim(),
    department: parsed.department || "Other",
    priority: parsed.priority || "Routine",
    status: "Pending",
    createdAt: new Date().toISOString(),
    ...(parsed.isDischarge && { isDischarge: true }),
    ...(parsed.needsPlacement && { needsPlacement: true }),
  };
}

export default function VoiceCapture({ onClose, onTaskCreated, allPatients }) {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [roomMatches, setRoomMatches] = useState(null);
  const [showRoomDisambiguation, setShowRoomDisambiguation] = useState(false);
  const [showManualRoomEntry, setShowManualRoomEntry] = useState(false);
  const [parsedTaskDraft, setParsedTaskDraft] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone permissions.");
      } else if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setError(null);

    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setError("Failed to start speech recognition.");
    }
  }, [isRecording]);

  const handleCreateTask = async () => {
    if (!transcript.trim()) {
      alert("Please record something first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let parsedTask;
      try {
        parsedTask = await parseTranscript(transcript.trim());
        console.log("[VoiceCapture] Claude API succeeded:", parsedTask);
      } catch (err) {
        console.error("[VoiceCapture] Claude API failed, falling back:", err);
        parsedTask = parseTranscriptFallback(transcript.trim());
      }

      if (!parsedTask) {
        alert("Could not parse task. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Step 2: Handle patient matching (by room OR name)
      const searchInput = parsedTask.patientName || (parsedTask.room && parsedTask.room !== "000" ? parsedTask.room : null);

      if (searchInput) {
        const matches = findMatchingPatients(searchInput, allPatients);

        if (matches.matchType === "exact") {
          onTaskCreated({
            ...parsedTask,
            room: matches.exactMatch.room,
            patientName: matches.exactMatch.name,
          });
          onClose();
        } else if (matches.matchType === "partial") {
          if (matches.partialMatches.length === 1) {
            onTaskCreated({
              ...parsedTask,
              room: matches.partialMatches[0].room,
              patientName: matches.partialMatches[0].name,
            });
            onClose();
          } else {
            setParsedTaskDraft(parsedTask);
            setRoomMatches(matches);
            setShowRoomDisambiguation(true);
            setIsProcessing(false);
          }
        } else {
          setParsedTaskDraft(parsedTask);
          setShowManualRoomEntry(true);
          setIsProcessing(false);
        }
      } else {
        // No patient identifier (room or name) - show manual entry
        setParsedTaskDraft(parsedTask);
        setShowManualRoomEntry(true);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Task creation error:", error);
      alert("Error creating task. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleRoomSelected = (patient) => {
    if (parsedTaskDraft) {
      onTaskCreated({ ...parsedTaskDraft, room: patient.room, patientName: patient.name });
      onClose();
    }
  };

  const handleManualRoomConfirm = (roomData) => {
    if (parsedTaskDraft) {
      // If user entered searchName or room, try to find matching patient
      if (!roomData.isNewPatient && (roomData.searchName || roomData.room)) {
        const searchInput = roomData.searchName || roomData.room;
        const matches = findMatchingPatients(searchInput, allPatients);

        if (matches.exactMatch) {
          onTaskCreated({
            ...parsedTaskDraft,
            room: matches.exactMatch.room,
            patientName: matches.exactMatch.name,
          });
          onClose();
          return;
        } else if (matches.partialMatches.length === 1) {
          onTaskCreated({
            ...parsedTaskDraft,
            room: matches.partialMatches[0].room,
            patientName: matches.partialMatches[0].name,
          });
          onClose();
          return;
        } else if (matches.partialMatches.length > 1) {
          setRoomMatches(matches);
          setShowManualRoomEntry(false);
          setShowRoomDisambiguation(true);
          return;
        }
      }

      // If new patient or no matches, create accordingly
      if (roomData.isNewPatient) {
        onTaskCreated({
          ...parsedTaskDraft,
          room: roomData.room,
          isNewPatient: true,
          patientName: roomData.patientName,
          patientAge: roomData.patientAge,
        });
      } else {
        onTaskCreated({
          ...parsedTaskDraft,
          room: roomData.room || "Unknown",
        });
      }
      onClose();
    }
  };

  const handleDisambiguationCancel = () => {
    setShowRoomDisambiguation(false);
    setShowManualRoomEntry(false);
    setParsedTaskDraft(null);
    setRoomMatches(null);
    setIsProcessing(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center bg-blue-600 px-4 py-4 shadow-md">
        <button
          onClick={onClose}
          className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg border-none bg-transparent text-white transition-colors duration-150 hover:bg-blue-700 active:bg-blue-800"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">Voice Capture</h1>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-5 py-6 sm:px-6">
        {/* Mic button */}
        <div className="flex flex-col items-center gap-3 pt-8">
          <button
            onClick={toggleRecording}
            className={`flex h-32 w-32 items-center justify-center rounded-full border-none bg-red-500 text-white shadow-xl transition-all duration-200 hover:bg-red-600 hover:shadow-2xl active:scale-95 ${
              isRecording ? "animate-pulse" : ""
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-14 w-14"
            >
              <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
              <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.07A7 7 0 0 0 19 11Z" />
            </svg>
          </button>
          <p className="text-sm font-medium text-gray-500">
            {isRecording ? "Listening..." : "Tap to record"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="w-full rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Transcript */}
        <div className="w-full rounded-xl bg-white p-4 shadow-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transcript (tap to edit):
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your speech will appear here. Tap to edit before creating the task."
            className="w-full min-h-[120px] p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* Create Task button */}
        {transcript.trim() && (
          <button
            onClick={handleCreateTask}
            disabled={isProcessing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-none bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] active:bg-blue-800 disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              "Create Task"
            )}
          </button>
        )}
      </main>

      {showRoomDisambiguation && roomMatches && (
        <RoomDisambiguationDialog
          spokenRoom={parsedTaskDraft?.patientName || parsedTaskDraft?.room || ""}
          matchingRooms={roomMatches.partialMatches}
          matchedBy={roomMatches.matchedBy}
          onSelect={handleRoomSelected}
          onManualEntry={() => {
            setShowRoomDisambiguation(false);
            setShowManualRoomEntry(true);
          }}
          onCancel={handleDisambiguationCancel}
        />
      )}

      {showManualRoomEntry && (
        <ManualRoomEntry
          defaultRoom={parsedTaskDraft?.room || ""}
          onConfirm={handleManualRoomConfirm}
          onCancel={handleDisambiguationCancel}
        />
      )}
    </div>
  );
}
