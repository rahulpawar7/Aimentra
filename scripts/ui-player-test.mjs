import { chromium } from 'playwright';

const APP = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

const courses = await (await fetch(`${API}/courses`)).json();
const courseId = courses.data.courses[0]._id;
console.log('course', courseId, courses.data.courses[0].title);

const browser = await chromium.launch({ headless: true });
for (const vp of [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@aimentra.com');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.goto(`${APP}/dashboard/courses/${courseId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `test-results/player-${vp.name}-player.png`, fullPage: true });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );
  const hasVideo = await page.locator('video').count();
  console.log(`${vp.name} player url=${page.url()} videoEls=${hasVideo} overflow=${overflow}`);
  await context.close();
}
await browser.close();
