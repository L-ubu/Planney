"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Person } from "@/lib/types";
import { COLORS } from "@/lib/constants";

interface UserContextType {
  currentUser: Person;
  setCurrentUser: (person: Person) => void;
  colors: (typeof COLORS)["Luca"] | (typeof COLORS)["Vale"];
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Person>("Luca");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser") as Person | null;
    if (saved === "Luca" || saved === "Vale") {
      setCurrentUser(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("currentUser", currentUser);
    }
  }, [currentUser, mounted]);

  const colors = COLORS[currentUser];

  if (!mounted) {
    return null;
  }

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, colors }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
