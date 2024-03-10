import chrome from 'chrome-aws-lambda';
import puppeteer, { Browser } from 'puppeteer-core';  
import { CATEGORY_LIST } from './consts';

export type Category = typeof CATEGORY_LIST[number];
export type Ballot = Record<Category, string | null>;

export function ballotToCsvRow(ballot: Ballot, name: string): string {
  return [
    name,
    ...CATEGORY_LIST.map(category => ballot[category]),
  ].join(',') + '\n'
}

async function getBrowser(): Promise<Browser> {
  // https://github.com/orgs/vercel/discussions/124#discussioncomment-569978
  const options = process.env.AWS_REGION
    ? {
        args: [...chrome.args, '--enable-features=ExperimentalJavaScript'],
        executablePath: await chrome.executablePath,
        headless: chrome.headless
      }
    : {
        args: [],
        executablePath:
          process.platform === 'win32'
            ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
            : process.platform === 'linux'
            ? '/usr/bin/google-chrome'
            : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      };
  return await puppeteer.launch(options);
}

function verifyTitle(title: string): title is typeof CATEGORY_LIST[number] {
  if (!CATEGORY_LIST.includes(title as typeof CATEGORY_LIST[number])) {
    throw new Error(`unexpected category: ${title}`);
  }
  return true;
}

const classNameMatchSelector = (className: string, element: string = 'div'): string => (
  `${element}[class*=" ${className}"],${element}[class^="${className}"]`
)

export default async function vfToCsv(url: string): Promise<Ballot> {
  console.log('connecting...');
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36");
    await page.goto(url);

    await page.waitForSelector(classNameMatchSelector('Component-questionsWrapper'), { timeout: 15000 });
    console.log('found ballot!');

    const selections = await page.$$(classNameMatchSelector('Component-questionsWrapper'));

    console.log('parsing ballot...');
    const ballot = CATEGORY_LIST.reduce((accum: Partial<Ballot>, key: Category): Partial<Ballot> => {
      accum[key] = null;
      return accum;
    }, {}) as Ballot;
    for (const selection of selections) {
      const titleEl = await selection.$(classNameMatchSelector('Component-title', 'h2'));
      const rawTitle = await page.evaluate(el => el?.innerHTML, titleEl);
      const normalizedTitle = rawTitle ? rawTitle.toUpperCase().trim() : undefined

      if (!normalizedTitle || !verifyTitle(normalizedTitle)) {
        throw new Error(`Title ${normalizedTitle} was not found as a valid category`);
      }

      const choiceCircleEl = await selection.$('circle[fill="red"]');
      const choiceContainerEl = ((await choiceCircleEl?.$x('../..')) ?? [])[0];
      const choiceEl = await choiceContainerEl?.$(classNameMatchSelector('Component-questionName'));

      const choice = await page.evaluate(el => el?.innerHTML, choiceEl);

      ballot[normalizedTitle] = choice || null;
    }

    console.log('ballot built!');

    return ballot;
  } finally {
    await browser.close();
  }
}
