import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, normalize } from 'node:path';
import process from 'node:process';

const GSI_PORT = Number(process.env.DOTA_FLOW_GSI_PORT ?? 32123);
const GSI_PATH = process.env.DOTA_FLOW_GSI_PATH ?? '/dota-flow-gsi';
const GSI_TOKEN = process.env.DOTA_FLOW_GSI_TOKEN ?? 'dota-flow-local-v1';
const CONFIG_NAME = 'gamestate_integration_dota_flow.cfg';

function integrationConfig() {
  return `"Dota Flow Game State Integration"
{
  "uri" "http://127.0.0.1:${GSI_PORT}${GSI_PATH}"
  "timeout" "5.0"
  "buffer" "0.1"
  "throttle" "0.1"
  "heartbeat" "5.0"
  "auth"
  {
    "token" "${GSI_TOKEN}"
  }
  "data"
  {
    "provider" "1"
    "map" "1"
    "player" "1"
    "hero" "1"
    "abilities" "1"
    "items" "1"
  }
}
`;
}

function registrySteamPath() {
  try {
    const output = execFileSync('reg.exe', [
      'query',
      'HKCU\\Software\\Valve\\Steam',
      '/v',
      'SteamPath'
    ], { encoding: 'utf8', windowsHide: true });
    const match = output.match(/SteamPath\s+REG_\w+\s+(.+)$/im);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function steamLibraries(steamRoot) {
  const roots = new Set([normalize(steamRoot)]);
  const libraryFile = join(steamRoot, 'steamapps', 'libraryfolders.vdf');
  try {
    const text = await readFile(libraryFile, 'utf8');
    for (const match of text.matchAll(/"path"\s+"([^"]+)"/g)) {
      roots.add(normalize(match[1].replace(/\\\\/g, '\\')));
    }
  } catch {
    // A Steam root without libraryfolders.vdf can still contain Dota.
  }
  return [...roots];
}

async function candidateSteamRoots() {
  const roots = new Set();
  const fromRegistry = registrySteamPath();
  if (fromRegistry) roots.add(normalize(fromRegistry));
  if (process.env['ProgramFiles(x86)']) roots.add(join(process.env['ProgramFiles(x86)'], 'Steam'));
  if (process.env.ProgramFiles) roots.add(join(process.env.ProgramFiles, 'Steam'));
  return [...roots];
}

async function findDotaInstalls() {
  const installs = [];
  for (const steamRoot of await candidateSteamRoots()) {
    if (!(await exists(steamRoot))) continue;
    for (const library of await steamLibraries(steamRoot)) {
      const dotaRoot = join(library, 'steamapps', 'common', 'dota 2 beta');
      const dotaExe = join(dotaRoot, 'game', 'bin', 'win64', 'dota2.exe');
      if (await exists(dotaExe)) installs.push(dotaRoot);
    }
  }
  return [...new Set(installs.map(normalize))];
}

async function installConfig(dotaRoot) {
  const directory = join(dotaRoot, 'game', 'dota', 'cfg', 'gamestate_integration');
  const destination = join(directory, CONFIG_NAME);
  await mkdir(directory, { recursive: true });
  const next = integrationConfig();
  let current = null;
  try {
    current = await readFile(destination, 'utf8');
  } catch {
    // First install.
  }
  if (current !== next) await writeFile(destination, next, 'utf8');
  return destination;
}

if (process.platform !== 'win32') {
  console.log('Dota GSI config: skipped outside Windows.');
  process.exit(0);
}

const installs = await findDotaInstalls();
if (installs.length === 0) {
  console.warn('WARNING: Dota 2 installation was not found automatically.');
  console.warn(`Create ${CONFIG_NAME} inside Dota 2\\game\\dota\\cfg\\gamestate_integration before launching Dota.`);
  process.exit(0);
}

for (const install of installs) {
  const destination = await installConfig(install);
  console.log(`Dota GSI config ready: ${destination}`);
}
console.log('Dota must be restarted after this config is created or changed.');
