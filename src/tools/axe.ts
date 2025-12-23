import { Request, Response } from 'express';
import { createBrowser } from '../utils/browserFactory';
import { AccessibilityPage } from '../pages/AccessibilityPage';
import { APP_CONFIG } from '../config/appConfig';

export async function runAxe(req: Request, res: Response) {
  const url = APP_CONFIG.TARGET_URL;

  try {
    const { browser, page } = await createBrowser();
    const a11yPage = new AccessibilityPage(page);

    await a11yPage.navigate(url);

    const axeResult = await a11yPage.runAxe();

    await browser.close();

    res.json({
      url,
      summary: {
        violations: axeResult.violations.length,
        passes: axeResult.passes.length,
        incomplete: axeResult.incomplete.length
      },
      violations: axeResult.violations
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Axe scan failed',
      details: error.message
    });
  }
}
