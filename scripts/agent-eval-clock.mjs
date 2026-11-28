// Parse displayed times independently of the app formatter being evaluated.
export function digits(text) {
  return text.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660));
}

const time = String.raw`(\d{1,2}):(\d{2})(?:\s*(AM\b|PM\b|[صم](?![\p{L}\p{N}])))?`;
const clocks = new RegExp(String.raw`(?<![\d:])${time}(?:\s*[–—-]\s*${time})?(?![\d:])`, "giu");

export function clockChecks(reply, publishedMinutes, { includeBare = true } = {}) {
  const known = new Set([...publishedMinutes].map((minute) => minute % 1440));
  const unknown = [];
  const plain = digits(reply).replace(clocks, (match, h1, m1, p1, h2, m2, p2) => {
    if (!includeBare && !p1 && !p2) return match;
    const check = (h, m, period) => {
      const hour = Number(h), minute = Number(m);
      const validHour = period ? hour >= 1 && hour <= 12 : hour <= 23;
      const pm = /^(?:PM|م)$/i.test(period ?? "");
      const value = period ? (hour % 12 + (pm ? 12 : 0)) * 60 + minute : hour * 60 + minute;
      if (!validHour || minute > 59 || !known.has(value)) unknown.push(`${h}:${m}${period ? ` ${period}` : ""}`);
    };
    check(h1, m1, p1 ?? p2);
    if (h2) check(h2, m2, p2 ?? p1);
    return " ";
  });
  return { plain, unknown };
}
