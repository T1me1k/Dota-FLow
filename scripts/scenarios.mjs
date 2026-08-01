#!/usr/bin/env node
import { runScenarios, summarizeScenarios } from '../packages/core/src/scenario-calibration.mjs';
const args=process.argv.slice(2), value=flag=>{const i=args.indexOf(flag);return i>=0?args[i+1]:null};
const results=runScenarios({category:value('--category')}), summary=summarizeScenarios(results), visible=args.includes('--failures-only')?results.filter(x=>!x.passed):results;
if(args.includes('--json')) console.log(JSON.stringify({summary,results:visible},null,2));
else { console.log(`Dota Flow v0.21 Scenario Calibration\nTotal: ${summary.total} · passed: ${summary.passed} · failed: ${summary.failed}`); console.log(`Roles: ${JSON.stringify(summary.roleDistribution)}\nPhases: ${JSON.stringify(summary.phaseDistribution)}`); console.log(`Forbidden-action violations: ${summary.forbiddenActionViolations} · average confidence: ${(summary.averageConfidence*100).toFixed(1)}% · safe fallbacks: ${summary.safeFallbacks}`); for(const r of visible) console.log(`${r.passed?'PASS':'FAIL'} ${r.id} ${r.expected} → ${r.actual}`); }
process.exitCode=summary.failed?1:0;
