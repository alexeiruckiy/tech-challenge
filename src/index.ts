import readline from 'readline';
import puppeteer from 'puppeteer';

import config from './config';
import { Genre } from './types';
import { inPageContext } from './utils';

const genres = Object.values<string>(Genre);

const getBookTitle = async (genre: Genre) => {
  const browser = await puppeteer.launch();
  const [page] = await browser.pages();
  const maybeGet = inPageContext(page);

  await page.goto(`${config.booksUrl}/genres/${genre}`);

  try {
    const book = await maybeGet(page.$('.bookImage'));
    const alt = await maybeGet(book.getProperty('alt'));

    return maybeGet(alt.jsonValue<string>());
  } finally {
    await browser.close();
  }
};

const serchIntoAmazon = async (needle: string) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const [page] = await browser.pages();
  const maybeGet = inPageContext(page);

  await page.goto(config.amazonUrl);

  try {
    const seachbox = await maybeGet(page.$('#twotabsearchtextbox'));
    await seachbox.type(needle);
    await seachbox.press('Enter');
    await page.waitForNavigation();

    const toItem = await maybeGet(page.$('.a-section h2 a'));
    await toItem.click();
    await page.waitForNavigation();

    const addToCart = await maybeGet(page.$('#add-to-cart-button'));
    await addToCart.click();
    await page.waitForNavigation();

    const navCart = await maybeGet(page.$('#nav-cart'));
    await navCart.click();
  } catch(e) {
    browser.close();

    throw e;
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(`Type a genre you want to try out: ${genres.join(', ')}\n`, async (answer) => {
  if (genres.includes(answer)) {
    try {
      console.log('Fetching a data from books database');
      
      const title = await getBookTitle(answer as Genre);
      
      console.log(`Book has been found: ${title}`);

      await serchIntoAmazon(title);
    } catch(e) {
      console.log((e as Error).message);
    }
  } else {
    console.log(`You've made a typo in the genre: ${answer}`);
  }

  rl.close();
});
