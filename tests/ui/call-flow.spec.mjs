import { expect, test } from "@playwright/test";

// The approved call design, end to end, on the browser-speech call (no model key needed): the visitor
// says one sentence, the engine's plan appears as a schedule inside the call, a spoken «اعتمدها» is
// confirmed only once the plan reads back from the database, and «عرض جدولي» opens مساري with the
// call still running.
const visitor = process.env.WANEES_BASE_URL ?? "http://127.0.0.1:3100";
const slug = "boulevard-world-demo";

// A scripted microphone and a silent speaker: the test decides what is heard and when a reply ends.
async function scriptSpeech(page) {
  await page.addInitScript(() => {
    class FakeRecognition {
      start() { window.__pending = this; }
      abort() { if (window.__pending === this) window.__pending = null; }
    }
    window.SpeechRecognition = FakeRecognition;
    window.webkitSpeechRecognition = FakeRecognition;
    window.__say = (text) => {
      const recognition = window.__pending;
      if (!recognition) return false;
      window.__pending = null;
      recognition.onresult?.({ results: [Object.assign([{ transcript: text }], { isFinal: true })] });
      recognition.onend?.();
      return true;
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: { speak(utterance) { window.__utter = utterance; }, cancel() {}, getVoices() { return []; } },
      configurable: true,
    });
    window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance ?? function Utterance(text) { this.text = text; };
    window.__done = () => { const utterance = window.__utter; window.__utter = null; utterance?.onend?.(); };
  });
}

async function say(page, text) {
  await page.waitForFunction(() => Boolean(window.__pending), null, { timeout: 20_000 });
  await page.evaluate((spoken) => window.__say(spoken), text);
  await page.waitForFunction(() => Boolean(window.__utter), null, { timeout: 40_000 });
}

test("a call plans from one sentence, saves on a spoken yes, and keeps running behind مساري", async ({ page }) => {
  test.setTimeout(120_000);
  await scriptSpeech(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${visitor}/e/${slug}`);
  const open = page.getByRole("button", { name: /^مكالمة مع ونيس/ });
  await expect(open).toBeEnabled();
  await open.click();
  const call = page.getByRole("dialog", { name: "محادثة صوتية مع ونيس" });
  await call.getByRole("button", { name: "ابدأ المكالمة" }).click();

  // One control bar for the whole call: speaker, microphone, end, and the way back to chat.
  await expect(call.getByRole("button", { name: "إنهاء المكالمة" })).toBeVisible();
  await expect(call.getByRole("button", { name: "كمّل بالشات مع ونيس" })).toBeVisible();
  await expect(call.getByRole("status").first()).toContainText("أستمع لك");

  await say(page, "معي عائلتي ونبي ألعاب ومسرحية وعشاء لمدة ثلاث ساعات");
  const stops = call.getByRole("list", { name: "محطات الخطة" });
  await expect(stops).toBeVisible();
  expect(await stops.getByRole("listitem").count()).toBeGreaterThan(1);
  const approve = call.getByRole("button", { name: "أضيف الخطة إلى جدولي" });
  await expect(approve).toBeVisible();
  // Nothing claims success yet.
  await expect(call.getByText("تمت إضافة خطتكم إلى مساري")).toHaveCount(0);

  await page.evaluate(() => window.__done());
  await say(page, "تمام اعتمدها");
  await expect(call.getByRole("heading", { name: "تمت إضافة خطتكم إلى مساري" })).toBeVisible();
  // The confirmation stands on the stored plan, not on the words.
  const stored = await page.evaluate(async (event) => {
    const response = await fetch(`/api/v1/events/${event}/itinerary`, { credentials: "same-origin" });
    return response.ok ? response.json() : null;
  }, slug);
  expect(JSON.stringify(stored)).toContain("stops");

  await call.getByRole("button", { name: "عرض جدولي" }).click();
  await expect(page.getByRole("heading", { name: "مسارك الليلة" })).toBeVisible();
  const pill = page.getByRole("button", { name: /مكالمة جارية مع ونيس/ });
  await expect(pill).toBeVisible();
  await pill.click();
  await expect(call).toBeVisible();
  await expect(call.getByRole("button", { name: "إنهاء المكالمة" })).toBeVisible();
});
