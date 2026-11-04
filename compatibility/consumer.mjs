import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import * as adapter from './adapter.mjs';
import {liveScenario} from './live-scenario.mjs';
const config=JSON.parse(await readFile(new URL('./live-config.json',import.meta.url)));
const checks=await liveScenario({loadSdk:()=>import(config.packageName),adapter});
try {if(typeof createRequire(import.meta.url)(config.packageName).WebsocketClient!=='function')throw Error('Missing CommonJS export');checks.push({id:'commonjs',status:'passed'});}catch(error){checks.push({id:'commonjs',status:'failed',detail:String(error.message)});}
await writeFile(new URL('./result.json',import.meta.url),JSON.stringify(checks,null,2));
if(checks.some(c=>c.status==='failed'))process.exitCode=1;
