import {build} from 'esbuild';
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
mkdirSync('dist',{recursive:true});
await build({entryPoints:['src/app.jsx'],bundle:true,minify:true,outfile:'dist/app.js',define:{'process.env.NODE_ENV':'"production"'}});
const html=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="RaiseFlow fundraising portfolio project. Explore community-led campaigns and campaign management."><title>RaiseFlow — Ideas worth backing</title><style>${readFileSync('src/style.css','utf8')}</style></head><body><div id="root"></div><script>${readFileSync('dist/app.js','utf8').replaceAll('</script','<\\/script')}</script></body></html>`;
writeFileSync('dist/index.html',html);
