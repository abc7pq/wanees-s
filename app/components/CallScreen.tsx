"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mascot, type MascotMood } from "@/components/Brand";
import { ActivityArt } from "@/components/ActivityArt";
import { UiIcon } from "@/components/UiIcon";
import type { AudioMeter } from "@/lib/audio-meter";
import type { VoiceCallState } from "@/lib/voice-call";

// The call with WANEES as one full screen (redesign §3–§5). The voice carries the words; the screen
// follows the conversation with pictures: a place being described, two places side by side, the
// stops of a plan in order, the walking route on the real venue map, or a saved-plan confirmation.
// Every view is drawn from the engine's own reply for that turn; nothing here invents data.

export type CallCard = { id: string; name: string; kind?: string | null; image?: string | null; meta: string[]; inPlan?: boolean; canAdd?: boolean };
export type CallPlanStop = { id: string; name: string; kind?: string | null; time: string; walkMin: number; state: "past" | "current" | "next" | "later" };
export type CallStageView =
  | { kind: "base" }
  | { kind: "cards"; cards: CallCard[] }
  | { kind: "plan"; stops: CallPlanStop[]; saved: boolean; totalLabel: string }
  | { kind: "nav"; targetName: string; walkMin: number | null; remainingM: number | null; turnIcon: string | null; arrived: boolean; busy: boolean; canSimulate: boolean; stops: CallPlanStop[] }
  | { kind: "proposal"; reason: string; changes: string[]; busy: boolean };

type Step = "listen" | "understand" | "plan" | "done";
const STEPS: Array<{ id: Step; label: string; icon: "mic" | "spark" | "plan" | "check" }> = [
  { id: "listen", label: "أسمع", icon: "mic" },
  { id: "understand", label: "أفهم", icon: "spark" },
  { id: "plan", label: "أخطّط", icon: "plan" },
  { id: "done", label: "أضيف", icon: "check" },
];

