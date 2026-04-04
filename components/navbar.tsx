"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Wallet, Heart, ChevronDown } from "lucide-react";
import { useUser } from "@/components/user-provider";
import { PEOPLE } from "@/lib/constants";
import { COLORS } from "@/lib/constants";
import { Person } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/finances", label: "Finances", icon: Wallet },
] as const;

function UserPicker() {
  const { currentUser, setCurrentUser, colors } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
        style={{ backgroundColor: colors.primary }}
      >
        <span className="size-2 rounded-full bg-white/40" />
        {currentUser}
        <ChevronDown className="size-3.5 opacity-70" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-50">
          {PEOPLE.map((person: Person) => {
            const personColors = COLORS[person];
            const isActive = person === currentUser;
            return (
              <button
                key={person}
                onClick={() => {
                  setCurrentUser(person);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50"
                style={{
                  color: isActive ? personColors.primary : COLORS.shared.text,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: personColors.primary }}
                />
                {person}
                {isActive && (
                  <span className="ml-auto text-xs opacity-50">active</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { colors } = useUser();
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top navbar */}
      <nav className="hidden md:block sticky top-0 z-40">
        <div
          className="border-b backdrop-blur-md"
          style={{
            backgroundColor: "rgba(250, 247, 245, 0.85)",
            borderColor: COLORS.shared.border,
          }}
        >
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            {/* Logo / App name */}
            <Link href="/" className="flex items-center gap-1.5 group">
              <span
                className="text-lg font-bold tracking-tight"
                style={{ color: colors.primary }}
              >
                Luca
              </span>
              <Heart
                className="size-4 transition-transform group-hover:scale-110"
                style={{ color: colors.accent, fill: colors.accent }}
              />
              <span
                className="text-lg font-bold tracking-tight"
                style={{ color: colors.primary }}
              >
                Vale
              </span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-black/5"
                    style={{
                      color: isActive
                        ? colors.primary
                        : COLORS.shared.textMuted,
                      backgroundColor: isActive
                        ? colors.lightPrimary
                        : undefined,
                    }}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User picker */}
            <UserPicker />
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md"
        style={{
          backgroundColor: "rgba(250, 247, 245, 0.92)",
          borderColor: COLORS.shared.border,
        }}
      >
        <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-4 py-2.5 transition-all"
                style={{
                  color: isActive ? colors.primary : COLORS.shared.textMuted,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl px-4 py-1 transition-all"
                  style={{
                    backgroundColor: isActive
                      ? colors.lightPrimary
                      : "transparent",
                  }}
                >
                  <item.icon
                    className="size-5"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Mobile user switcher (compact) */}
          <UserPicker />
        </div>
      </nav>
    </>
  );
}
