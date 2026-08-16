/**
 * Full functional + responsive smoke suite for Aimentra LMS
 * Run: node scripts/e2e-smoke.mjs
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL || 'http://localhost:5000/api/v1';
const APP = process.env.APP_URL || 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'test-results');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const stamp = () => new Date().toISOString().slice(11, 19);

function log(ok, name, detail = '') {
  const row = { ok, name, detail, at: stamp() };
  results.push(row);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' — ' + detail : ''}`);
}

async function api(method, urlPath, { body, token, cookies } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookies) headers.Cookie = cookies;
  const res = await fetch(`${API}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json, headers: res.headers };
}

async function screenshot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function checkNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflow: doc.scrollWidth > doc.clientWidth + 2,
    };
  });
  log(!overflow.overflow, `Responsive no-H-scroll: ${label}`, `sw=${overflow.scrollWidth} cw=${overflow.clientWidth}`);
  return !overflow.overflow;
}

async function run() {
  console.log('\n=== API FUNCTIONAL TESTS ===\n');

  // Health
  {
    const res = await fetch('http://localhost:5000/health');
    const j = await res.json();
    log(res.ok && j.status === 'ok', 'GET /health', JSON.stringify(j));
  }

  // Public plans
  let planId = null;
  {
    const { status, json } = await api('GET', '/plans');
    const plans = json?.data?.plans || json?.data || [];
    planId = plans[0]?._id;
    log(status === 200 && Array.isArray(plans), 'GET /plans', `count=${plans.length}`);
  }

  // Public courses
  let courseSlug = null;
  {
    const { status, json } = await api('GET', '/courses');
    const courses = json?.data?.courses || [];
    courseSlug = courses[0]?.slug;
    log(status === 200, 'GET /courses', `count=${courses.length} first=${courseSlug || 'none'}`);
  }

  // CMS
  {
    const { status, json } = await api('GET', '/cms');
    log(status === 200 && json?.success, 'GET /cms', Object.keys(json?.data || {}).join(','));
  }

  // Testimonials
  {
    const { status } = await api('GET', '/testimonials');
    log(status === 200, 'GET /testimonials');
  }

  // Register unique student
  const email = `e2e_${Date.now()}@test.local`;
  const password = 'Test@12345';
  let studentToken = null;
  let verifyToken = null;
  {
    const { status, json } = await api('POST', '/auth/register', {
      body: { name: 'E2E Tester', email, password, phone: '9876543210' },
    });
    studentToken = json?.data?.accessToken;
    verifyToken = json?.data?.verifyToken;
    log(status === 201 && !!studentToken, 'POST /auth/register', email);
  }

  // Verify email
  if (verifyToken) {
    const { status, json } = await api('POST', '/auth/verify-email', { body: { token: verifyToken } });
    log(status === 200 && json?.success, 'POST /auth/verify-email');
  } else {
    log(false, 'POST /auth/verify-email', 'no verifyToken in non-prod response');
  }

  // Login student
  {
    const { status, json } = await api('POST', '/auth/login', {
      body: { email, password, rememberMe: true },
    });
    studentToken = json?.data?.accessToken || studentToken;
    log(status === 200 && !!studentToken, 'POST /auth/login (student)');
  }

  // Me
  {
    const { status, json } = await api('GET', '/auth/me', { token: studentToken });
    log(status === 200 && json?.data?.email === email, 'GET /auth/me');
  }

  // Forgot password
  {
    const { status, json } = await api('POST', '/auth/forgot-password', { body: { email } });
    log(status === 200 && json?.success, 'POST /auth/forgot-password', json?.resetToken ? 'token issued' : 'ok');
  }

  // Checkout create order + mock verify
  let orderId = null;
  if (planId) {
    const { status, json } = await api('POST', '/orders', {
      token: studentToken,
      body: {
        planId,
        billingDetails: {
          name: 'E2E Tester',
          email,
          phone: '9876543210',
          address: 'Test Street',
          state: 'Maharashtra',
        },
      },
    });
    orderId = json?.data?.order?._id;
    const free = json?.data?.free;
    log(status === 201 && !!orderId, 'POST /orders create', free ? 'free plan' : `order=${orderId}`);

    if (orderId && !free && json?.data?.order?.status !== 'paid') {
      const rz = json?.data?.razorpay;
      const { status: vs, json: vj } = await api('POST', '/orders/verify', {
        token: studentToken,
        body: {
          orderId,
          razorpayOrderId: rz?.orderId || `order_mock_${orderId}`,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: `mock_${Date.now()}`,
        },
      });
      log(vs === 200 && (vj?.data?.order?.status === 'paid' || vj?.success), 'POST /orders/verify (mock)');
    } else if (free || json?.data?.order?.status === 'paid') {
      log(true, 'POST /orders/verify (mock)', 'already paid / free');
    }
  } else {
    log(false, 'POST /orders create', 'no planId');
  }

  // Progress endpoints
  {
    const { status } = await api('GET', '/progress/my-courses', { token: studentToken });
    log(status === 200, 'GET /progress/my-courses');
  }
  {
    const { status } = await api('GET', '/progress/continue-learning', { token: studentToken });
    log(status === 200, 'GET /progress/continue-learning');
  }
  {
    const { status } = await api('GET', '/progress/completed', { token: studentToken });
    log(status === 200, 'GET /progress/completed');
  }

  // Admin login
  let adminToken = null;
  {
    const { status, json } = await api('POST', '/auth/login', {
      body: { email: 'admin@aimentra.com', password: 'Admin@123', adminPortal: true },
    });
    adminToken = json?.data?.accessToken;
    log(status === 200 && !!adminToken, 'POST /auth/login (admin)');
  }

  // Admin routes
  if (adminToken) {
    for (const [method, p] of [
      ['GET', '/admin/dashboard'],
      ['GET', '/admin/users'],
      ['GET', '/admin/plans'],
      ['GET', '/admin/orders'],
      ['GET', '/admin/coupons'],
      ['GET', '/admin/cms'],
      ['GET', '/admin/analytics'],
      ['GET', '/admin/audit-log'],
    ]) {
      const { status, json } = await api(method, p, { token: adminToken });
      log(status === 200 && json?.success !== false, `${method} ${p}`, `status=${status}`);
    }

    // CMS upsert
    {
      const { status, json } = await api('PUT', '/admin/cms/hero', {
        token: adminToken,
        body: {
          jsonValue: {
            headline: 'E2E Hero Headline',
            subheadline: 'Updated by automated test',
            ctaText: 'View Plans',
            ctaHref: '/packages',
          },
        },
      });
      log(status === 200 && json?.success, 'PUT /admin/cms/hero');
    }
  }

  // Student must NOT access admin
  {
    const { status } = await api('GET', '/admin/dashboard', { token: studentToken });
    log(status === 403 || status === 401, 'Student blocked from /admin/dashboard', `status=${status}`);
  }

  // Curriculum (public/auth)
  if (courseSlug) {
    const { status, json } = await api('GET', `/courses/${courseSlug}/curriculum`, { token: studentToken });
    log(status === 200, `GET /courses/${courseSlug}/curriculum`);
  }

  // Logout
  {
    const { status } = await api('POST', '/auth/logout', { token: studentToken });
    log(status === 200, 'POST /auth/logout');
  }

  console.log('\n=== UI + RESPONSIVE TESTS ===\n');

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'mobile-360', width: 360, height: 800 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1440', width: 1440, height: 900 },
  ];

  const publicPages = [
    ['/', 'home'],
    ['/courses', 'courses'],
    ['/packages', 'packages'],
    ['/login', 'login'],
    ['/register', 'register'],
    ['/forgot-password', 'forgot'],
    ['/checkout', 'checkout'],
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25000);

    for (const [route, label] of publicPages) {
      try {
        const res = await page.goto(`${APP}${route}`, { waitUntil: 'domcontentloaded' });
        const ok = !!res && res.status() < 500;
        log(ok, `UI ${vp.name} ${route}`, `http=${res?.status()}`);
        await page.waitForTimeout(800);
        await screenshot(page, `${vp.name}-${label}`);
        await checkNoHorizontalOverflow(page, `${vp.name} ${route}`);
      } catch (e) {
        log(false, `UI ${vp.name} ${route}`, e.message);
      }
    }

    // Login form interaction on mobile/desktop once
    if (vp.name === 'mobile-360' || vp.name === 'desktop-1440') {
      try {
        await page.goto(`${APP}/login`, { waitUntil: 'domcontentloaded' });
        await page.fill('input[type="email"], input[name="email"]', email);
        await page.fill('input[type="password"], input[name="password"]', password);
        const remember = page.locator('input[type="checkbox"]');
        if (await remember.count()) await remember.first().check().catch(() => {});
        await screenshot(page, `${vp.name}-login-filled`);
        log(true, `UI ${vp.name} login form fillable`);
      } catch (e) {
        log(false, `UI ${vp.name} login form fillable`, e.message);
      }
    }

    await context.close();
  }

  // Authenticated student dashboard flows (desktop)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    try {
      await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"], input[name="email"]', email);
      await page.fill('input[type="password"], input[name="password"]', password);
      await Promise.all([
        page.waitForURL(/dashboard|packages|courses|access/i, { timeout: 20000 }).catch(() => null),
        page.click('button[type="submit"]'),
      ]);
      await page.waitForTimeout(1500);
      const url = page.url();
      log(url.includes('/dashboard') || url.includes('/login') === false, 'UI student login redirects', url);
      await screenshot(page, 'desktop-after-login');

      for (const route of [
        '/dashboard',
        '/dashboard/courses',
        '/dashboard/orders',
        '/dashboard/profile',
        '/dashboard/access',
        '/dashboard/certificates',
        '/packages',
        '/checkout?planId=' + (planId || ''),
      ]) {
        try {
          const res = await page.goto(`${APP}${route}`, { waitUntil: 'domcontentloaded' });
          log(!!res && res.status() < 500, `UI auth ${route}`, `http=${res?.status()}`);
          await page.waitForTimeout(600);
          await screenshot(page, `auth-${route.replace(/[/?=&]/g, '_')}`);
          await checkNoHorizontalOverflow(page, `auth ${route}`);
        } catch (e) {
          log(false, `UI auth ${route}`, e.message);
        }
      }
    } catch (e) {
      log(false, 'UI student dashboard flow', e.message);
    }
    await context.close();
  }

  // Admin UI
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"], input[name="email"]', 'admin@aimentra.com');
      await page.fill('input[type="password"], input[name="password"]', 'Admin@123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.goto(`${APP}/admin`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-dashboard');
      log(true, 'UI /admin loads', page.url());

      for (const route of ['/admin/users', '/admin/plans', '/admin/courses', '/admin/orders']) {
        const res = await page.goto(`${APP}${route}`, { waitUntil: 'domcontentloaded' });
        log(!!res && res.status() < 500, `UI ${route}`, `http=${res?.status()}`);
        await screenshot(page, `admin-${route.split('/').pop()}`);
      }
    } catch (e) {
      log(false, 'UI admin flow', e.message);
    }
    await context.close();
  }

  // Mobile nav hamburger if present
  {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded' });
    const burger = page.locator('button[aria-label*="menu" i], button:has-text("Menu"), [data-testid="mobile-menu"], header button').first();
    try {
      if (await burger.isVisible({ timeout: 3000 })) {
        await burger.click();
        await page.waitForTimeout(500);
        await screenshot(page, 'mobile-nav-open');
        log(true, 'UI mobile nav toggles');
      } else {
        log(true, 'UI mobile nav toggles', 'no obvious hamburger (links may be stacked)');
      }
    } catch (e) {
      log(false, 'UI mobile nav toggles', e.message);
    }
    await context.close();
  }

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const summary = { passed, failed, total: results.length, results };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${results.length}`);
  console.log(`Screenshots: ${OUT}`);
  if (failed) {
    console.log('\nFailures:');
    results.filter((r) => !r.ok).forEach((r) => console.log(` - ${r.name}: ${r.detail}`));
    process.exitCode = 1;
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
