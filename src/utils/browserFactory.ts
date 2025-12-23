import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { APP_CONFIG } from '../config/appConfig';

export async function createBrowser(): Promise<{
  browser: Browser;
  context: BrowserContext;
  page: Page;
}> {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext(
    APP_CONFIG.BASIC_AUTH.enabled
      ? {
          httpCredentials: {
            username: APP_CONFIG.BASIC_AUTH.username,
            password: APP_CONFIG.BASIC_AUTH.password
          }
        }
      : {}
  );

  const page = await context.newPage();

  return { browser, context, page };
}
