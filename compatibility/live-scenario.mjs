// All SDK traffic goes directly to the exchange's mainnet defaults.
export const liveCheckIds = importId => [importId,'rest','websocket','cleanup'];
export function completeLiveResult(checks, importId='import') {
  return Array.isArray(checks) && checks.every(c=>c.status==='passed')
    && liveCheckIds(importId).every(id=>checks.some(c=>c.id===id));
}
export function positivePrice(value) { return value!==undefined && value!==null && Number.isFinite(Number(value)) && Number(value)>0; }
export async function liveScenario({loadSdk,adapter,onCheck,importCheck='import'}) {
  const checks=[];
  const check=async(id,fn)=>{
    const started=Date.now();
    try {checks.push({id,status:'passed',...await fn(),elapsedMs:Date.now()-started});}
    catch(error){checks.push({id,status:'failed',detail:String(error?.message||error).slice(0,1500),code:error?.code,httpStatus:error?.response?.status,elapsedMs:Date.now()-started});}
    onCheck?.([...checks]);
  };
  let sdk;
  await check(importCheck,async()=>{sdk=await loadSdk();if(typeof sdk.WebsocketClient!=='function')throw Error('WebsocketClient export missing');});
  if(!sdk)return checks;
  await check('rest',async()=>{
    const price=await adapter.read(adapter.client(sdk));
    if(!positivePrice(price))throw Error('Exchange did not return a positive market price');
    return {price:String(price),operation:adapter.operations.rest,observedAt:new Date().toISOString()};
  });
  let ws;
  try {
    await check('websocket',async()=>{
      let settle,timer,lastError;
      const message=new Promise((resolve,reject)=>{settle=resolve;timer=setTimeout(()=>reject(Error('No live market update within 25 seconds'+(lastError?': '+lastError:''))),25000);});
      const logger=Object.fromEntries(['trace','debug','info','warn','error'].map(k=>[k,()=>{}]));
      try {
        ws=adapter.stream(sdk,logger);
        ws.on('exception',error=>{lastError=error?.message||String(error);});
        ws.on(adapter.event,event=>{const price=adapter.value(event);if(positivePrice(price))settle({price:String(price),operation:adapter.operations.websocket,observedAt:new Date().toISOString()});});
        // Subscription promises may wait for a server acknowledgement. Bound the
        // entire operation with the live-update deadline, even if it is rejected.
        Promise.resolve(adapter.subscribe(ws)).catch(error=>{lastError=error?.message||String(error);});
        return await message;
      }finally{clearTimeout(timer);}
    });
  } finally {
    await check('cleanup',async()=>{if(!ws)throw Error('No WebSocket client was created');ws.closeAll();});
  }
  return checks;
}
