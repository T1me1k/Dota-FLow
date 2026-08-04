import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('launcher survives owepm invalid verification by switching to GSI-only Electron', async () => {
  const [rootPackageText, electronPackageText, launcher] = await Promise.all([
    read('package.json'),
    read('apps/overwolf-electron/package.json'),
    read('scripts/overwolf-dev.mjs')
  ]);
  const rootPackage = JSON.parse(rootPackageText);
  const electronPackage = JSON.parse(electronPackageText);

  assert.equal(rootPackage.scripts['gsi:start'], 'npm --prefix apps/overwolf-electron run start:gsi');
  assert.equal(rootPackage.scripts['gsi:dev'], 'node scripts/overwolf-dev.mjs --gsi-only');
  assert.equal(electronPackage.scripts['start:gsi'], 'electron . --remote-debugging-port=9222');
  assert.match(launcher, /OWEPM_INVALID_VERIFICATION_EXIT = 0xffff7003/);
  assert.match(launcher, /isOwepmVerificationExit/);
  assert.match(launcher, /Switching automatically to stable GSI-only Electron mode/);
  assert.match(launcher, /startNpmScript\('gsi:start', \{ DOTA_FLOW_GSI_ONLY: '1' \}\)/);
  assert.match(launcher, /GSI-only mode: Overwolf credentials and gaming-package verification are not required/);
});
