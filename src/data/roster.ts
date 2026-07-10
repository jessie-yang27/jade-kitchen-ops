// Sunday volunteer roster. Placeholder — replace with the real sign-up sheet
// for a given week; the shape is what Stage 2 needs (name + availability
// window) to assign tasks within someone's hours.

export type RosterMember = {
  name: string;
  availableFrom: string; // "HH:MM"
  availableTo: string; // "HH:MM"
};

export const roster: RosterMember[] = [
  { name: "Jessie", availableFrom: "08:00", availableTo: "14:00" },
  { name: "Abhishek", availableFrom: "08:00", availableTo: "12:00" },
  { name: "Sofia", availableFrom: "08:00", availableTo: "12:00" },
  { name: "Katherine", availableFrom: "10:00", availableTo: "13:00" },
];
