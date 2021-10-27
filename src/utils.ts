import { Page } from 'puppeteer';

export const inPageContext = (page: Page) =>
  async <T>(accessor: Promise<T>) => {
    const element = await accessor;

    if (element) {  
      return element as Exclude<T, null | undefined>;
    }

    throw new Error(`Inconsistent page structure. Check the ${page.url()}`);
  };
