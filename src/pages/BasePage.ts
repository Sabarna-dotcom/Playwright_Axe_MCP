import { Page } from 'playwright';

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(url: string) {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async getDOM() {
    return await this.page.content();
  }

  async screenshot(path: string) {
    await this.page.screenshot({ path, fullPage: true });
  }
}
