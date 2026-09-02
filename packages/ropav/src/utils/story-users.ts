import { avatarSrc } from "./story-assets";

/** Story-only, like the rest of the `story-*` helpers, so deliberately not re-exported. */
export interface User {
  id: number;
  image_url: string;
  name: string;
  role: string;
  status: "Active" | "Inactive" | "On Leave";
  email: string;
}

const ROLES = [
  "Software Engineer",
  "Senior Engineer",
  "Staff Engineer",
  "Product Manager",
  "Designer",
  "Data Analyst",
  "QA Engineer",
  "DevOps Engineer",
  "Marketing Manager",
  "Sales Representative",
];

const STATUSES: User["status"][] = ["Active", "Inactive", "On Leave"];

const FIRST_NAMES = [
  "Emma",
  "Liam",
  "Olivia",
  "Noah",
  "Ava",
  "James",
  "Sophia",
  "Oliver",
  "Isabella",
  "Lucas",
  "Mia",
  "Ethan",
  "Charlotte",
  "Mason",
  "Amelia",
  "Logan",
  "Harper",
  "Alexander",
  "Ella",
  "Benjamin",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Anderson",
  "Taylor",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
];

/** The same rows in the same order as the React story, so the two can be compared row by row. */
export const generateUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length]!;
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!;

    return {
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`,
      id: index + 1,
      image_url: avatarSrc("red"),
      name: `${firstName} ${lastName}`,
      role: ROLES[index % ROLES.length]!,
      status: STATUSES[index % STATUSES.length]!,
    };
  });
