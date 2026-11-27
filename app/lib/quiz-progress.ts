import { createElement, type ReactNode } from "react";
import { clockRange12 } from "./clock-format.ts";

export function QuizProgress({ current, total }: { current: number; total: number }) {
  return createElement(
    "span",
    { dir: "ltr", role: "status", "aria-label": `السؤال ${current} من ${total}`, style: { unicodeBidi: "isolate" } },
    `${current} / ${total}`,
  );
}

export function QuizInterestButton({ selected, children, onClick, className }: { selected: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return createElement("button", { type: "button", className, "aria-pressed": selected, onClick }, children);
}

/** A stop's time span, read right to left like the sentence around it: «7:00 – 7:20 م». */
export function ItineraryTimeRange({ start, end }: { start: number; end: number }) {
  return createElement("span", { dir: "rtl", style: { unicodeBidi: "isolate", whiteSpace: "nowrap" } }, clockRange12(start, end));
}
