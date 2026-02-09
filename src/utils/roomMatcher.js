/**
 * Map of spoken number words to their digit equivalents.
 * Covers zero through nine plus common speech-to-text variants.
 */
const wordToDigit = {
  zero: "0",
  oh: "0",
  one: "1",
  two: "2",
  to: "2",
  too: "2",
  three: "3",
  four: "4",
  for: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

/**
 * Normalize a spoken room identifier into a comparable string.
 *
 * Steps:
 *  1. Lowercase the input
 *  2. Replace number words ("two oh eight") with digits ("208")
 *  3. Strip spaces, hyphens, and special characters
 *  4. Uppercase the result for consistent comparison
 *
 * @param {string} spoken - Raw spoken or typed room reference
 * @returns {string} Normalized room string, e.g. "2A208"
 */
function normalizeRoom(spoken) {
  let normalized = spoken.toLowerCase();

  // Replace each number word with its digit
  for (const [word, digit] of Object.entries(wordToDigit)) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, "g"), digit);
  }

  // Strip spaces, hyphens, and non-alphanumeric characters
  normalized = normalized.replace(/[^a-z0-9]/g, "").toUpperCase();

  return normalized;
}

/**
 * Check whether a string looks like a room number (only digits, hyphens, and
 * short letter prefixes like "2A").
 */
function looksLikeRoom(str) {
  const cleaned = str.trim().replace(/[\s-]/g, "");
  // Room numbers: digits optionally preceded/followed by a single letter, e.g. "208", "2A-312", "A3"
  return /^[a-zA-Z]?\d+[a-zA-Z]?$/.test(cleaned);
}

/**
 * Try to split an input like "Sarah in 208" into a name part and a room part.
 * Returns { name, room } where either can be null.
 */
function extractNameAndRoom(input) {
  // Look for patterns like "name in room" or "name room" where room is at the end
  const inPattern = /^(.+?)\s+in\s+(\S+)$/i;
  const match = input.match(inPattern);
  if (match) {
    const namePart = match[1].trim();
    const roomPart = match[2].trim();
    if (looksLikeRoom(roomPart)) {
      return { name: namePart, room: roomPart };
    }
  }
  return null;
}

/**
 * Match a search name against a patient's name.
 *
 * @param {string} searchName - The name to search for
 * @param {{name: string}} patient - Patient object with a name field
 * @returns {'exact'|'partial'|null} Match quality or null for no match
 */
function matchByName(searchName, patient) {
  const normalized = searchName.toLowerCase().trim();
  const patientName = patient.name.toLowerCase();

  // Exact match
  if (patientName === normalized) return "exact";

  // Split into parts
  const searchParts = normalized.split(" ");
  const nameParts = patientName.split(" ");

  // Last name match
  if (searchParts.length === 1) {
    if (nameParts.some((part) => part === normalized)) return "partial";
  }

  // First + Last match
  if (searchParts.length >= 2) {
    const firstName = searchParts[0];
    const lastName = searchParts[searchParts.length - 1];
    if (nameParts.includes(firstName) && nameParts.includes(lastName)) {
      return "exact";
    }
  }

  // Contains match
  if (patientName.includes(normalized)) return "partial";

  return null;
}

/**
 * Match rooms using existing room-matching logic.
 */
function matchByRoom(spokenRoom, allPatients) {
  const normalizedSpoken = normalizeRoom(spokenRoom);

  if (!normalizedSpoken) {
    return { exactMatch: null, partialMatches: [], matchType: "none" };
  }

  const partialMatches = [];

  for (const patient of allPatients) {
    const normalizedPatientRoom = normalizeRoom(patient.room || "");

    // Exact match — return immediately
    if (normalizedPatientRoom === normalizedSpoken) {
      return { exactMatch: patient, partialMatches: [], matchType: "exact" };
    }

    // Suffix match — "208" matches end of "2A208"
    // Partial match — spoken value found anywhere in the room string
    if (
      normalizedPatientRoom.endsWith(normalizedSpoken) ||
      normalizedPatientRoom.includes(normalizedSpoken)
    ) {
      partialMatches.push(patient);
    }
  }

  return {
    exactMatch: null,
    partialMatches,
    matchType: partialMatches.length > 0 ? "partial" : "none",
  };
}

/**
 * Match patient input that can be a room number, patient name, or both.
 *
 * @param {string} input - Room number ("208"), name ("Sarah Johnson"), or both ("Sarah in 208")
 * @param {Array<{room: string, name: string}>} allPatients - Patient list
 * @returns {{
 *   exactMatch: object|null,
 *   partialMatches: object[],
 *   matchType: 'exact'|'partial'|'none',
 *   matchedBy: 'room'|'name'|'name+room'
 * }}
 */
export function findMatchingPatients(input, allPatients) {
  const trimmed = input.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return {
      exactMatch: null,
      partialMatches: [],
      matchType: "none",
      matchedBy: "room",
    };
  }

  // SCENARIO C: Input contains both name AND room (e.g. "Sarah in 208")
  const combined = extractNameAndRoom(trimmed);
  if (combined) {
    const roomResult = matchByRoom(combined.room, allPatients);
    const roomCandidates = roomResult.exactMatch
      ? [roomResult.exactMatch, ...roomResult.partialMatches]
      : roomResult.partialMatches;

    let exactMatch = null;
    const partialMatches = [];

    for (const patient of roomCandidates) {
      const nameMatch = matchByName(combined.name, patient);
      if (nameMatch === "exact") {
        exactMatch = patient;
      } else if (nameMatch === "partial") {
        partialMatches.push(patient);
      }
    }

    if (exactMatch) {
      return {
        exactMatch,
        partialMatches,
        matchType: "exact",
        matchedBy: "name+room",
      };
    }
    if (partialMatches.length > 0) {
      return {
        exactMatch: null,
        partialMatches,
        matchType: "partial",
        matchedBy: "name+room",
      };
    }
    return {
      exactMatch: null,
      partialMatches: [],
      matchType: "none",
      matchedBy: "name+room",
    };
  }

  // SCENARIO A: Input looks like a room number (only numbers/hyphens/short letter prefix)
  if (looksLikeRoom(trimmed)) {
    return { ...matchByRoom(trimmed, allPatients), matchedBy: "room" };
  }

  // SCENARIO B: Input contains a patient name
  let exactMatch = null;
  const partialMatches = [];

  for (const patient of allPatients) {
    const nameMatch = matchByName(trimmed, patient);
    if (nameMatch === "exact") {
      exactMatch = patient;
    } else if (nameMatch === "partial") {
      partialMatches.push(patient);
    }
  }

  if (exactMatch) {
    return {
      exactMatch,
      partialMatches,
      matchType: "exact",
      matchedBy: "name",
    };
  }
  if (partialMatches.length > 0) {
    return {
      exactMatch: null,
      partialMatches,
      matchType: "partial",
      matchedBy: "name",
    };
  }
  return {
    exactMatch: null,
    partialMatches: [],
    matchType: "none",
    matchedBy: "name",
  };
}

// Backward-compatible alias
export { findMatchingPatients as findMatchingRooms };
