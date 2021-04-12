#!/usr/bin/env node
const { argv } = require('yargs');
const puppeteer = require('puppeteer');
const fs = require('fs');

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
];

async function run() {
  const { output = './sheet.csv', name, url } = argv;
  if (!url) throw new Error('provide a --url');
  if (!name) throw new Error('provide a --name');

  console.log('connecting...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-gpu', '--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url);

  console.log('found ballot!');
  await page.waitForSelector('.component-ballot-choices');
  const selections = await page.$$('.component-ballot-choices__entry');

  console.log('parsing ballot...');
  const choiceByCategory = {};
  for (selection of selections) {
    const titleEl = await selection.$('.component-ballot-choices__title');
    const title = await page.evaluate(el => el.innerText, titleEl);

    const choiceEl = await selection.$('.component-ballot-choices__choice');
    const choice = await page.evaluate(el => el.innerText, choiceEl);

    choiceByCategory[title] = choice;
  }

  console.log('writing...');
  if (!fs.existsSync(output)) {
    fs.closeSync(fs.openSync(output, 'w'));
  }

  fs.appendFileSync(output, [
    name,
    ...CATEGORY_LIST.map(category => choiceByCategory[category]),
  ].join(',') + '\n');

  console.log('done!');
  await browser.close();
}

run();