import { BasePage } from './BasePage';
import AxeBuilder from '@axe-core/playwright';

export class AccessibilityPage extends BasePage {

  async runAxe() {
    return await new AxeBuilder({ page: this.page }).analyze();
  }

  async getHeadings() {
    return await this.page.$$eval(
      'h1,h2,h3,h4,h5,h6',
      els => els.map(e => ({
        tag: e.tagName,
        text: e.textContent?.trim()
      }))
    );
  }
}
