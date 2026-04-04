import { Person } from "./types";

export const PEOPLE: Person[] = ["Luca", "Vale"];

export const COLORS = {
  Luca: {
    primary: "#184671",
    secondary: "#FFA041",
    accent: "#E4432F",
    muted: "#C3ACA5",
    lightPrimary: "#E8EEF4",
    lightSecondary: "#FFF0DC",
  },
  Vale: {
    primary: "#E63B2E",
    secondary: "#2D6FD1",
    accent: "#F5C518",
    muted: "#F5C518",
    lightPrimary: "#FEE2E2",
    lightSecondary: "#DBEAFE",
  },
  shared: {
    background: "#FAF7F5",
    surface: "#FFFFFF",
    text: "#2D2A26",
    textMuted: "#8A8580",
    border: "#E8E4E0",
  },
} as const;

export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Rent",
  "Utilities",
  "Transport",
  "Dining Out",
  "Entertainment",
  "Shopping",
  "Health",
  "Subscriptions",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Side Project",
  "Gift",
  "Refund",
  "Other",
] as const;
