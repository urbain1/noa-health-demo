const now = Date.now();
const minutesAgo = (m) => new Date(now - m * 60 * 1000).toISOString();

export const patients = [
  {
    id: 1,
    name: "Sarah Johnson",
    age: 67,
    room: "2A-312",
    tasks: [
      {
        id: 101,
        description: "MRI brain with contrast",
        department: "Radiology",
        status: "Pending",
        timestamp: minutesAgo(14),
        priority: "routine",
      },
      {
        id: 102,
        description: "Lantus 10 units subcutaneous",
        department: "Pharmacy",
        status: "Confirmed",
        timestamp: minutesAgo(45),
        priority: "routine",
      },
      {
        id: 103,
        description: "Complete Blood Count with differential",
        department: "Lab",
        status: "Pending",
        timestamp: minutesAgo(8),
        priority: "stat",
      },
    ],
  },
  {
    id: 2,
    name: "Maria Santos",
    age: 45,
    room: "2B-415",
    tasks: [
      {
        id: 201,
        description: "Abdominal Ultrasound",
        department: "Radiology",
        status: "Delayed",
        timestamp: minutesAgo(47),
        priority: "medium",
      },
      {
        id: 202,
        description: "Lipid Panel",
        department: "Lab",
        status: "Confirmed",
        timestamp: minutesAgo(12),
        priority: "low",
      },
    ],
  },
  {
    id: 3,
    name: "Robert Chen",
    age: 58,
    room: "3A-208",
    tasks: [
      {
        id: 301,
        description: "MRI Lower Spine",
        department: "Radiology",
        status: "Pending",
        timestamp: minutesAgo(55),
        priority: "high",
      },
      {
        id: 302,
        description: "Dispense Ibuprofen 400mg",
        department: "Pharmacy",
        status: "Confirmed",
        timestamp: minutesAgo(15),
        priority: "medium",
      },
      {
        id: 303,
        description: "Basic Metabolic Panel",
        department: "Lab",
        status: "Delayed",
        timestamp: minutesAgo(38),
        priority: "low",
      },
    ],
  },
  {
    id: 4,
    name: "Robert Martinez",
    age: 81,
    room: "3B-208",
    tasks: [
      {
        id: 401,
        description: "Physical Therapy evaluation",
        department: "Physical Therapy",
        status: "Pending",
        timestamp: minutesAgo(18),
        priority: "routine",
      },
    ],
  },
  {
    id: 5,
    name: "Jennifer Johnson",
    age: 45,
    room: "4A-101",
    tasks: [
      {
        id: 501,
        description: "Basic Metabolic Panel",
        department: "Lab",
        status: "Pending",
        timestamp: minutesAgo(5),
        priority: "routine",
      },
    ],
  },
];
