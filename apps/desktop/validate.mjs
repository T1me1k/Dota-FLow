import fs from 'node:fs';
const required=['src/main.tsx','src/runtime/provider.ts','src/runtime/store.tsx','src/runtime/view-models.ts','vite.config.ts','index.html'];
for(const file of required)if(!fs.existsSync(new URL(file,import.meta.url)))throw new Error(`Missing desktop source contract: ${file}`);
const provider=fs.readFileSync(new URL('src/runtime/provider.ts',import.meta.url),'utf8');
for(const name of ['DotaFlowRuntimeProvider','MockRuntimeProvider','ReplayRuntimeProvider','ElectronIpcRuntimeProvider'])if(!provider.includes(name))throw new Error(`Missing runtime provider: ${name}`);
console.log(`Desktop source contracts valid (${required.length} required files; offline validation only).`);
