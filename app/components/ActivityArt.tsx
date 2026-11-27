// An illustrated tile for an activity, a stop or a place. The published catalog has no photos yet,
// so the tile is drawn from the record's own type (ride, show, food…): a soft brand tint and a line
// icon in the identity guide's style. When the catalog carries an image, pass `image` and it is used.
const ART: Record<string, { tone: string; icon: React.ReactNode }> = {
  ride: { tone: "violet", icon: <><circle cx="12" cy="11" r="7.5"/><circle cx="12" cy="11" r="1.4"/><path d="M12 3.5v15M4.5 11h15M6.7 5.7l10.6 10.6M17.3 5.7 6.7 16.3M8 21l4-9.5L16 21"/></> },
  show: { tone: "pink", icon: <><path d="M4 4h16v9a8 8 0 0 1-16 0V4Z"/><path d="M8.5 9.5h.01M15.5 9.5h.01M8.5 14c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/></> },
  food: { tone: "orange", icon: <><path d="M5 3v6a2 2 0 0 0 4 0V3M7 11v10M7 3v4"/><path d="M17 21V3c-1.9.6-3 3-3 6.5V13h3"/></> },
  shopping: { tone: "sky", icon: <><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></> },
  game: { tone: "teal", icon: <><rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 12.5h4M9 10.5v4m6-2h.01M18 11h.01"/></> },
  experience: { tone: "violet", icon: <><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></> },
  wildlife: { tone: "teal", icon: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/></> },
  water: { tone: "sky", icon: <><path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></> },
  horror: { tone: "night", icon: <><path d="M5 21V10a7 7 0 0 1 14 0v11l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2L5 21Z"/><path d="M9.5 10.5h.01M14.5 10.5h.01"/></> },
  sport: { tone: "orange", icon: <><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18M3 12h18M5.5 6c3 2.5 3 9.500 0 12M18.500 6c-3 2.500-3 9.500 0 12"/></> },
  place: { tone: "sky", icon: <><path d="M12 21s7-6.2 7-11.500a7 7 0 0 0-14 0C5 14.800 12 21 12 21Z"/><circle cx="12" cy="9.500" r="2.500"/></> },
  zone: { tone: "violet", icon: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15m6-12v15"/></> },
};

export type ActivityArtKind = keyof typeof ART | string;

export function ActivityArt({ kind, image, label = "", className = "" }: { kind?: ActivityArtKind | null; image?: string | null; label?: string; className?: string }) {
  const art = ART[kind ?? ""] ?? ART.experience;
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <span className={`activity-art has-image ${className}`}><img src={image} alt={label} loading="lazy" /></span>;
  }
  return (
    <span className={`activity-art tone-${art.tone} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{art.icon}</svg>
    </span>
  );
}
