# Noa Health - Nursing Coordination App

A voice-enabled hospital task management app for nurses. Speak a medical order, and the app uses Claude AI to parse it into a structured task with proper terminology, department routing, and patient matching.

## Features

### Voice-Powered Task Creation
- Tap the mic button, speak a medical order (e.g., "Order CBC for Sarah Johnson stat")
- Claude AI expands abbreviations into full medical terminology
- Automatically routes tasks to the correct department (Radiology, Lab, Pharmacy, etc.)
- Detects priority (Stat vs Routine) from keywords

### Patient Matching
- Match patients by **room number** ("room 208", "2A-312")
- Match patients by **name** ("Sarah Johnson", "Johnson")
- Match by **both** ("Johnson in room 208")
- Disambiguation dialog when multiple patients match (e.g., two patients named "Johnson")
- Manual entry fallback with option to create new patients

### Task Management
- View all patient tasks grouped by patient card
- Edit tasks via voice or text ("change to stat", "move to pharmacy")
- Delete tasks with confirmation dialog
- Status tracking: Pending, Confirmed, Delayed

### Delayed Task Alerts
- Red alert banner when tasks become delayed
- Follow Up or Dismiss actions
- Dismissed alerts persist in localStorage

### Discharge Planning
- Mark patients for discharge from their card
- Options: notify patient, request nursing home/SNF placement, add notes
- Creates Social Work department tasks automatically

## Tech Stack

- **React 19** with Vite
- **Tailwind CSS** for styling
- **Anthropic SDK** (`@anthropic-ai/sdk`) for Claude AI integration
- **Web Speech API** for voice recording

## File Structure

```
src/
├── main.jsx                          # Entry point
├── App.jsx                           # Root component, state management, task lifecycle
├── index.css                         # Global styles & Tailwind import
├── mockData.js                       # Sample patient data (5 patients)
│
├── components/
│   ├── Dashboard.jsx                 # Main layout: header, patient list, floating mic button
│   ├── PatientCard.jsx               # Patient info card with task list & discharge button
│   ├── TaskCard.jsx                  # Individual task with status badge, edit/delete controls
│   ├── VoiceCapture.jsx              # Voice recording UI, transcript editing, patient matching flow
│   ├── TaskEditDialog.jsx            # Modal for editing tasks via voice or text
│   ├── DischargeDialog.jsx           # Modal for discharge planning options
│   ├── DeleteConfirmModal.jsx        # Task deletion confirmation dialog
│   ├── RoomDisambiguationDialog.jsx  # Picker when multiple patients match a search
│   └── ManualRoomEntry.jsx           # Manual patient name/room entry form
│
└── utils/
    ├── claudeAPI.js                  # Claude API integration (task parsing & edit commands)
    ├── claudeTaskParser.js           # Fallback regex-based parser when API is unavailable
    ├── medicalTerms.js               # Medical abbreviation & department reference data
    └── roomMatcher.js                # Room number normalization & patient name matching
```

### Key Components

| Component | Purpose |
|---|---|
| **App** | Manages patients, tasks, delayed alerts, and dialog state. Orchestrates all child components. |
| **Dashboard** | Renders patient cards and the floating mic button. Displays delayed task alerts at the top. |
| **PatientCard** | Shows patient name/age/room, task count badge, task list, and discharge button. |
| **TaskCard** | Displays a single task with department, timestamp, status badge, and edit/delete actions. |
| **VoiceCapture** | Full-screen voice capture: records speech, sends transcript to Claude, handles patient matching (exact/partial/disambiguation/manual entry). |
| **TaskEditDialog** | Modal with voice and text input for editing an existing task. Sends commands to Claude for parsing. |
| **RoomDisambiguationDialog** | Shows when multiple patients match. Displays patient cards to pick from, with context-aware subtitle based on match type (room/name/both). |
| **ManualRoomEntry** | Fallback form when no patient match is found. Accepts patient name, room number, or both. Includes "new patient" mode with name/age fields. |

### Key Utilities

| Utility | Purpose |
|---|---|
| **claudeAPI.js** | Two functions: `parseVoiceToTask` (transcript to structured task) and `parseTaskEditCommand` (edit command to field changes). Both use Claude Sonnet 4.5. |
| **roomMatcher.js** | `findMatchingPatients(input, allPatients)` — matches by room, name, or both. Normalizes spoken numbers ("two oh eight" to "208"). Returns exact/partial matches with `matchedBy` indicator. |
| **claudeTaskParser.js** | Regex-based fallback parser for when the Claude API is unavailable. |
| **medicalTerms.js** | Reference dictionaries for medical abbreviations and department keyword mapping. |

## API Integration

### Environment Variables

Create a `.env` file in the project root:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### Claude API Usage

The app makes two types of Claude API calls, both using `claude-sonnet-4-5-20250929`:

**1. Task Parsing** (`parseVoiceToTask`)
- Input: raw voice transcript
- Output: `{ description, department, priority, room, patientName, status }`
- The system prompt includes medical abbreviation expansion rules, department mapping, priority detection, room extraction, and patient name extraction

**2. Task Editing** (`parseTaskEditCommand`)
- Input: natural language command + current task state
- Output: JSON with only the changed fields, or a delete/error action

### Fallback Behavior

If the Claude API call fails, the app falls back to a regex-based parser that handles basic department routing and room extraction without AI.

### Security Note

API calls currently run client-side with `dangerouslyAllowBrowser: true`. For production, route requests through a backend proxy to avoid exposing the API key.

## Getting Started

```bash
# Install dependencies
npm install

# Create .env with your Anthropic API key
echo "VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env

# Start dev server
npm run dev
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Mock Data

The app ships with 5 sample patients for development and testing:

| Patient | Room | Age | Notes |
|---|---|---|---|
| James Whitfield | 2A-312 | 72 | 3 tasks (Radiology, Pharmacy, Lab) |
| Maria Santos | 2B-415 | 45 | 2 tasks (Radiology, Lab) |
| Robert Chen | 3A-208 | 58 | 3 tasks (Radiology, Pharmacy, Lab) |
| Robert Martinez | 3B-208 | 81 | 1 task (Physical Therapy) |
| Jennifer Johnson | 4A-101 | 45 | 1 task (Lab) — tests name disambiguation |

Searching "Johnson" triggers the disambiguation flow. Rooms "3A-208" and "3B-208" test room disambiguation for partial matches on "208".

## Known Issues & TODOs

- **No data persistence** — all data is in-memory mock data; refreshing resets everything
- **Client-side API key** — the Anthropic API key is exposed in the browser; needs a backend proxy for production
- **Browser support** — Web Speech API is not supported in all browsers (works best in Chrome)
- **No authentication** — no user login or role-based access
- **localStorage only** — dismissed alert state is local to the device, not synced
- **Auto-delay simulation** — new tasks auto-transition to "Delayed" after 15 seconds for demo purposes; would need real status tracking in production
