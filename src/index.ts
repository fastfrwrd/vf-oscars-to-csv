#!/usr/bin/env node
import puppeteer from 'puppeteer';

export const CATEGORY_LIST = [
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

export type Category = typeof CATEGORY_LIST[number];
export type Ballot = Record<Category, string | void>;

export function ballotToCsvRow(ballot: Ballot, name: string): string {
  return [
    name,
    ...CATEGORY_LIST.map(category => ballot[category]),
  ].join(',') + '\n'
}

function verifyTitle(title: string): title is typeof CATEGORY_LIST[number] {
  if (!CATEGORY_LIST.includes(title as any)) {
    throw new Error(`unexpected category: ${title}`);
  }
  return true;
}

export default async function vfToCsv(url: string): Promise<Ballot> {
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
    const ballot = CATEGORY_LIST.reduce((accum: Partial<Ballot>, key: Category): Partial<Ballot> => {
      accum[key] = undefined;
      return accum;
    }, {}) as Ballot;
    for (const selection of selections) {
      const titleEl = await selection.$('.component-ballot-choices__title');
      const title = await page.evaluate(el => el.innerText, titleEl);

      if (!verifyTitle(title)) {
        throw new Error(`Title ${title} was not found as a valid category`);
      }

      const choiceEl = await selection.$('.component-ballot-choices__choice');
      const choice = await page.evaluate(el => el.innerText, choiceEl);

      ballot[title] = choice;
    }

    console.log('ballot built!');

    return ballot;
  } finally {
    await browser.close();
  }
}
