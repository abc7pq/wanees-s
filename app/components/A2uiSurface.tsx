"use client";
// عارض A2UI v1.0 صغير لمجموعة جزئية من الكتالوج الأساسي (Column, Row, Card, Text, Button, Divider).
// لا يرسم إلا المكوّنات المعروفة، والنص يُعرض كنص عادي (لا HTML ولا Markdown)، وعمق الشجرة محدود.
import { useMemo, type ReactNode } from "react";
import { A2UI_COMPONENTS, buttonAction, processA2uiMessages, resolveDynamic as resolve, type A2uiActionMessage, type A2uiMessage } from "@/lib/a2ui";

const MAX_DEPTH = 12;
const KNOWN = new Set<string>(A2UI_COMPONENTS);

export type A2uiActionHandler = (action: A2uiActionMessage, opener: HTMLButtonElement) => void;

/**
 * `art` is presentation only: the app may draw a picture beside an activity or place card (the
 * card's record id comes from the surface's own data model). The A2UI payload itself is unchanged,
 * so other renderers (the native apps later) are not affected.
 */
export function A2uiSurface({ messages, onAction, disabled = false, art }: { messages: readonly A2uiMessage[]; onAction: A2uiActionHandler; disabled?: boolean; art?: (itemId: string, kind: "activity" | "place") => ReactNode }) {
  const surface = useMemo(() => processA2uiMessages(messages), [messages]);
  if (!surface || !surface.components.has("root")) return null;

  const render = (id: string, depth: number, seen: Set<string>): ReactNode => {
    const component = surface.components.get(id);
    if (!component || depth > MAX_DEPTH || seen.has(id) || !KNOWN.has(component.component)) return null;
    const path = new Set(seen).add(id);
    const kids = (component.children ?? []).map((childId) => render(childId, depth + 1, path));
    switch (component.component) {
      case "Column":
        return <div key={id} className="a2ui-column">{kids}</div>;
      case "Row":
        return <div key={id} className={`a2ui-row is-${component.justify ?? "start"}`}>{kids}</div>;
      case "Card": {
        const item = art ? /^(act|loc)(\d+)$/.exec(id) : null;
        const record = item ? (surface.data.items as Array<{ id?: unknown }> | undefined)?.[Number(item[2])] : null;
        const picture = item && typeof record?.id === "string" ? art?.(record.id, item[1] === "act" ? "activity" : "place") : null;
        return <div key={id} className={`a2ui-card${picture ? " has-art" : ""}`}>{picture}{component.child ? render(component.child, depth + 1, path) : null}</div>;
      }
      case "Divider":
        return <hr key={id} className="a2ui-divider" />;
      case "Text":
        return <span key={id} className={`a2ui-text is-${component.variant === "caption" ? "caption" : "body"}`}>{String(resolve(component.text, surface.data))}</span>;
      case "Button": {
        if (!component.action?.event) return null;
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            className={`a2ui-button is-${component.variant ?? "default"}`}
            onClick={(clickEvent) => {
              const message = buttonAction(surface, id);
              if (message) onAction(message, clickEvent.currentTarget);
            }}
          >
            {component.child ? render(component.child, depth + 1, path) : null}
          </button>
        );
      }
      default:
        return null;
    }
  };

  return <div className="a2ui-surface" data-surface-id={surface.surfaceId}>{render("root", 0, new Set())}</div>;
}
