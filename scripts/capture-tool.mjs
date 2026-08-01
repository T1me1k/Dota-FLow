#!/usr/bin/env node
import { inspectCapture, redactCapture, replayCapture, validateCapture } from '../packages/core/src/runtime-v023.mjs';
const [command,input,output,...flags]=process.argv.slice(2);
const usage='Usage: capture-tool <inspect|validate|replay> <capture-dir> [--json]\n       capture-tool redact <input-dir> <output-dir>';
if(!command||!input||(command==='redact'&&!output)){console.error(usage);process.exitCode=2}else try{
  const result=command==='inspect'?await inspectCapture(input):command==='validate'?await validateCapture(input):command==='replay'?await replayCapture(input):command==='redact'?await redactCapture(input,output):null;
  if(!result)throw new Error(`Unknown command: ${command}`);
  if(command==='validate'&&!flags.includes('--json'))console.log(`${result.status}\n${[...result.errors,...result.warnings].map(x=>`- ${x}`).join('\n')}`);else console.log(JSON.stringify(result,null,2));
  if(command==='validate'&&result.status==='FAIL')process.exitCode=1;
}catch(error){console.error(`${error.message}\n${usage}`);process.exitCode=1}
