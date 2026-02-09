import Anthropic from "@anthropic-ai/sdk";

function parseCommandFallback(command, currentTask) {
  const lower = command.toLowerCase();

  if (/\bdelete\b/.test(lower)) {
    return { action: "delete" };
  }

  const updates = {};

  // Priority
  if (/\b(stat|urgent)\b/.test(lower)) {
    updates.priority = "Stat";
  } else if (/\broutine\b/.test(lower)) {
    updates.priority = "Routine";
  }

  // Status
  if (/\b(complete|confirmed|done|finish)\b/.test(lower)) {
    updates.status = "Confirmed";
  } else if (/\bdelay/.test(lower)) {
    updates.status = "Delayed";
  } else if (/\bpending\b/.test(lower)) {
    updates.status = "Pending";
  }

  // Room
  const roomMatch = lower.match(/room\s+([\w-]+)/);
  if (roomMatch) {
    updates.room = roomMatch[1].toUpperCase();
  }

  // Department
  const deptMap = {
    radiology: "Radiology",
    lab: "Lab",
    pharmacy: "Pharmacy",
    transport: "Transport",
    "social work": "Social Work",
  };
  for (const [keyword, dept] of Object.entries(deptMap)) {
    if (lower.includes(keyword)) {
      updates.department = dept;
      break;
    }
  }

  if (Object.keys(updates).length === 0) {
    updates.description = command.trim();
  }

  return { ...currentTask, ...updates };
}

export async function parseTaskCommand(command, currentTask) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[claudeTaskParser] No API key found, using fallback parser");
    return parseCommandFallback(command, currentTask);
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 256,
      system:
        "You are a medical task management AI. You parse edit commands for hospital tasks and return structured JSON updates.",
      messages: [
        {
          role: "user",
          content: `Current task:
${JSON.stringify(currentTask, null, 2)}

Nurse's edit command: "${command}"

Parse this command and return ONLY raw JSON (no markdown, no backticks) with the updated task fields.

Rules:
- Only include fields that should change. Keep unchanged fields out of the response.
- Valid statuses: "Pending", "Confirmed", "Delayed"
- Valid priorities: "Stat", "Routine"
- Valid departments: "Radiology", "Lab", "Pharmacy", "Transport", "Social Work", "Other"
- Room should be uppercase (e.g., "405", "12A")
- If the command says "delete", "remove", or "cancel this task", return: {"action": "delete"}
- If the command updates the description, use professional medical terminology
- "mark as completed" or "mark as done" → status: "Confirmed"
- "mark as delayed" → status: "Delayed"
- "mark as pending" → status: "Pending"

Examples:
Command: "change priority to stat" → {"priority": "Stat"}
Command: "move to room 405" → {"room": "405"}
Command: "mark as completed" → {"status": "Confirmed"}
Command: "change department to pharmacy" → {"department": "Pharmacy"}
Command: "delete task" → {"action": "delete"}
Command: "update description to CBC with differential" → {"description": "CBC with differential"}`,
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
      return { action: "delete" };
    }

    return { ...currentTask, ...parsed };
  } catch (err) {
    console.error("[claudeTaskParser] API call failed, using fallback:", err);
    return parseCommandFallback(command, currentTask);
  }
}
