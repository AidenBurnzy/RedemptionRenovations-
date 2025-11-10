import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import puppeteer from 'puppeteer';

const ROOT = '/workspaces/RedemptionRenovations-';
const PORT = 8123;

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

function resolvePath(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  let resolved = path.join(ROOT, decoded);
  if (decoded.endsWith('/')) {
    resolved = path.join(resolved, 'index.html');
  }
  if (!resolved.startsWith(ROOT)) {
    return null;
  }
  return resolved;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const filePath = resolvePath(url.pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
    res.end(data);
  } catch (error) {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`[server] listening on ${PORT}`);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
page.on('console', (msg) => {
  console.log('[browser console]', msg.text());
});

await page.goto(`http://127.0.0.1:${PORT}/projectsGallery.html`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-project-id] .gallery-card-summary', { timeout: 5000 });
await page.click('[data-project-id] .gallery-card-summary');
await page.waitForSelector('.project-overlay.open', { timeout: 5000 });

const info = await page.evaluate(() => {
  const overlay = document.querySelector('.project-overlay');
  const media = overlay?.querySelector('[data-overlay-media]');
  const carousel = media?.querySelector('.gallery-carousel');
  const track = carousel?.querySelector('.gallery-carousel-track');
  const slides = carousel ? carousel.querySelectorAll('.gallery-carousel-slide') : [];
  return {
    carouselExists: Boolean(carousel),
    slideCount: slides.length,
    hasPrev: Boolean(carousel?.querySelector('.gallery-carousel-prev')),
    hasNext: Boolean(carousel?.querySelector('.gallery-carousel-next')),
    dotCount: carousel ? carousel.querySelectorAll('.gallery-carousel-dot').length : 0,
    currentIndex: track?.style.getPropertyValue('--carousel-index') || null,
    trackTransform: track ? window.getComputedStyle(track).transform : null
  };
});

console.log(info);

await browser.close();
await new Promise((resolve) => server.close(resolve));
