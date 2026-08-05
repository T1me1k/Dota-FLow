import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'apps/desktop/dist');
const html=await readFile(resolve(dist,'index.html'),'utf8');
const initialUrls=new Set([
  ...[...html.matchAll(/<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+\.js)["'][^>]*>/gi)].map(match=>match[1]),
  ...[...html.matchAll(/<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+\.js)["'][^>]*>/gi)].map(match=>match[1])
]);

if(initialUrls.size===0)throw new Error('Renderer bundle budget: no initial JavaScript assets were found in dist/index.html');

const limitBytes=500*1024;
const assets=[];
for(const url of initialUrls){
  const relative=url.replace(/^\/+/, '').replace(/^\.\//,'');
  const file=resolve(dist,relative);
  const info=await stat(file);
  assets.push({url,bytes:info.size});
}
assets.sort((a,b)=>b.bytes-a.bytes);

for(const asset of assets)console.log(`[renderer bundle] ${asset.url}: ${(asset.bytes/1024).toFixed(1)} KiB`);
const oversized=assets.filter(asset=>asset.bytes>limitBytes);
if(oversized.length){
  throw new Error(`Renderer bundle budget exceeded: ${oversized.map(asset=>`${asset.url} ${(asset.bytes/1024).toFixed(1)} KiB`).join(', ')}; limit is 500.0 KiB per initial asset.`);
}

const lazyMock=[...html.matchAll(/(?:src|href)=["']([^"']*mock-provider[^"']*)["']/gi)];
if(lazyMock.length)throw new Error('Renderer bundle budget: the mock provider was referenced by the initial HTML instead of remaining lazy.');

console.log(`[renderer bundle] PASS: ${assets.length} initial asset(s), largest ${(assets[0].bytes/1024).toFixed(1)} KiB.`);
