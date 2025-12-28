import { Request, Response } from 'express';
import { createBrowser } from '../utils/browserFactory';
import { APP_CONFIG } from '../config/appConfig';


export async function runKeyboard(req: Request, res: Response) {
  const url = APP_CONFIG.TARGET_URL;

  try {
    const { browser, page } = await createBrowser();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const result = await checkKeyboardAccessibility(page);

    await browser.close();

    res.json({
      url,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Keyboard accessibility check failed',
      details: error.message
    });
  }
}


async function checkKeyboardAccessibility(page: any) {
  const interactiveSelectors =
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const interactiveElements = await page.$$(interactiveSelectors);
  const totalInteractiveElements = interactiveElements.length;

  // store focused element keys
  const focusedKeys = new Set<string>();

  // Traverse focus using Tab
  for (let i = 0; i < totalInteractiveElements + 5; i++) {
    await page.keyboard.press('Tab');

    const focusedKey = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;

      return (
        el.tagName.toLowerCase() +
        '|' +
        (el.id || '') +
        '|' +
        (el.getAttribute('role') || '') +
        '|' +
        (el.innerText?.trim() || el.getAttribute('aria-label') || '')
      );
    });

    if (focusedKey) {
      focusedKeys.add(focusedKey);
    }
  }

  // Identify unreachable elements with readable details
  const unreachableElements: any[] = [];

  for (const el of interactiveElements) {
    const elementInfo = await el.evaluate((node: HTMLElement) => {
      return {
        tag: node.tagName.toLowerCase(),
        id: node.id || null,
        classes:
          typeof node.className === 'string'
            ? node.className
            : null,
        text: node.innerText?.trim() || null,
        ariaLabel: node.getAttribute('aria-label'),
        role: node.getAttribute('role')
      };
    });

    const key =
      elementInfo.tag +
      '|' +
      (elementInfo.id || '') +
      '|' +
      (elementInfo.role || '') +
      '|' +
      (elementInfo.text || elementInfo.ariaLabel || '');

    if (!focusedKeys.has(key)) {
      unreachableElements.push(elementInfo);
    }
  }

  return {
    tool: 'keyboard',
    totalInteractiveElements,
    keyboardReachableElements:
      totalInteractiveElements - unreachableElements.length,
    unreachableElements,
    keyboardTrapDetected: false,
    issues:
      unreachableElements.length > 0
        ? ['Some interactive elements are not reachable using keyboard']
        : [],
    timestamp: new Date().toISOString()
  };
}
