import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const heroProfilesPath = join(root, 'packages/core/src/hero-profiles.mjs');
const heroCatalogPath = join(root, 'packages/core/src/hero-catalog.mjs');
const testsDirectory = join(root, 'packages/core/test');

const MID_PROFILE_IDS = [
  'ember_spirit',
  'invoker',
  'lina',
  'puck',
  'queen_of_pain',
  'storm_spirit',
  'void_spirit',
  'zeus'
];

function requireReplacement(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Could not locate ${label}`);
  return source.replace(before, after);
}

let heroProfiles = readFileSync(heroProfilesPath, 'utf8');
heroProfiles = requireReplacement(
  heroProfiles,
  "import { createCarryProfilePack } from './carry-profile-pack.mjs';",
  "import { createCarryProfilePack } from './carry-profile-pack.mjs';\nimport { createMidProfilePack } from './mid-profile-pack.mjs';",
  'carry profile import'
);
heroProfiles = requireReplacement(
  heroProfiles,
  'Object.assign(detailedProfiles, createCarryProfilePack({ ITEMS, benchmark, condition }));',
  'Object.assign(detailedProfiles, createCarryProfilePack({ ITEMS, benchmark, condition }));\nObject.assign(detailedProfiles, createMidProfilePack({ ITEMS, benchmark, condition }));',
  'carry profile registration'
);
writeFileSync(heroProfilesPath, heroProfiles);

let heroCatalog = readFileSync(heroCatalogPath, 'utf8');
const detailedSetPattern = /const DETAILED_HEROES = new Set\(\[([\s\S]*?)\n\]\);/;
const detailedMatch = heroCatalog.match(detailedSetPattern);
if (!detailedMatch) throw new Error('Could not locate DETAILED_HEROES set');
const detailedIds = new Set([...detailedMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]));
for (const heroId of MID_PROFILE_IDS) detailedIds.add(heroId);
const sortedDetailedIds = [...detailedIds].sort();
const detailedLines = [];
for (let index = 0; index < sortedDetailedIds.length; index += 6) {
  detailedLines.push(`  ${sortedDetailedIds.slice(index, index + 6).map((id) => `'${id}'`).join(', ')}`);
}
const formattedDetailedSet = `const DETAILED_HEROES = new Set([\n${detailedLines.join(',\n')}\n]);`;
heroCatalog = heroCatalog.replace(detailedSetPattern, formattedDetailedSet);
writeFileSync(heroCatalogPath, heroCatalog);

for (const fileName of readdirSync(testsDirectory).filter((name) => name.endsWith('.test.mjs'))) {
  const testPath = join(testsDirectory, fileName);
  let source = readFileSync(testPath, 'utf8');
  const oldTitle = 'carry profile pack exposes 32 detailed heroes while uncalibrated heroes stay conservative';
  const titleIndex = source.indexOf(oldTitle);
  if (titleIndex === -1) continue;
  const blockEnd = source.indexOf('\n});', titleIndex);
  if (blockEnd === -1) throw new Error(`Could not locate end of detailed coverage test in ${fileName}`);
  const originalBlock = source.slice(titleIndex, blockEnd);
  const updatedBlock = originalBlock
    .replace(oldTitle, 'hero intelligence packs expose 40 detailed heroes while uncalibrated heroes stay conservative')
    .replace(/\b32\b/g, '40');
  source = source.slice(0, titleIndex) + updatedBlock + source.slice(blockEnd);
  writeFileSync(testPath, source);
}

const verificationProfiles = readFileSync(heroProfilesPath, 'utf8');
const verificationCatalog = readFileSync(heroCatalogPath, 'utf8');
if (!verificationProfiles.includes('createMidProfilePack')) throw new Error('Mid profile pack was not registered');
for (const heroId of MID_PROFILE_IDS) {
  if (!verificationCatalog.includes(`'${heroId}'`)) throw new Error(`${heroId} was not added to DETAILED_HEROES`);
}

for (const temporaryPath of [
  join(root, 'scripts/apply-mid-profile-pack.mjs'),
  join(root, '.github/workflows/apply-mid-profile-pack.yml')
]) {
  rmSync(temporaryPath, { force: true });
}

console.log(`Integrated ${MID_PROFILE_IDS.length} detailed mid profiles.`);
