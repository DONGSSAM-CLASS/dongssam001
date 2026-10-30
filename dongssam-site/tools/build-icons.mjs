import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const here=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.resolve(here,'../public');
const html=fs.readFileSync(path.join(publicDir,'index.html'),'utf8');
const app=fs.readFileSync(path.join(publicDir,'app.js'),'utf8');
const projects=vm.runInNewContext(fs.readFileSync(path.join(publicDir,'projects.js'),'utf8')+';PROJECTS',{}, {timeout:1000});
const names=new Set([...html.matchAll(/data-lucide="([a-z0-9-]+)"/g),...app.matchAll(/data-lucide="([a-z0-9-]+)"/g)].map(m=>m[1]));
projects.forEach(p=>names.add(p.icon));
const icons=[...names].sort().map(n=>n.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(''));
await build({stdin:{contents:`import {createIcons,${icons.join(',')}} from 'lucide';const icons={${icons.join(',')}};window.lucide={createIcons:()=>createIcons({icons})};`,resolveDir:here},bundle:true,minify:true,format:'iife',target:['es2020'],outfile:path.join(publicDir,'assets/lucide.min.js'),legalComments:'inline'});
console.log(`Built ${icons.length} icons used by the homepage.`);
