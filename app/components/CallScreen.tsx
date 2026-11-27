"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mascot, type MascotMood } from "@/components/Brand";
import { ActivityArt } from "@/components/ActivityArt";
import { UiIcon } from "@/components/UiIcon";
import type { AudioMeter } from "@/lib/audio-meter";
import type { VoiceCallState } from "@/lib/voice-call";

// The call with WANEES (approved design, ten states). One full screen whose content follows the
// conversation: listening, planning, the proposed plan, one activity, two options side by side, the
// walking route on the venue map, the saved-plan confirmation, and a plan change to approve.
// Every view is drawn from the engine's reply for that turn; the screen invents nothing. The header
// and the control bar never move between states.

export type CallNeed = { icon: "family" | "friends" | "couple" | "show" | "game" | "food" | "explore" | "water" | "shopping" | "calm" | "horror" | "ride"; label: string };
export type CallCard = { id: string; name: string; kind?: string | null; image?: string | null; description?: string; facts: Array<{ icon: "price" | "age" | "time" | "place"; text: string }>; inPlan?: boolean; canAdd?: boolean };
export type CallStop = { id: string; actId: string; name: string; kind?: string | null; image?: string | null; time: string; state: "past" | "current" | "next" | "later"; change?: "added" | "moved" | "removed" | null };
export type CallStageView =
  | { kind: "base" }
  | { kind: "planning"; needs: CallNeed[] }
  | { kind: "cards"; cards: CallCard[]; focus: number }
  | { kind: "compare"; cards: [CallCard, CallCard]; focus: number }
  | { kind: "plan"; stops: CallStop[]; focus: number; confirmed: boolean; busy: boolean }
  | { kind: "saved" }
  | { kind: "nav"; targetName: string; walkMin: number | null; remainingM: number | null; instruction: string | null; turnIcon: string | null; arrived: boolean; busy: boolean; canSimulate: boolean }
  | { kind: "edit"; stops: CallStop[]; busy: boolean };

type IconName = "mic" | "micOff" | "end" | "chat" | "walk" | "check" | "plus" | "phone" | "plan" | "down" | "price" | "age" | "time" | "place" | "grip" | CallNeed["icon"];
function CallIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    mic: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></>,
    micOff: <><path d="M15 9.3V5a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 5 2.2M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.4 2.3M12 18v4M8 22h8M3 3l18 18"/></>,
    end: <path d="M3.5 14.5c5-4.7 12-4.7 17 0l-1.8 2.3-3.7-1.3v-2.7a9 9 0 0 0-6 0v2.7l-3.7 1.3-1.8-2.3Z"/>,
    chat: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></>,
    walk: <><circle cx="13" cy="4" r="2"/><path d="m7 21 3-6 2-3 3 2 2 4m-6-6-3-1-3 4m6-4 2-5 4 2"/></>,
    check: <path d="m5 12.5 4.5 4.5L19 7"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>,
    plan: <><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4m8-4v4M3.5 10h17"/></>,
    down: <path d="m6 9 6 6 6-6"/>,
    price: <><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.8c0 2.4-5 1.4-5 3.800 0 1.100 1 1.800 2.500 1.800s2.500-.7 2.500-1.700"/></>,
    age: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1a7 7 0 0 1 14 0v1"/></>,
    time: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    place: <><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></>,
    grip: <><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></>,
    family: <><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="13.5" r="2"/><path d="M3 20v-3a4 4 0 0 1 4-4m14 7v-3a4 4 0 0 0-4-4M9 20v-1a3 3 0 0 1 6 0v1"/></>,
    friends: <><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20v-1a5.5 5.5 0 0 1 9-4.2M21.5 20v-1a5.5 5.5 0 0 0-9-4.2"/></>,
    couple: <><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 10 0v1M14 14.2A5 5 0 0 1 21 19v1"/></>,
    show: <><path d="M4 4h16v9a8 8 0 0 1-16 0V4Z"/><path d="M8.5 9.5h.01M15.5 9.5h.01M8.5 14c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/></>,
    game: <><rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 12.5h4M9 10.5v4m6-2h.01M18 11h.01"/></>,
    food: <><path d="M5 3v6a2 2 0 0 0 4 0V3M7 11v10M7 3v4"/><path d="M17 21V3c-1.9.6-3 3-3 6.5V13h3"/></>,
    explore: <><path d="m3 20 6-11 4 6 3-4 5 9H3Z"/><circle cx="17" cy="6" r="2"/></>,
    water: <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>,
    shopping: <><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></>,
    calm: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/></>,
    horror: <><path d="M5 21V10a7 7 0 0 1 14 0v11l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2L5 21Z"/><path d="M9.5 10.5h.01M14.5 10.5h.01"/></>,
    ride: <><circle cx="12" cy="11" r="7.5"/><circle cx="12" cy="11" r="1.4"/><path d="M12 3.5v15M4.5 11h15M8 21l4-9.5L16 21"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const BARS = 31;

