import { Request, Response } from 'express';
import { createBrowser } from '../utils/browserFactory';
import { AccessibilityPage } from '../pages/AccessibilityPage';
import { APP_CONFIG } from '../config/appConfig';

export async function crawl(req: Request, res: Response) {
  const url = APP_CONFIG.TARGET_URL;

  try {
    const { browser, page } = await createBrowser();
    const a11yPage = new AccessibilityPage(page);

    await a11yPage.navigate(url);

    const dom = await a11yPage.getDOM();
    const links = await page.$$eval('a', as =>
      as.map(a => ({
        text: a.textContent?.trim(),
        href: a.href
      }))
    );

    await browser.close();

    res.json({
      url,
      domLength: dom.length,
      totalLinks: links.length,
      links
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Crawl failed',
      details: error.message
    });
  }
}
