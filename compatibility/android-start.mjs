import path from 'node:path';
import {readFile,writeFile,mkdir,open,access} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {spawn} from 'node:child_process';
import {run,npm} from './process.mjs';
import {nativeVersions} from './config.mjs';

if(!process.env.COMPAT_WORK_ROOT)throw Error('Set COMPAT_WORK_ROOT to the POC runtime directory.');
const directory=path.join(path.resolve(process.env.COMPAT_WORK_ROOT),'android');
const installation=JSON.parse(await readFile(path.join(directory,'installation.json')));
const env={...installation.env,__UNSAFE_EXPO_HOME_DIRECTORY:path.join(directory,'expo-home'),EXPO_NO_TELEMETRY:'1',EXPO_NO_CACHE:'1'};
await mkdir(env.__UNSAFE_EXPO_HOME_DIRECTORY,{recursive:true});
const emulatorStatus=await run(installation.adb,['-s','emulator-5556','get-state'],{cwd:directory,env,timeout:10000});
if(emulatorStatus.code!==0) {
  const log=await open(path.join(directory,'emulator.log'),'a');
  const emulator=spawn(installation.emulator,['-avd',installation.avd,'-port','5556','-no-snapshot','-no-audio','-no-boot-anim','-gpu','auto','-memory','2048'],{cwd:directory,env:{...process.env,...env},stdio:['ignore',log.fd,log.fd],detached:true});
  emulator.unref();await log.close();
  console.log(`Started Android emulator, PID ${emulator.pid}`);
}
let booted=false;const deadline=Date.now()+150000;
while(Date.now()<deadline) {
  const state=await run(installation.adb,['-s','emulator-5556','shell','getprop','sys.boot_completed'],{cwd:directory,env,timeout:5000});
  if(state.stdout.trim()==='1'){booted=true;break;}
  await new Promise(resolve=>setTimeout(resolve,1000));
}
if(!booted)throw Error('Android did not boot before the deadline. See emulator.log.');
const tools=path.join(directory,'expo-tools');await mkdir(tools,{recursive:true});
const cli=path.join(tools,'node_modules/expo-go/dist/cli.js');
try{await access(cli);}catch{
  await writeFile(path.join(tools,'package.json'),'{"private":true}');
  await npm(['install','--ignore-scripts','--save-exact',`expo-go@${nativeVersions.expoGo}`],{cwd:tools,env:{...env,npm_config_cache:path.join(directory,'downloads/npm-cache'),npm_config_registry:'https://registry.npmjs.org'}});
}
const metadata=await run(process.execPath,[cli,'url','android','58','--json'],{cwd:directory,env,timeout:60000});
if(metadata.code!==0)throw Error(metadata.output);
const {url}=JSON.parse(metadata.stdout);
const apk=path.join(directory,'downloads/expo-go-58.apk');
try{await access(apk);}catch{
  console.log('Downloading Expo Go for SDK 58');
  const response=await fetch(url);if(!response.ok)throw Error(`Expo Go download failed: ${response.status}`);
  await pipeline(Readable.fromWeb(response.body),createWriteStream(apk));
}
const installed=await run(installation.adb,['-s','emulator-5556','install','-r',apk],{cwd:directory,env,timeout:90000,log:path.join(directory,'expo-go-install.log')});
if(installed.code!==0)throw Error(installed.output);
const version=await run(installation.adb,['-s','emulator-5556','shell','dumpsys','package','host.exp.exponent'],{cwd:directory,env,timeout:10000});
await writeFile(path.join(directory,'expo-go.json'),JSON.stringify({sdk:58,url,apk,versionName:/versionName=([^\s]+)/.exec(version.stdout)?.[1]},null,2));
console.log('Android emulator and Expo Go are ready. Device: emulator-5556');