function CallIcon({ name, size = 22 }: { name: "mic" | "micOff" | "end" | "chat" | "walk" | "check" | "plus" | "phone" | "spark" | "plan"; size?: number }) {
  const paths: Record<string, ReactNode> = {
    spark: <><path d="M12 3l1.700 4.800L18.500 9.500l-4.800 1.700L12 16l-1.700-4.800L5.500 9.500l4.800-1.700L12 3Z"/><path d="m18.500 14.500.8 2.200 2.200.8-2.200.8-.8 2.200-.8-2.200-2.200-.8 2.200-.8.8-2.200Z"/></>,
    plan: <><rect x="3.500" y="5" width="17" height="15.500" rx="3"/><path d="M8 3v4m8-4v4M3.500 10h17m-12 4.500 2 2 4-4"/></>,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></>,
    micOff: <><path d="M15 9.3V5a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 5 2.2M5 11a7 7 0 0 0 11.500 5.400M19 11a7 7 0 0 1-.4 2.300M12 18v4M8 22h8M3 3l18 18"/></>,
    end: <path d="M3.500 14.500c5-4.700 12-4.700 17 0l-1.800 2.300-3.700-1.300v-2.700a9 9 0 0 0-6 0v2.700l-3.700 1.300-1.800-2.300Z"/>,
    chat: <path d="M21 12a8 8 0 0 1-11.600 7.100L4 20l1-4.600A8 8 0 1 1 21 12Z"/>,
    walk: <><circle cx="13" cy="4" r="2"/><path d="m7 21 3-6 2-3 3 2 2 4m-6-6-3-1-3 4m6-4 2-5 4 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    phone: <path d="M22 16.900v3a2 2 0 0 1-2.200 2 19.800 19.800 0 0 1-8.600-3.100 19.500 19.500 0 0 1-6-6A19.800 19.800 0 0 1 2.100 4.200 2 2 0 0 1 4.100 2h3a2 2 0 0 1 2 1.700c.1 1 .4 1.900.7 2.800a2 2 0 0 1-.5 2.100L8 9.900a16 16 0 0 0 6 6l1.300-1.300a2 2 0 0 1 2.100-.4c.9.3 1.800.6 2.800.7a2 2 0 0 1 1.700 2Z"/>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const BARS = 27;

/**
 * The waveform. During a live call it reads the real audio (WANEES's voice while it speaks, the
 * visitor's microphone otherwise). Without an analyser (the browser-speech fallback) it follows the
 * call state with a gentle generated motion. It also publishes the loudness as --lvl on `levelTarget`.
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
      let values: number[];
      if (meter) values = meter.bars(BARS);
      else {
        const energy = now === "speaking" ? 0.62 : now === "listening" && !mutedRef.current ? 0.2 : now === "thinking" ? 0.12 : 0.04;
        values = bars.map((_, index) => {
          const centre = 1 - Math.abs(index - (BARS - 1) / 2) / (BARS / 2);
          const wobble = still ? 0.5 : 0.5 + 0.5 * Math.sin(tick / (now === "thinking" ? 16 : 6) + index * 0.9) * Math.sin(tick / 23 + index * 0.37);
          return energy * (0.35 + 0.65 * centre) * (0.45 + 0.55 * wobble);
        });
      }
      let sum = 0;
      for (let index = 0; index < bars.length; index += 1) {
        // Mirror around the centre so the wave reads as one shape, loudest in the middle.
        const mirrored = values[Math.abs(index - Math.floor(BARS / 2))] ?? 0;
        const value = meter ? mirrored : values[index];
        sum += value;
        bars[index].style.transform = `scaleY(${(0.08 + value * 0.92).toFixed(3)})`;
      }
      levelTarget.current?.style.setProperty("--lvl", (sum / bars.length).toFixed(3));
      if (!still || meter) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [levelTarget]);
  return <div className="call-wave" ref={ref} aria-hidden="true">{Array.from({ length: BARS }, (_, index) => <i key={index} />)}</div>;
}

function StopRail({ stops }: { stops: CallPlanStop[] }) {
  return (
    <ol className="call-rail" aria-label="محطات مسارك">
      {stops.map((stop, index) => (
        <li key={stop.id} className={`is-${stop.state}`} style={{ "--i": index } as React.CSSProperties}>
          <ActivityArt kind={stop.kind} />
          <b>{stop.name}</b>
          <small dir="ltr">{stop.time}</small>
        </li>
      ))}
    </ol>
  );
}

export function CallScreen({ state, mode, working, muted, speakerMuted, heard, error, stage, savedPulse, eventName, map, meters, outputs = [], outputId = "", onOutput, onStart, onEnd, onMute, onSpeaker, onChat, onGuide, onCard, onSimulate, onProposal }: {
  /** Audio outputs the browser lets the page choose between (empty where it does not). */
  outputs?: Array<{ id: string; label: string }>;
  outputId?: string;
  onOutput?: (deviceId: string) => void;
  state: VoiceCallState;
  mode: "realtime" | "browser" | null;
  /** The engine is working on a request right now (planning / carrying it out). */
  working: boolean;
  muted: boolean;
  speakerMuted: boolean;
  heard: string;
  error: string;
  stage: CallStageView;
  /** Changes each time a plan is really saved, to replay the confirmation. */
  savedPulse: number;
  eventName: string;
  /** The live venue map, rendered by the page for the plan and navigation views. */
  map: ReactNode;
  meters: (() => { mic: AudioMeter | null; voice: AudioMeter | null }) | null;
  onStart: () => void;
  onEnd: () => void;
  onMute: (() => void) | null;
  onSpeaker: () => void;
  onChat: () => void;
  onGuide: (() => void) | null;
  onCard: (card: CallCard) => void;
  onSimulate: () => void;
  onProposal: (decision: "accept" | "keep_current") => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [outputMenu, setOutputMenu] = useState(false);
  const canPickOutput = outputs.length > 1 && Boolean(onOutput);
  const active = state === "listening" || state === "thinking" || state === "speaking";
  const saved = stage.kind === "plan" && stage.saved;
  const step: Step | null = !active ? null : working ? "plan" : state === "listening" ? "listen" : state === "thinking" ? "understand" : saved ? "done" : null;
  const mood: MascotMood = state === "error" ? "confused" : saved ? "cheer" : working || state === "thinking" ? "wink" : state === "speaking" ? "wave" : "idle";
  const status = state === "error" ? error || "تعذر تشغيل الصوت. تأكد من إذن الميكروفون أو كمّل بالشات."
    : state === "paused" ? "توقفت المكالمة"
    : !active ? "جاهز نبدأ"
    : working ? "أرتّب لك…"
    : state === "listening" ? (muted ? "الميكروفون مكتوم" : "أسمعك")
    : state === "thinking" ? "لحظة…"
    : "ونيس يتكلم";
  const visual = stage.kind === "plan" || stage.kind === "nav";

  return (
    <div className="call" ref={root} data-state={state} data-stage={stage.kind} data-working={working || undefined}>
      <header className="call-top">
        <button type="button" className="call-pill" onClick={onChat} aria-label="كمّل بالشات مع ونيس"><CallIcon name="chat" size={18} /> شات</button>
        <div className="call-title">
          <strong>{stage.kind === "nav" ? "مكالمة حالية" : "ونيس"}</strong>
          <span role="status" aria-live="polite"><i className={active ? "on" : ""} />{status}</span>
        </div>
        <span className="call-event">{stage.kind === "nav"
          ? <img className="call-avatar" src="/brand/mascot-head.webp" alt="" width={40} height={40} />
          : eventName}</span>
      </header>

      <div className="call-stage">
        {visual && <div className="call-map">{map}</div>}

        {stage.kind === "base" && (
          <div className="call-hero" data-mood={mood}>
            <div className="call-ring" aria-hidden="true"><i /><i /></div>
            <div className="call-mascot">
              {(["idle", "wink", "wave", "cheer", "confused"] as MascotMood[]).map((pose) => (
                <Mascot key={pose} mood={pose} height={190} className={pose === mood ? "is-on" : ""} priority={pose === "idle"} />
              ))}
            </div>
          </div>
        )}

        {stage.kind === "cards" && (
          <div className={`call-cards count-${Math.min(stage.cards.length, 3)}`} role="list" aria-label={stage.cards.length === 2 ? "مقارنة بين خيارين" : "اقتراحات ونيس"}>
            {stage.cards.map((card, index) => (
              <button key={card.id} type="button" role="listitem" className="call-card" style={{ "--i": index } as React.CSSProperties} onClick={() => onCard(card)}
                aria-label={card.inPlan ? `${card.name}، في مسارك` : card.canAdd ? `أضف ${card.name} لمساري` : `${card.name} على الخريطة`}>
                <ActivityArt kind={card.kind} image={card.image} label={card.name} />
                <b>{card.name}</b>
                <span className="call-card-meta">{card.meta.map((item) => <small key={item}>{item}</small>)}</span>
                <em className={card.inPlan ? "done" : ""}>{card.inPlan ? <><CallIcon name="check" size={14} /> في مسارك</> : card.canAdd ? <><CallIcon name="plus" size={14} /> أضف لمساري</> : "على الخريطة"}</em>
              </button>
            ))}
            {stage.cards.length === 2 && <span className="call-vs" aria-hidden="true">أو</span>}
          </div>
        )}

        {stage.kind === "plan" && (
          <div className="call-panel">
            <div className="call-panel-head">
              <b>مسارك الليلة</b>
              <small>{stage.totalLabel}</small>
            </div>
            <StopRail stops={stage.stops} />
            {stage.saved && <p key={savedPulse} className="call-saved" role="status"><span><CallIcon name="check" size={16} /></span> أضفت الخطة لمساري</p>}
          </div>
        )}

        {stage.kind === "nav" && (
          <div className="call-panel call-nav">
            <div className="call-nav-head">
              <span className="call-turn" aria-hidden="true">{stage.arrived ? <CallIcon name="check" size={26} /> : stage.turnIcon ?? <CallIcon name="walk" size={26} />}</span>
              <div>
                <b>{stage.arrived ? `وصلت ${stage.targetName}` : stage.targetName}</b>
                <small>
                  {stage.busy ? "أحسب الطريق…"
                    : stage.remainingM != null && !stage.arrived ? `${Math.max(5, Math.round(stage.remainingM / 5) * 5)} م`
                    : stage.walkMin != null ? `${stage.walkMin} د مشي` : ""}
                </small>
              </div>
              {stage.canSimulate && <button type="button" className="call-chip" onClick={onSimulate}>جرّب محاكاة المشي</button>}
            </div>
            {stage.stops.length > 0 && <StopRail stops={stage.stops} />}
          </div>
        )}

        {stage.kind === "proposal" && (
          <div className="call-panel call-proposal">
            <div className="call-panel-head"><b>اقتراح تعديل المسار</b></div>
            {stage.reason && <p>{stage.reason}</p>}
            <ul>{stage.changes.map((change) => <li key={change}>{change}</li>)}</ul>
            <div className="call-proposal-acts">
              <button type="button" className="yes" disabled={stage.busy} onClick={() => onProposal("accept")}>اعتمد البديل</button>
              <button type="button" disabled={stage.busy} onClick={() => onProposal("keep_current")}>أبقي مساري</button>
            </div>
          </div>
        )}
      </div>

      <div className="call-foot">
        <VoiceWave state={state} muted={muted} meters={meters} levelTarget={root} />
        {stage.kind === "base" && (
          <>
            <ol className="call-steps" aria-hidden="true">
              {STEPS.map((item) => <li key={item.id} className={step === item.id ? "on" : ""}><span><CallIcon name={item.icon} size={18} /></span>{item.label}</li>)}
            </ol>
            {heard && active && <p className="call-heard"><bdi>{heard}</bdi></p>}
          </>
        )}
        {active ? (
          <div className="call-controls">
            <span className="call-output">
              <button type="button" className="call-btn" aria-pressed={speakerMuted} aria-haspopup={canPickOutput ? "menu" : undefined} aria-expanded={canPickOutput ? outputMenu : undefined}
                onClick={() => { if (canPickOutput) setOutputMenu((open) => !open); else onSpeaker(); }}
                aria-label={canPickOutput ? "مخرج الصوت" : speakerMuted ? "شغّل صوت ونيس" : "اكتم صوت ونيس"}><UiIcon name={speakerMuted ? "speakerOff" : "speaker"} /></button>
              {canPickOutput && outputMenu && (
                <div className="call-output-menu" role="menu" aria-label="مخرج الصوت">
                  {outputs.map((device) => (
                    <button key={device.id} type="button" role="menuitemradio" aria-checked={device.id === outputId} onClick={() => { onOutput?.(device.id); setOutputMenu(false); }}><bdi>{device.label}</bdi></button>
                  ))}
                  <button type="button" role="menuitemcheckbox" aria-checked={speakerMuted} onClick={() => { onSpeaker(); setOutputMenu(false); }}>{speakerMuted ? "شغّل صوت ونيس" : "اكتم صوت ونيس"}</button>
                </div>
              )}
            </span>
            <button type="button" className="call-btn" aria-pressed={muted} disabled={!onMute} onClick={() => onMute?.()} aria-label={muted ? "إلغاء كتم الميكروفون" : "كتم الميكروفون"}
              title={onMute ? undefined : "الكتم متاح في المكالمة الحية"}><CallIcon name={muted ? "micOff" : "mic"} /></button>
            <button type="button" className="call-btn end" onClick={onEnd} aria-label="إنهاء المكالمة"><CallIcon name="end" size={26} /></button>
            <button type="button" className="call-btn guide" disabled={!onGuide} onClick={() => onGuide?.()} aria-label="دلّني على محطتي الجاية"><CallIcon name="walk" /></button>
          </div>
        ) : (
          <div className="call-controls idle">
            <button type="button" className="call-start" onClick={onStart}><CallIcon name="phone" size={20} /> {state === "paused" || state === "error" ? "استئناف المكالمة" : "ابدأ المكالمة"}</button>
            <button type="button" className="call-link" onClick={onChat}>كمّل بالكتابة</button>
            <button type="button" className="call-link" onClick={onEnd}>إغلاق</button>
          </div>
        )}
        <small className="call-note">{mode === "realtime"
          ? "مكالمة حية: صوتك يمر لمزوّد الذكاء الاصطناعي ولا نحفظه. أي تعديل على مسارك يحتاج موافقتك."
          : "أي تعديل على مسارك يحتاج موافقتك."}</small>
      </div>
    </div>
  );
}
