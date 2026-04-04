"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/components/user-provider";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  type: "dot" | "four-point" | "sparkle";
  color: string;
  animationDuration: number;
  animationDelay: number;
  opacity: number;
}

const VALE_STAR_COLORS = [
  "#F5C518",      // yellow accent (primary star color)
  "#F5C518",      // yellow (weighted heavier)
  "#F5C518CC",    // yellow semi-transparent
  "#E63B2E33",    // soft red
  "#2D6FD133",    // soft blue
  "#F5C51866",    // faint yellow
];

function generateStars(): Star[] {
  const stars: Star[] = [];
  const count = 25;

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let type: Star["type"];
    let size: number;

    if (rand < 0.5) {
      type = "dot";
      size = 2 + Math.random() * 3;
    } else if (rand < 0.85) {
      type = "four-point";
      size = 6 + Math.random() * 6;
    } else {
      type = "sparkle";
      size = 10 + Math.random() * 8;
    }

    stars.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size,
      type,
      color: VALE_STAR_COLORS[Math.floor(Math.random() * VALE_STAR_COLORS.length)],
      animationDuration: 2 + Math.random() * 4,
      animationDelay: Math.random() * 5,
      opacity: 0.3 + Math.random() * 0.5,
    });
  }

  return stars;
}

function StarShape({ star }: { star: Star }) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${star.x}%`,
    top: `${star.y}%`,
    animationDelay: `${star.animationDelay}s`,
    opacity: star.opacity,
  };

  if (star.type === "dot") {
    return (
      <div
        style={{
          ...baseStyle,
          width: star.size,
          height: star.size,
          borderRadius: "50%",
          backgroundColor: star.color,
          animation: `twinkle ${star.animationDuration}s ease-in-out infinite`,
          animationDelay: `${star.animationDelay}s`,
        }}
      />
    );
  }

  if (star.type === "four-point") {
    return (
      <svg
        width={star.size}
        height={star.size}
        viewBox="0 0 24 24"
        fill={star.color}
        style={{
          ...baseStyle,
          animation: `twinkle ${star.animationDuration}s ease-in-out infinite`,
          animationDelay: `${star.animationDelay}s`,
        }}
      >
        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
      </svg>
    );
  }

  // sparkle - larger, with rotation
  return (
    <svg
      width={star.size}
      height={star.size}
      viewBox="0 0 24 24"
      fill={star.color}
      style={{
        ...baseStyle,
        animation: `sparkle-pulse ${star.animationDuration}s ease-in-out infinite, star-rotate ${star.animationDuration * 4}s linear infinite`,
        animationDelay: `${star.animationDelay}s`,
      }}
    >
      <path d="M12 0L13.5 9L20 4L15 10.5L24 12L15 13.5L20 20L13.5 15L12 24L10.5 15L4 20L9 13.5L0 12L9 10.5L4 4L10.5 9Z" />
    </svg>
  );
}

export function StarBackground() {
  const { currentUser } = useUser();
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    if (currentUser === "Vale") {
      setStars(generateStars());
    }
  }, [currentUser]);

  if (currentUser !== "Vale") return null;
  if (stars.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {stars.map((star) => (
        <StarShape key={star.id} star={star} />
      ))}
    </div>
  );
}
