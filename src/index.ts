#!/usr/bin/env node
import puppeteer from 'puppeteer';

const CATEGORY_LIST = [
  'BEST PICTURE',
  'BEST DIRECTOR',
  'BEST ACTRESS',
  'BEST ACTOR',
  'BEST SUPPORTING ACTRESS',
  'BEST SUPPORTING ACTOR',
  'BEST ORIGINAL SCREENPLAY',
  'BEST ADAPTED SCREENPLAY',
  'BEST ANIMATED FEATURE',
  'BEST ORIGINAL SONG',
  'BEST ORIGINAL SCORE',
  'BEST DOCUMENTARY, FEATURE',
  'BEST DOCUMENTARY, SHORT',
  'BEST SHORT FILM, LIVE ACTION',
  'BEST INTERNATIONAL FEATURE FILM',
  'BEST MAKEUP AND HAIRSTYLING',
  'BEST FILM EDITING',
  'BEST VISUAL EFFECTS',
  'BEST SHORT FILM, ANIMATED',
  'BEST PRODUCTION DESIGN',
  'BEST CINEMATOGRAPHY',
  'BEST COSTUME DESIGN',
  'BEST SOUND',
] as const;

function verifyTitle(title: string): title is typeof CATEGORY_LIST[number] {
  if (!CATEGORY_LIST.includes(title as any)) {
    throw new Error(`unexpected category: ${title}`);
  }
  return true;
}

export default async function vfToCsv(url: string, name: string): Promise<string> {
  console.log('connecting...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-gpu', '--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector('.component-ballot-choices');
    console.log('found ballot!');

    const selections = await page.$$('.component-ballot-choices__entry');

    console.log('parsing ballot...');
    const choiceByCategory: Partial<Record<typeof CATEGORY_LIST[number], string>> = {};
    for (const selection of selections) {
      const titleEl = await selection.$('.component-ballot-choices__title');
      const title = await page.evaluate(el => el.innerText, titleEl);

      if (!verifyTitle(title)) {
        throw new Error(`Title ${title} was not found as a valid category`);
      }

      const choiceEl = await selection.$('.component-ballot-choices__choice');
      const choice = await page.evaluate(el => el.innerText, choiceEl);

      choiceByCategory[title] = choice;
    }

    console.log("constructing output...")
    const output = [
      name,
      ...CATEGORY_LIST.map(category => choiceByCategory[category]),
    ].join(',') + '\n'

    console.log('done!');

    return output;
  } finally {
    await browser.close();
  }
}
