"use client";

import { ReactNode } from "react";
import { useUser } from "@/components/user-provider";

interface SparkleTextProps {
  children: ReactNode;
  position?: "before" | "after" | "both";
  className?: string;
}

export function SparkleText({
  children,
  position = "after",
  className,
}: SparkleTextProps) {
  const { currentUser } = useUser();

  if (currentUser !== "Vale") {
    return <>{children}</>;
  }

  const star = (
    <span
      className={className}
      style={{
        color: "#F5C518",
        animation: "sparkle-pulse 2s ease-in-out infinite",
        display: "inline-block",
        fontSize: "0.8em",
      }}
    >
      &#10022;
    </span>
  );

  return (
    <>
      {(position === "before" || position === "both") && (
        <>{star}{" "}</>
      )}
      {children}
      {(position === "after" || position === "both") && (
        <>{" "}{star}</>
      )}
    </>
  );
}
