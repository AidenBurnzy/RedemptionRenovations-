import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: '/workspaces/RedemptionRenovations-'
});

try {
  await new Promise((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        reject(new Error('Server start timeout'));
      }
    }, 6000);

    server.stdout.on('data', (data) => {
      const line = data.toString();
      console.log('[server]', line.trim());
      if (!done && line.includes('Serving HTTP')) {
        done = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    server.stderr.on('data', (data) => {
      const line = data.toString();
      if (!done && line.includes('Serving HTTP')) {
        done = true;
        clearTimeout(timeout);
        console.log('[server]', line.trim());
        resolve();
      } else if (!done) {
        done = true;
        clearTimeout(timeout);
        reject(new Error(line));
      }
    });
  });

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const projectPageUrl = 'http://127.0.0.1:8000/projectsGallery.html';
  console.log('[browser] navigating to page');
  await page.goto(projectPageUrl, { waitUntil: 'networkidle0' });

  await page.waitForSelector('[data-project-id]', { timeout: 5000 });

  // Open the first project card
  const firstCardBtn = await page.$('[data-project-id] .gallery-card-summary');
  if (!firstCardBtn) {
    console.error('No project cards found.');
    await browser.close();
    process.exit(1);
  }

  await firstCardBtn.click();
  await page.waitForSelector('.project-overlay.open', { timeout: 5000 });
  console.log('[browser] overlay opened');

  const carouselInfo = await page.evaluate(() => {
  const overlay = document.querySelector('.project-overlay');
  const media = overlay?.querySelector('[data-overlay-media]');
  const carousel = media?.querySelector('.gallery-carousel');
  const slides = carousel ? Array.from(carousel.querySelectorAll('.gallery-carousel-slide')) : [];
  return {
    carouselExists: Boolean(carousel),
    slideCount: slides.length,
    dots: carousel ? carousel.querySelectorAll('.gallery-carousel-dot').length : 0,
    prevExists: Boolean(carousel?.querySelector('.gallery-carousel-prev')),
    nextExists: Boolean(carousel?.querySelector('.gallery-carousel-next')),
    transform: carousel?.querySelector('.gallery-carousel-track')?.style.getPropertyValue('--carousel-index') || null
  };
  });

  console.log(carouselInfo);

  // Try to advance the carousel if buttons exist
  if (carouselInfo.nextExists) {
    await page.click('.project-overlay .gallery-carousel-next');
    await page.waitForTimeout(300);
    const afterClick = await page.evaluate(() => {
      const track = document.querySelector('.project-overlay .gallery-carousel-track');
      return {
        indexVar: track?.style.getPropertyValue('--carousel-index') || null,
        transform: getComputedStyle(track || document.body).transform
      };
    });
    console.log('After click:', afterClick);
  }

  await browser.close();
} finally {
  server.kill('SIGINT');
}
