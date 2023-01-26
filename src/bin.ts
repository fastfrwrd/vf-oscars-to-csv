#!/usr/bin/env node
import yargs from 'yargs/yargs';
import fs from 'fs';
import vfToCsv, { ballotToCsvRow }  from '.';

async function run() {
  try {
    const { output, name, url } = await yargs(process.argv.slice(2)).options({
      name: { type: 'string', demandOption: true },
      url: { type: 'string', demandOption: true },
      output: { type: 'string', default: './sheet.csv' },
    }).argv;

    const ballot = await vfToCsv(url);

    console.log("writing ballot to CSV...")
    const outputStr = ballotToCsvRow(ballot, name);

    if (!fs.existsSync(output)) {
      fs.closeSync(fs.openSync(output, 'w'));
    }

    fs.appendFileSync(output, outputStr);

    process.exit(0);
  } catch (e: unknown) {
    console.error(e);
    process.exit(1);
  }
}

run();
