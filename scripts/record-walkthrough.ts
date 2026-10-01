// One-off Playwright recording script for the Stage 3 OpenMontage demo video.
// Records a real walkthrough of the live production site: the Impact Map,
// the Search page's country filter, and the public "Verified Impact in
// Numbers" live stats section (used as the dashboard-equivalent live count
// since the real UnifiedDashboard requires an authenticated session this
// script doesn't attempt to automate).
import { chromium } from "playwright";
import path from "path";

const OUT_DIR = path.resolve("C:/Users/BlackCzarHP/OpenMontage/source_footage");

async function main() {
  const browser = await chromium.launch({ slowMo: 60 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  try {
  // --- Beat 1: landing page + Impact Map ---
  await page.goto("https://devmapper.africa/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const mapHeading = page.getByText("Explore Projects with Earth Intelligence");
  await mapHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500); // let the MapLibre tiles finish loading
  // Pan the map a little to show it's a real interactive map, not an image
  const mapBox = await page.locator(".maplibregl-canvas").first().boundingBox();
  if (mapBox) {
    const cx = mapBox.x + mapBox.width / 2;
    const cy = mapBox.y + mapBox.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 120, cy - 40, { steps: 20 });
    await page.mouse.up();
  }
  await page.waitForTimeout(2000);

  // --- Beat 2: Search page, filter by country ---
  await page.goto("https://devmapper.africa/search", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // A query is required for the page to show any results at all (it shows
  // an empty-state prompt below 2 characters). "water" returns two real
  // projects, one from Ghana and one a QA test fixture from Nigeria -
  // filtering to Ghana below narrows to just the clean one, which also
  // genuinely demonstrates the filter reducing the result set.
  await page.fill('input[type="search"]', "water");
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForTimeout(1500);

  // Open the country filter and pick one - this is the "filter by a state" beat.
  // NOTE: the header's language switcher is ALSO role="combobox", so it's
  // index 0 on the page; the Type/Country/SDG selects on this page come after
  // it, making Country index 2, not 1 (confirmed by inspecting the first
  // recording's frames - it opened the Type dropdown instead).
  const countrySelect = page.locator('button[role="combobox"]').nth(2);
  await countrySelect.click();
  await page.waitForTimeout(600);
  const ghanaOption = page.getByRole("option", { name: "Ghana" });
  if (await ghanaOption.count()) {
    await ghanaOption.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await page.waitForTimeout(2500);

  // --- Beat 3: back to the live impact numbers (dashboard-equivalent stats) ---
  await page.goto("https://devmapper.africa/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const statsHeading = page.getByText("Verified Impact in Numbers");
  await statsHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  } catch (err) {
    console.error("Walkthrough step failed, saving footage captured so far:", err);
  }

  await context.close();
  await browser.close();
  console.log("Recording saved to", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
