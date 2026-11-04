// POC-only Android tooling. No global installs, shell profile edits or SDK checkout writes.
import path from 'node:path';
import {mkdir,readFile,writeFile,rename,rm,readdir,access} from 'node:fs/promises';
import {createWriteStream,createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {root} from '../scripts/context.mjs';

if(!process.argv.includes('--accept-license'))throw Error('Explicit approval of the Android SDK license is required. Pass --accept-license after approval.');
if(!process.env.COMPAT_WORK_ROOT)throw Error('Set COMPAT_WORK_ROOT on a volume with room for the Android emulator.');
if(process.platform!=='darwin'||process.arch!=='arm64')throw Error('This POC installer targets Apple Silicon macOS.');
const directory=path.join(path.resolve(process.env.COMPAT_WORK_ROOT),'android');
const sdk=path.join(directory,'sdk');
const downloads=path.join(directory,'downloads');
await mkdir(downloads,{recursive:true});
await mkdir(sdk,{recursive:true});
async function command(file,args,{env={},input,log}={}) {
  console.log(`Running ${path.basename(file)} ${args.join(' ')}`);
  return new Promise((resolve,reject)=>{
    const child=spawn(file,args,{cwd:directory,env:{...process.env,...env},stdio:['pipe','pipe','pipe']});
    const chunks=[];const output=log?createWriteStream(path.join(directory,log)):null;
    child.stdout.on('data',d=>{chunks.push(d);output?.write(d);});
    child.stderr.on('data',d=>{chunks.push(d);output?.write(d);});
    child.once('error',reject);
    child.once('close',code=>{output?.end();const text=Buffer.concat(chunks).toString();code===0?resolve(text):reject(Error(`${path.basename(file)} failed (${code}): ${text.slice(-3000)}`));});
    child.stdin.end(input||'');
  });
}
async function exists(file){try{await access(file);return true;}catch{return false;}}
async function download(url,name,algorithm,expected) {
  const file=path.join(downloads,name);
  if(!await exists(file)) {
    console.log(`Downloading ${name}`);
    const response=await fetch(url);if(!response.ok)throw Error(`Download failed: HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body),createWriteStream(file));
  }
  // Vendor checksums verify downloaded bytes; a matching package name alone
  // cannot detect a corrupt or substituted archive.
  const hash=createHash(algorithm);for await(const chunk of createReadStream(file))hash.update(chunk);
  if(hash.digest('hex')!==expected)throw Error(`Vendor checksum mismatch for ${name}`);
  return file;
}
const downloadsPlan=JSON.parse(await readFile(path.join(root,'compatibility/android-downloads.json')));
const java=downloadsPlan.java;
const javaArchive=await download(java.url,java.name,'sha256',java.sha256);
const javaRoot=path.join(directory,'jdk');await mkdir(javaRoot,{recursive:true});
if(!(await readdir(javaRoot)).length)await command('tar',['-xzf',javaArchive,'-C',javaRoot]);
const javaHome=path.join(javaRoot,(await readdir(javaRoot)).find(n=>n.startsWith('jdk-')),'Contents/Home');
const cli=downloadsPlan.commandLineTools;
const cliArchive=await download(cli.url,path.basename(cli.url),'sha1',cli.sha1);
const cliRoot=path.join(sdk,'cmdline-tools/latest');
if(!await exists(cliRoot)) {
  const stage=path.join(directory,'cli-stage');await mkdir(stage,{recursive:true});
  await command('unzip',['-q',cliArchive,'-d',stage]);
  await mkdir(path.dirname(cliRoot),{recursive:true});
  await rename(path.join(stage,'cmdline-tools'),cliRoot);await rm(stage,{recursive:true,force:true});
}
const env={JAVA_HOME:javaHome,ANDROID_HOME:sdk,ANDROID_SDK_ROOT:sdk,ANDROID_USER_HOME:path.join(directory,'user'),ANDROID_AVD_HOME:path.join(directory,'avd'),TMPDIR:path.join(directory,'temp')};
for(const dir of [env.ANDROID_USER_HOME,env.ANDROID_AVD_HOME,env.TMPDIR])await mkdir(dir,{recursive:true});
const manager=path.join(cliRoot,'bin/android');
await command(manager,['--no-metrics',`--sdk=${sdk}`,'sdk','install','platform-tools','emulator','system-images;android-35;default;arm64-v8a'],{env,input:'y\n'.repeat(5),log:'sdk-install.log'});
const name='siebly-sdk-poc';
if(!await exists(path.join(env.ANDROID_AVD_HOME,name+'.ini')))await command(path.join(cliRoot,'bin/avdmanager'),['create','avd','--name',name,'--package','system-images;android-35;default;arm64-v8a','--device','pixel_6','--path',path.join(env.ANDROID_AVD_HOME,name+'.avd')],{env,input:'no\n',log:'avd-create.log'});
const info={directory,sdk,javaHome,env,avd:name,emulator:path.join(sdk,'emulator/emulator'),adb:path.join(sdk,'platform-tools/adb')};
info.emulatorVersion=await command(info.emulator,['-version'],{env});
info.acceleration=await command(info.emulator,['-accel-check'],{env});
await writeFile(path.join(directory,'installation.json'),JSON.stringify(info,null,2)+'\n');
console.log(`Android tooling ready: ${directory}`);
