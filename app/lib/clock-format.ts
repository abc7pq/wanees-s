// The visitor's clock, written the way people say it: 12-hour with «ص / م» (AM / PM in English).
// Minutes are event-local minutes of the day; a night that runs past midnight wraps (1500 → «1:00 ص»).
// Internal parsing and storage stay on minutes; this is only how a time is shown or spoken.

export type ClockLanguage = "ar" | "en";

const dayMinute = (minute: number) => ((Math.round(minute) % 1440) + 1440) % 1440;
const face = (value: number) => `${Math.floor(value / 60) % 12 || 12}:${String(value % 60).padStart(2, "0")}`;
const period = (value: number, language: ClockLanguage) => (value < 720 ? (language === "en" ? "AM" : "ص") : language === "en" ? "PM" : "م");

/** `1140` → «7:00 م», `0` → «12:00 ص», `720` → «12:00 م». */
export function clock12(minute: number, language: ClockLanguage = "ar") {
  const value = dayMinute(minute);
  return `${face(value)} ${period(value, language)}`;
}

/** «7:00 – 7:20 م»: the period is said once when both ends share it, twice when the range crosses noon or midnight. */
export function clockRange12(start: number, end: number, language: ClockLanguage = "ar") {
  const from = dayMinute(start);
  const to = dayMinute(end);
  return period(from, language) === period(to, language)
    ? `${face(from)} – ${face(to)} ${period(to, language)}`
    : `${clock12(from, language)} – ${clock12(to, language)}`;
}

/** A whole hour for a chart axis: `19` → «7 م». */
export function hour12(hour: number, language: ClockLanguage = "ar") {
  const value = dayMinute(hour * 60);
  return `${Math.floor(value / 60) % 12 || 12} ${period(value, language)}`;
}
