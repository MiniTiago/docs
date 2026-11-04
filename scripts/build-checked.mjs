import { spawn } from 'node:child_process';
import { root } from './context.mjs';
const args=process.argv.slice(2);
const buildArgs=[];
for(let i=0;i<args.length;i++) if(args[i]==='--sdk') buildArgs.push('--sdk',args[++i]);
const run=(script,argv)=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[script,...argv],{cwd:root,env:process.env,stdio:'inherit'});
  child.once('error',reject); child.once('exit',code=>resolve(code));
});
const compatibility=await run('compatibility/run.mjs',args);
if(compatibility!==0) console.warn('Some compatibility checks are unavailable or failed. The docs will display those results.');
const build=await run('scripts/build.mjs',buildArgs);
process.exitCode=build===0?0:1;
