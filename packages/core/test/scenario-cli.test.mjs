import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
test('scenario CLI supports category and JSON',()=>{const r=spawnSync(process.execPath,['scripts/scenarios.mjs','--category','mid','--json'],{encoding:'utf8'});assert.equal(r.status,0);const x=JSON.parse(r.stdout);assert.equal(x.summary.total,10);assert.equal(x.summary.failed,0);});
