import Anthropic from "@anthropic-ai/sdk";

/**
 * Parse a voice transcript into a structured hospital task.
 *
 * Takes raw speech-to-text output from a nurse's voice recording and sends it
 * to the Claude API to produce a professional, structured task object with
 * fields like description, department, room, priority, and status.
 *
 * @param {string} transcript - Raw text from Web Speech API
 * @returns {Promise<object>} Structured task object:
 *   { id, description, department, room, priority, status, createdAt, isDischarge?, needsPlacement? }
 */
export async function parseVoiceToTask(transcript) {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: `You are a medical task parser for a hospital nursing coordination app. Convert nurse voice transcripts into structured tasks using proper medical terminology and abbreviations.

MEDICAL ABBREVIATIONS (recognize and expand these):
- CBC → Complete Blood Count with differential
- BMP → Basic Metabolic Panel
- CMP → Comprehensive Metabolic Panel
- PT/INR → Prothrombin Time and International Normalized Ratio
- CXR → Chest X-ray PA and lateral
- CT → CT scan (specify body part if mentioned)
- MRI → MRI (specify body part if mentioned)
- EKG/ECG → 12-lead Electrocardiogram
- ABG → Arterial Blood Gas
- UA → Urinalysis with microscopy
- KUB → Kidneys, Ureters, and Bladder X-ray

MEDICATION ABBREVIATIONS:
- BID → Twice daily
- TID → Three times daily
- QID → Four times daily
- PRN → As needed
- NPO → Nothing by mouth
- PO → By mouth
- IV → Intravenous
- subcut/SQ → Subcutaneous

PRIORITY KEYWORDS:
- STAT, urgent, emergency, ASAP, now, immediately → Priority: 'Stat'
- routine, scheduled, regular, when available → Priority: 'Routine'

DEPARTMENT MAPPING (assign based on keywords):
- Radiology: X-ray, CT, MRI, ultrasound, imaging, scan, CXR, KUB
- Lab: blood work, labs, CBC, BMP, CMP, culture, draw, PT/INR, ABG, UA
- Pharmacy: medication, med, drug, insulin, dose, prescription
- Physical Therapy: PT eval, mobility, walker, ambulation
- Social Work: discharge planning, SNF, nursing home placement
- Nursing: vitals, assessment, wound care, dressing change, IV, foley

ROOM NUMBER EXTRACTION:
- Look for patterns: 'room 208', 'bed 3', 'patient in 2A-208'
- Extract just the room identifier
- If no room mentioned, return: 'room': null (we'll handle disambiguation separately)

PATIENT NAME EXTRACTION:
- Look for patient names in these patterns:
  • "for [First Last]" → e.g., "for Sarah Johnson"
  • "[First Last] needs..." → e.g., "Sarah Johnson needs CBC"
  • "patient [First Last]" → e.g., "patient Michael Chen"
  • "[Last] in room..." → e.g., "Johnson in room 312"
  • "Mrs./Mr. [Last]" → e.g., "Mrs. Williams"
- Extract the full name if mentioned
- If only last name mentioned, extract just that
- If no name mentioned, return: 'patientName': null

OUTPUT FORMAT (JSON only, no other text):
{
  "description": "Full medical description with proper terminology",
  "department": "Department name",
  "priority": "Stat" or "Routine",
  "room": "Room number or null",
  "patientName": "Patient name or null",
  "status": "Pending"
}

EXAMPLES:

Input: 'Order CBC for room 208 stat'
Output: {"description": "Complete Blood Count with differential", "department": "Lab", "priority": "Stat", "room": "208", "patientName": null, "status": "Pending"}

Input: 'Patient in 2A-208 needs PT eval'
Output: {"description": "Physical Therapy evaluation", "department": "Physical Therapy", "priority": "Routine", "room": "2A-208", "patientName": null, "status": "Pending"}

Input: 'CXR for bed 5, routine'
Output: {"description": "Chest X-ray PA and lateral", "department": "Radiology", "priority": "Routine", "room": "5", "patientName": null, "status": "Pending"}

Input: 'Give Lantus 10 units subcut to patient 415'
Output: {"description": "Lantus 10 units subcutaneous", "department": "Pharmacy", "priority": "Routine", "room": "415", "patientName": null, "status": "Pending"}

Input: 'BMP and PT INR for 3B-208'
Output: {"description": "Basic Metabolic Panel and Prothrombin Time with INR", "department": "Lab", "priority": "Routine", "room": "3B-208", "patientName": null, "status": "Pending"}

Input: 'Order CBC for Sarah Johnson stat'
Output: {"description": "Complete Blood Count with differential", "department": "Lab", "priority": "Stat", "room": null, "patientName": "Sarah Johnson", "status": "Pending"}

Input: 'Johnson in room 208 needs CXR'
Output: {"description": "Chest X-ray PA and lateral", "department": "Radiology", "priority": "Routine", "room": "208", "patientName": "Johnson", "status": "Pending"}

Input: 'Patient Michael Chen needs PT eval'
Output: {"description": "Physical Therapy evaluation", "department": "Physical Therapy", "priority": "Routine", "room": null, "patientName": "Michael Chen", "status": "Pending"}

Input: 'Mrs. Williams needs discharge planning'
Output: {"description": "Discharge planning", "department": "Social Work", "priority": "Routine", "room": null, "patientName": "Mrs. Williams", "status": "Pending"}

Always use complete medical terminology in descriptions, never abbreviations.`,
      messages: [
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    const content = message.content[0].text;
    const cleaned = content
      .replace(/^```json\s*\n?/i, "")
      .replace(/^```\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      id: Date.now(),
      description: parsed.description || transcript.trim(),
      department: parsed.department || "Other",
      priority: parsed.priority || "Routine",
      room: parsed.room || "000",
      patientName: parsed.patientName || null,
      status: parsed.status || "Pending",
      createdAt: new Date(),
    };
  } catch (err) {
    console.error("[claudeAPI] parseVoiceToTask failed:", err);
    return null;
  }
}