/**
 * The waveform. In a live call it reads the real audio (WANEES's voice while it speaks, the visitor's
 * microphone otherwise). Without an analyser (the browser-speech fallback) it follows the call state
 * with a gentle generated motion. It also publishes the loudness as --lvl on `levelTarget`, which
 * the mascot and its glow follow.
 */
function VoiceWave({ state, muted, meters, levelTarget }: {
  state: VoiceCallState;
  muted: boolean;
  meters: (() => { mic: AudioMeter | null; voice: AudioMeter | null }) | null;
  levelTarget: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const metersRef = useRef(meters);
  metersRef.current = meters;
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const bars = Array.from(host.children) as HTMLElement[];
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let tick = 0;
    const draw = () => {
      tick += 1;
      const now = stateRef.current;
      const live = metersRef.current?.();
      const meter = now === "speaking" ? live?.voice : now === "listening" && !mutedRef.current ? live?.mic : null;
      // The wave's outline: tallest in the middle, uneven like a voice. Levels fill it; they never replace it.
      const outline = (index: number) => {
        const centre = 1 - Math.abs(index - (BARS - 1) / 2) / (BARS / 2);
        return (0.08 + 0.92 * Math.pow(centre, 1.6)) * (0.55 + 0.45 * Math.abs(Math.sin(index * 1.9)));
      };
      const measured = meter ? meter.bars(BARS) : null;
      const energy = now === "speaking" ? 0.9 : now === "listening" && !mutedRef.current ? 0.6 : now === "thinking" ? 0.26 : 0.1;
      let sum = 0;
      for (let index = 0; index < bars.length; index += 1) {
        const wobble = still ? 0.6 : 0.5 + 0.5 * Math.sin(tick / (now === "thinking" ? 16 : 6) + index * 0.9) * Math.sin(tick / 23 + index * 0.37);
        let value: number;
        if (measured) {
          // Mirrored around the centre so the wave reads as one shape; a quiet room keeps a low outline under the real level.
          const level = measured[Math.abs(index - Math.floor(BARS / 2))] ?? 0;
          value = Math.min(1, level + 0.5 * outline(index) * (still ? 1 : 0.8 + 0.2 * Math.sin(tick / 14 + index * 0.8)));
          sum += level;
        } else {
          value = energy * outline(index) * (0.45 + 0.55 * wobble);
          sum += value;
        }
        bars[index].style.transform = `scaleY(${(0.08 + value * 0.92).toFixed(3)})`;
      }
      levelTarget.current?.style.setProperty("--lvl", (sum / bars.length).toFixed(3));
      if (!still || meter) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [levelTarget]);
  return <div className="vc-wave" ref={ref} aria-hidden="true">{Array.from({ length: BARS }, (_, index) => <i key={index} />)}</div>;
}

function CallTimer({ startedAt }: { startedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);
  const seconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  return <span className="vc-timer" dir="ltr">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span>;
}

/** The plan as a visual schedule. The stop WANEES is talking about stands out and scrolls into view. */
function StopList({ stops, focus, editing = false, onStop }: { stops: CallStop[]; focus: number; editing?: boolean; onStop?: (stop: CallStop) => void }) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const row = list.current?.children[focus] as HTMLElement | undefined;
    row?.scrollIntoView({ block: editing ? "center" : "nearest", behavior: "smooth" });
  }, [focus, editing]);
  return (
    <ol className="vc-stops" ref={list} aria-label="محطات الخطة">
      {stops.map((stop, index) => (
        <li key={stop.id} className={`${index === focus ? "is-focus " : ""}${stop.change ? `is-${stop.change} ` : ""}is-${stop.state}`} style={{ "--i": index } as React.CSSProperties}>
          <button type="button" onClick={() => onStop?.(stop)} disabled={!onStop} aria-label={onStop ? `دلّني على ${stop.name}` : undefined}>
            <ActivityArt kind={stop.kind} image={stop.image} label={stop.name} />
            <span className="vc-stop-text"><b>{stop.name}</b><small dir="ltr">{stop.time}</small></span>
            {stop.change && <em>{stop.change === "added" ? "جديدة" : stop.change === "removed" ? "تُشال" : "تغيّر وقتها"}</em>}
            <span className="vc-stop-end" aria-hidden="true">{editing ? <CallIcon name="grip" size={18} /> : <ActivityArt kind={stop.kind} className="vc-stop-kind" />}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Facts({ facts }: { facts: CallCard["facts"] }) {
  return <span className="vc-facts">{facts.map((fact) => <span key={fact.icon + fact.text}><CallIcon name={fact.icon} size={15} />{fact.text}</span>)}</span>;
}

export function CallScreen({ state, mode, working, muted, speakerMuted, said, heard, error, stage, startedAt, map, meters, outputs = [], outputId = "", onOutput, onStart, onEnd, onMute, onSpeaker, onChat, onMinimize, onCard, onStop, onSimulate, onConfirmPlan, onOpenPlan, onProposal }: {
  state: VoiceCallState;
  mode: "realtime" | "browser" | null;
  /** The engine is working on a request right now. */
  working: boolean;
  muted: boolean;
  speakerMuted: boolean;
  /** What WANEES is saying, shown as one short line where the design has a bubble. */
  said: string;
  heard: string;
  error: string;
  stage: CallStageView;
  startedAt: number | null;
  /** The live venue map, rendered by the page for the navigation view. */
  map: ReactNode;
  meters: (() => { mic: AudioMeter | null; voice: AudioMeter | null }) | null;
  outputs?: Array<{ id: string; label: string }>;
  outputId?: string;
  onOutput?: (deviceId: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onMute: (() => void) | null;
  onSpeaker: () => void;
  onChat: () => void;
  /** Keep the call running and go back to the app. */
  onMinimize: () => void;
  onCard: (card: CallCard) => void;
  onStop: ((stop: CallStop) => void) | null;
  onSimulate: () => void;
  onConfirmPlan: () => void;
  onOpenPlan: () => void;
  onProposal: (decision: "accept" | "keep_current") => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [outputMenu, setOutputMenu] = useState(false);
  const [picked, setPicked] = useState(0);
  const cardsRef = useRef<HTMLDivElement>(null);
  const canPickOutput = outputs.length > 1 && Boolean(onOutput);
  const active = state === "listening" || state === "thinking" || state === "speaking";
  const mood: MascotMood = state === "error" ? "confused" : stage.kind === "planning" || working || state === "thinking" ? "wink" : state === "speaking" ? "wave" : "idle";
  const status = state === "error" ? error || "تعذر تشغيل الصوت. تأكد من إذن الميكروفون أو كمّل بالشات."
    : state === "paused" ? "توقفت المكالمة"
    : !active ? "جاهزة نبدأ"
    : stage.kind === "planning" ? "أجهّز لكم الخطة المناسبة…"
    : working ? "لحظة…"
    : state === "listening" ? (muted ? "الميكروفون مكتوم" : "أستمع لك…")
    : state === "thinking" ? "أفهم طلبك…"
    : "ونيس تتكلم";
  const bubble = said.replace(/[«»]/g, "").trim();
  // The card WANEES is talking about slides to the centre (reference «عرض فعالية أثناء الحديث»).
  const focus = stage.kind === "cards" || stage.kind === "compare" ? stage.focus : -1;
  useEffect(() => {
    if (focus < 0) return;
    setPicked(focus);
    const card = cardsRef.current?.children[focus] as HTMLElement | undefined;
    card?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [focus, stage.kind]);
  const hero = stage.kind === "base" || stage.kind === "planning";

  return (
    <div className="vc" ref={root} data-state={state} data-stage={stage.kind} data-working={working || undefined}>
      <header className="vc-top">
        <span className="vc-top-side" />
        <div className="vc-title">
          <strong>مكالمة مع ونيس</strong>
          <CallTimer startedAt={startedAt} />
        </div>
        <button type="button" className="vc-min" onClick={onMinimize} aria-label="صغّر المكالمة وارجع للتطبيق"><CallIcon name="down" size={20} /></button>
      </header>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>

      <div className="vc-stage">
        {stage.kind === "nav" && <div className="vc-map">{map}</div>}

        {hero && (
          <div className="vc-hero" data-mood={mood}>
            {stage.kind === "planning" && stage.needs.slice(0, 4).map((need, index) => (
              <span key={need.icon} className={`vc-need n${index}`} title={need.label} style={{ "--i": index } as React.CSSProperties}><CallIcon name={need.icon} size={26} /><span className="sr-only">{need.label}</span></span>
            ))}
            <div className="vc-mascot">
              <div className="vc-glow" aria-hidden="true"><i /><i /><i /></div>
              {(["idle", "wink", "wave", "confused"] as MascotMood[]).map((pose) => (
                <Mascot key={pose} mood={pose} height={320} className={pose === mood ? "is-on" : ""} priority={pose === "idle"} />
              ))}
            </div>
            <p className="vc-status" aria-hidden="true">{status}</p>
            {stage.kind === "base" && heard && active && <p className="vc-heard"><bdi>{heard}</bdi></p>}
            {stage.kind === "base" && active && <VoiceWave state={state} muted={muted} meters={meters} levelTarget={root} />}
          </div>
        )}

        {(stage.kind === "plan" || stage.kind === "edit" || stage.kind === "compare") && bubble && <p className="vc-bubble" aria-hidden="true"><span>{bubble}</span></p>}

        {stage.kind === "plan" && (
          <div className="vc-panel">
            <StopList stops={stage.stops} focus={stage.focus} onStop={onStop ?? undefined} />
            {stage.confirmed
              ? <button type="button" className="vc-primary ghost" onClick={onOpenPlan}><CallIcon name="plan" size={20} /> عرض جدولي</button>
              : <button type="button" className="vc-primary" disabled={stage.busy} onClick={onConfirmPlan}><CallIcon name="plan" size={20} /> أضيف الخطة إلى جدولي</button>}
          </div>
        )}

        {stage.kind === "edit" && (
          <div className="vc-panel">
            <StopList stops={stage.stops} focus={stage.stops.findIndex((stop) => stop.change)} editing />
            <button type="button" className="vc-primary" disabled={stage.busy} onClick={() => onProposal("accept")}><CallIcon name="check" size={20} /> اعتمد التعديل</button>
            <button type="button" className="vc-link" disabled={stage.busy} onClick={() => onProposal("keep_current")}>أبقي مساري كما هو</button>
          </div>
        )}

        {stage.kind === "cards" && (
          <div className="vc-cards" ref={cardsRef} role="list" aria-label="اقتراحات ونيس">
            {stage.cards.map((card, index) => (
              <button key={card.id} type="button" role="listitem" className={`vc-card${index === picked ? " is-focus" : ""}`} onClick={() => onCard(card)}
                aria-label={card.inPlan ? `${card.name}، في مسارك` : card.canAdd ? `أضف ${card.name} لمساري` : `${card.name} على الخريطة`}>
                <ActivityArt kind={card.kind} image={card.image} label={card.name} />
                <b>{card.name}</b>
                {card.description && <small className="vc-card-desc">{card.description}</small>}
                <Facts facts={card.facts} />
                <em className={card.inPlan ? "done" : ""}>{card.inPlan ? <><CallIcon name="check" size={15} /> في مسارك</> : card.canAdd ? <><CallIcon name="plus" size={15} /> أضف لمساري</> : <><CallIcon name="place" size={15} /> على الخريطة</>}</em>
              </button>
            ))}
          </div>
        )}

        {stage.kind === "compare" && (
          <div className="vc-panel">
            <div className="vc-compare" ref={cardsRef} role="radiogroup" aria-label="اختر واحدًا من الخيارين">
              {stage.cards.map((card, index) => (
                <button key={card.id} type="button" role="radio" aria-checked={index === picked} className={`vc-option${index === picked ? " is-focus" : ""}`} onClick={() => setPicked(index)}>
                  <ActivityArt kind={card.kind} image={card.image} label={card.name} />
                  <b>{card.name}</b>
                  <Facts facts={card.facts} />
                </button>
              ))}
            </div>
            {(() => {
              const card = stage.cards[picked] ?? stage.cards[0];
              return <button type="button" className="vc-primary" onClick={() => onCard(card)}><CallIcon name="check" size={20} /> {card.inPlan ? `${card.name} في مسارك` : card.canAdd ? `اختر ${card.name}` : `دلّني على ${card.name}`}</button>;
            })()}
          </div>
        )}

        {stage.kind === "saved" && (
          <div className="vc-saved" role="status">
            <div className="vc-check" aria-hidden="true"><i /><i /><i /><i /><i /><i /><span><CallIcon name="check" size={84} /></span></div>
            <h2>تمت إضافة خطتكم إلى مساري</h2>
            <p>تقدرون تعدلونها بأي وقت</p>
            <button type="button" className="vc-primary ghost" onClick={onOpenPlan}><CallIcon name="plan" size={20} /> عرض جدولي</button>
          </div>
        )}

        {stage.kind === "nav" && (
          <>
            <div className="vc-dest"><b>{stage.targetName}</b><small>{stage.busy ? "أحسب الطريق…" : stage.arrived ? "وصلت" : stage.walkMin != null ? `${stage.walkMin} د مشيًا` : ""}</small></div>
            <div className="vc-guide">
              <span className="vc-guide-icon" aria-hidden="true">{stage.arrived ? <CallIcon name="check" size={24} /> : stage.turnIcon ?? <CallIcon name="walk" size={24} />}</span>
              <div>
                <b>{stage.arrived ? `وصلت ${stage.targetName}` : stage.instruction ?? (stage.busy ? "أحسب لك الطريق" : `امشِ إلى ${stage.targetName}`)}</b>
                {!stage.arrived && stage.remainingM != null && <small>لمسافة {Math.max(5, Math.round(stage.remainingM / 5) * 5)} متر</small>}
              </div>
              {stage.canSimulate && <button type="button" className="vc-chip" onClick={onSimulate}>جرّب محاكاة المشي</button>}
            </div>
          </>
        )}
      </div>

      <div className="vc-foot">
        {!hero && active && stage.kind !== "saved" && stage.kind !== "nav" && <VoiceWave state={state} muted={muted} meters={meters} levelTarget={root} />}
        {active ? (
          <div className="vc-controls">
            <span className="vc-output">
              <button type="button" className="vc-btn" aria-pressed={speakerMuted} aria-haspopup={canPickOutput ? "menu" : undefined} aria-expanded={canPickOutput ? outputMenu : undefined}
                onClick={() => { if (canPickOutput) setOutputMenu((open) => !open); else onSpeaker(); }}
                aria-label={canPickOutput ? "مخرج الصوت" : speakerMuted ? "شغّل صوت ونيس" : "اكتم صوت ونيس"}><UiIcon name={speakerMuted ? "speakerOff" : "speaker"} /></button>
              {canPickOutput && outputMenu && (
                <div className="vc-output-menu" role="menu" aria-label="مخرج الصوت">
                  {outputs.map((device) => (
                    <button key={device.id} type="button" role="menuitemradio" aria-checked={device.id === outputId} onClick={() => { onOutput?.(device.id); setOutputMenu(false); }}><bdi>{device.label}</bdi></button>
                  ))}
                  <button type="button" role="menuitemcheckbox" aria-checked={speakerMuted} onClick={() => { onSpeaker(); setOutputMenu(false); }}>{speakerMuted ? "شغّل صوت ونيس" : "اكتم صوت ونيس"}</button>
                </div>
              )}
            </span>
            <button type="button" className="vc-btn" aria-pressed={muted} disabled={!onMute} onClick={() => onMute?.()} aria-label={muted ? "إلغاء كتم الميكروفون" : "كتم الميكروفون"}
              title={onMute ? undefined : "الكتم متاح في المكالمة الحية"}><CallIcon name={muted ? "micOff" : "mic"} /></button>
            <button type="button" className="vc-btn end" onClick={onEnd} aria-label="إنهاء المكالمة"><CallIcon name="end" size={28} /></button>
            <button type="button" className="vc-btn" onClick={onChat} aria-label="كمّل بالشات مع ونيس"><CallIcon name="chat" /></button>
          </div>
        ) : (
          <div className="vc-controls idle">
            <button type="button" className="vc-primary" onClick={onStart}><CallIcon name="phone" size={20} /> {state === "paused" || state === "error" ? "استئناف المكالمة" : "ابدأ المكالمة"}</button>
            <button type="button" className="vc-link" onClick={onChat}>كمّل بالكتابة</button>
            <button type="button" className="vc-link" onClick={onEnd}>إغلاق</button>
          </div>
        )}
        {/* Said before the call starts, where the visitor decides to speak; the live screen stays clear. */}
        {!active && <small className="vc-note">في المكالمة الحية يمر صوتك لمزوّد الذكاء الاصطناعي ولا نحفظه. أي تعديل على مسارك يحتاج موافقتك.</small>}
      </div>
    </div>
  );
}
