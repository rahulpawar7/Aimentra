const { chromium } = require("playwright");
const path = require("path");

const OUT_DIR = "C:\\MERN\\AIWorkshop\\screenshots";
const BASE_URL = "http://localhost:3000";

const pages = [
  { path: "/", file: "home.png" },
  { path: "/courses", file: "courses.png" },
  { path: "/packages", file: "packages.png" },
  { path: "/login", file: "login.png" },
];

(async () => {
  const browser = await chromium.launch();
  const results = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    for (const p of pages) {
      const url = BASE_URL + p.path;
      console.log(`Navigating to ${url}`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(500);
      const outPath = path.join(OUT_DIR, p.file);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`Saved ${outPath}`);
      results.push(outPath);
    }

    await context.close();

    // Mobile viewport screenshot of homepage
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    console.log(`Navigating to ${BASE_URL}/ (mobile)`);
    await mobilePage.goto(BASE_URL + "/", { waitUntil: "networkidle", timeout: 30000 });
    await mobilePage.waitForTimeout(500);
    const mobileOutPath = path.join(OUT_DIR, "home-mobile.png");
    await mobilePage.screenshot({ path: mobileOutPath, fullPage: true });
    console.log(`Saved ${mobileOutPath}`);
    results.push(mobileOutPath);
    await mobileContext.close();
  } finally {
    await browser.close();
  }

  console.log("DONE");
  console.log(JSON.stringify(results));
})().catch((err) => {
  console.error("SCRIPT ERROR:", err);
  process.exit(1);
});