/**
 * Parse a nurse's edit command against an existing task.
 *
 * Sends a natural-language command (voice or typed) along with the current task
 * state to the Claude API. Returns a structured result with only the changed
 * fields, a delete action, or an error message.
 *
 * @param {string} command - Natural-language edit instruction
 * @param {object} currentTask - The task object being edited
 * @returns {Promise<{updates: object|null, action: string|null, error: string|null}>}
 */
export async function parseTaskEditCommand(command, currentTask) {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      system: `You are a task editor for a nursing coordination app. Parse natural language editing commands and return ONLY the fields that should change.

Context: You receive the current task state and a command to modify it.

Valid fields:
- priority: 'Stat' or 'Routine'
- status: 'Pending', 'Confirmed', or 'Delayed'
- department: 'Radiology', 'Lab', 'Pharmacy', 'Nursing', 'Physical Therapy', 'Social Work'
- description: string (full task description with medical terminology)
- room: string (room number)

Special actions:
- Delete commands → return: {"action": "delete"}
- Ambiguous commands → return: {"error": "Message explaining confusion"}

Command interpretation:
- 'change to stat', 'make stat', 'urgent' → {"priority": "Stat"}
- 'mark complete', 'completed', 'done' → {"status": "Confirmed"}
- 'mark delayed', 'delayed' → {"status": "Delayed"}
- 'move to pharmacy', 'pharmacy department' → {"department": "Pharmacy"}
- 'delete', 'remove', 'cancel task' → {"action": "delete"}
- 'change room to 405' → {"room": "405"}

Return ONLY valid JSON with changed fields.

Examples:
Command: 'change priority to stat'
Current task: {"description": "MRI scan", "priority": "Routine", "status": "Pending"}
Output: {"priority": "Stat"}

Command: 'mark this completed'
Current task: {"description": "X-ray", "status": "Pending"}
Output: {"status": "Confirmed"}

Command: 'delete this task'
Output: {"action": "delete"}

Command: 'move patient to room 508'
Current task: {"room": "312"}
Output: {"room": "508"}`,
      messages: [
        {
          role: "user",
          content: `Command: '${command}'\n\nCurrent task: ${JSON.stringify(currentTask)}`,
        },
      ],
    });

    const content = message.content[0].text;
    const cleaned = content
      .replace(/^```json\s*\n?/i, "")
      .replace(/^```\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (parsed.action === "delete") {
      return { updates: null, action: "delete", error: null };
    }

    if (parsed.error) {
      return { updates: null, action: null, error: parsed.error };
    }

    return { updates: parsed, action: null, error: null };
  } catch (err) {
    console.error("[claudeAPI] parseTaskEditCommand failed:", err);
    return { updates: null, action: null, error: err.message || "Failed to parse edit command" };
  }
}
