import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const output = new URL("../../docs/screenshots/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  for (const [name, route] of [
    ["dashboard", "/"],
    ["catalog", "/books"],
    ["borrowers", "/borrowers"],
    ["loans", "/loans"],
    ["reports", "/reports"],
    ["checkout", "/loans/new"],
  ]) {
    await page.goto(`http://localhost:5173${route}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("heading", { level: 1 }).waitFor();
    if (await page.getByRole("alert").count())
      throw new Error(`Application error on ${route}`);
    await page.screenshot({
      path: new URL(`${name}.png`, output).pathname.replace(
        /^\/([A-Za-z]:)/,
        "$1",
      ),
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:5173/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: new URL("mobile.png", output).pathname.replace(
      /^\/([A-Za-z]:)/,
      "$1",
    ),
    fullPage: true,
    animations: "disabled",
  });
  console.log("Captured seven screenshots from the running application.");
} finally {
  await browser.close();
}
