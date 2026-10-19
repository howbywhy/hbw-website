#!/usr/bin/env node
/**
 * The browser checks, run against a server that is already up.
 *
 * It does not start or build anything on purpose. Measuring a site while it
 * is being rebuilt underneath you has produced two confident, wrong
 * conclusions in this repo — a 625px regression that was not real, and a set
 * of sequencing failures that were the build, not the site. So: build, start,
 * then run this.
 *
 *   npm run build && npm start &        # or next start -p 4409
 *   npm run qa                          # QA_URL to point elsewhere
 *   npm run qa -- engine twice          # just these
 *
 * Exit code is non-zero if anything failed OR if anything went unmeasured. A
 * check that measured nothing is not a check that passed.
 */
import { BASE, reachable } from "./lib.mjs";

const ALL = ["console", "links", "sequence", "worknav", "engine", "sheetwait", "said", "onestep", "scrollback", "twice", "roomwait", "brisk", "smooth"];

const asked = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const names = asked.length ? asked : ALL;

const unknown = names.filter((n) => !ALL.includes(n));
if (unknown.length) {
  console.error(`No such check: ${unknown.join(", ")}\nThere is: ${ALL.join(", ")}`);
  process.exit(2);
}

if (!(await reachable())) {
  console.error(
    `Nothing is answering at ${BASE}.\n` +
      `Build and start the site first, then run this against it:\n` +
      `  npm run build && npx next start -p 4409`
  );
  process.exit(2);
}

console.log(`checking ${BASE}\n`);

let pass = 0;
let fail = 0;
let blank = 0;
const summary = [];

for (const name of names) {
  const { default: run } = await import(`./checks/${name}.mjs`);
  let result;
  try {
    result = await run();
  } catch (error) {
    console.log(`-- ${name} --\n  FAIL the check itself threw   ::  ${error.message}\n`);
    fail += 1;
    summary.push([name, "threw"]);
    continue;
  }
  const counted = result.report();
  console.log("");
  pass += counted.pass;
  fail += counted.fail;
  blank += counted.blank;
  summary.push([
    name,
    `${counted.pass} pass${counted.fail ? ` ${counted.fail} fail` : ""}${counted.blank ? ` ${counted.blank} NOT MEASURED` : ""}`,
  ]);
}

console.log("=".repeat(52));
for (const [name, line] of summary) console.log(`  ${name.padEnd(12)} ${line}`);
console.log("=".repeat(52));
console.log(`  ${pass} pass, ${fail} fail${blank ? `, ${blank} NOT MEASURED` : ""}`);

process.exit(fail || blank ? 1 : 0);
