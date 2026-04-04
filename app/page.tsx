"use client";

import Link from "next/link";
import { Calendar, Wallet, ArrowRight, Sparkles, Star } from "lucide-react";
import { useUser } from "@/components/user-provider";
import { SparkleText } from "@/components/sparkle-text";
import { COLORS } from "@/lib/constants";

function DecorativeDots({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute -top-6 -right-6 flex gap-2 opacity-30">
      <div
        className="size-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div
        className="size-2 rounded-full mt-1"
        style={{ backgroundColor: color }}
      />
      <div
        className="size-1.5 rounded-full mt-3"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function DecorativeStars() {
  return (
    <div className="pointer-events-none absolute -top-4 -right-4 flex gap-2">
      <Star
        className="size-4"
        fill="#F5C518"
        stroke="none"
        style={{ animation: "twinkle 3s ease-in-out infinite", opacity: 0.6 }}
      />
      <Star
        className="size-2.5 mt-2"
        fill="#F5C518"
        stroke="none"
        style={{ animation: "twinkle 2.5s ease-in-out infinite 0.5s", opacity: 0.4 }}
      />
      <Star
        className="size-3 mt-4"
        fill="#F5C51888"
        stroke="none"
        style={{ animation: "twinkle 3.5s ease-in-out infinite 1s", opacity: 0.5 }}
      />
    </div>
  );
}

export default function Home() {
  const { currentUser, colors } = useUser();

  const isVale = currentUser === "Vale";
  const greeting =
    currentUser === "Luca" ? "Hey Luca!" : "Hey Vale!";

  const cards = [
    {
      href: "/calendar",
      icon: Calendar,
      title: "Calendar",
      description: "View your work schedules, plan shifts, and stay in sync together.",
      gradient: `linear-gradient(135deg, ${colors.lightPrimary}, ${colors.lightSecondary})`,
      iconBg: colors.primary,
      dotColor: colors.secondary,
    },
    {
      href: "/finances",
      icon: Wallet,
      title: "Finances",
      description: "Track expenses, income, and see where your money goes each month.",
      gradient: `linear-gradient(135deg, ${colors.lightSecondary}, ${colors.lightPrimary})`,
      iconBg: colors.secondary,
      dotColor: colors.primary,
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] flex flex-col"
      style={{ backgroundColor: COLORS.shared.background }}
    >
      {/* Decorative top wave */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${colors.primary}, transparent)`,
          }}
        />
        <div className="relative mx-auto max-w-2xl px-5 pt-12 pb-6 md:pt-16 md:pb-10">
          {/* Sparkle accent */}
          <div className="mb-3 flex items-center gap-2">
            <Sparkles
              className="size-5"
              style={{ color: isVale ? "#F5C518" : colors.secondary }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: colors.secondary }}
            >
              {isVale ? "Welcome back, starshine" : "Welcome back"}
            </span>
            {isVale && (
              <Star
                className="size-3.5"
                fill="#F5C518"
                stroke="none"
                style={{ animation: "sparkle-pulse 2s ease-in-out infinite" }}
              />
            )}
          </div>

          {/* Greeting */}
          <h1
            className="text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: colors.primary }}
          >
            <SparkleText position="both">
              {greeting}
            </SparkleText>
          </h1>
          <p
            className="mt-2 text-base md:text-lg"
            style={{ color: COLORS.shared.textMuted }}
          >
            {isVale ? "What magical things shall we do today?" : "What would you like to do today?"}
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="mx-auto w-full max-w-2xl px-5 pb-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: card.gradient,
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              {isVale ? <DecorativeStars /> : <DecorativeDots color={card.dotColor} />}

              {/* Icon circle */}
              <div
                className="mb-4 flex size-12 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundColor: card.iconBg }}
              >
                <card.icon className="size-6" />
              </div>

              {/* Content */}
              <h2
                className="text-lg font-semibold"
                style={{ color: COLORS.shared.text }}
              >
                {card.title}
              </h2>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: COLORS.shared.textMuted }}
              >
                {card.description}
              </p>

              {/* Arrow */}
              <div
                className="mt-4 flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2"
                style={{ color: card.iconBg }}
              >
                Open
                <ArrowRight className="size-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Subtle bottom decoration */}
        <div className="mt-10 flex items-center justify-center gap-2">
          {isVale ? (
            <>
              <Star className="size-2.5" fill="#F5C51866" stroke="none" style={{ animation: "twinkle 3s ease-in-out infinite" }} />
              <Star className="size-3.5" fill="#F5C518AA" stroke="none" style={{ animation: "twinkle 2.5s ease-in-out infinite 0.3s" }} />
              <Star className="size-2.5" fill="#F5C51866" stroke="none" style={{ animation: "twinkle 3s ease-in-out infinite 0.6s" }} />
            </>
          ) : (
            <>
              <div
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: colors.primary, opacity: 0.2 }}
              />
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: colors.secondary, opacity: 0.3 }}
              />
              <div
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: colors.accent, opacity: 0.2 }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
