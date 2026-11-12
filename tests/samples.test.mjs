import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { parseEthAmount } from '../samples/amount.mjs';
import { submitDonation, SEPOLIA_CHAIN_ID } from '../samples/wallet-flow.mjs';
import { createConnectionManager } from '../samples/retryable-connection.mjs';
import { createApiServer } from '../samples/api-server.mjs';
const account = '0x' + '1'.repeat(40);
function wallet({ chain = SEPOLIA_CHAIN_ID, rejectSwitch = false, changedAccount = false } = {}) {
  return { request: async ({method}) => {
    if (method === 'eth_chainId') return chain;
    if (method === 'eth_requestAccounts') return [account];
    if (method === 'eth_accounts') return [changedAccount ? '0x' + '2'.repeat(40) : account];
    if (method === 'wallet_switchEthereumChain') {
      if (rejectSwitch) throw Object.assign(new Error('Rejected'), {code:4001});
      chain = SEPOLIA_CHAIN_ID;
    }
  }};
}
test('amounts preserve wei precision and reject invalid input', () => {
  assert.equal(parseEthAmount('0.000000000000000001'),1n);
  assert.equal(parseEthAmount('1.234567890123456789'),1234567890123456789n);
  for(const invalid of ['0','-1','1e3','NaN','0.0000000000000000001',' 1',1]) {
    assert.throws(() => parseEthAmount(invalid));
  }
});
test('network switching precedes send; success requires receipt', async () => {
  const stages = [];
  const result = await submitDonation({ethereum:wallet({chain:'0x1'}),campaignId:'2',amount:'0.1',onStage:s=>stages.push(s),sendDonation:async(args)=>{
    assert.equal(args.value,'100000000000000000');
    return {wait:async()=>({status:1})};
  }});
  assert.equal(result.status,1);
  assert.deepEqual(stages,['connecting','switching','confirming','pending','success']);
});
test('rejected switch and changed account never send', async () => {
  for(const options of [{chain:'0x1',rejectSwitch:true},{changedAccount:true}]) {
    let calls=0;
    await assert.rejects(submitDonation({ethereum:wallet(options),campaignId:'2',amount:'1',sendDonation:async()=>{calls++;}}));
    assert.equal(calls,0);
  }
});
test('failed transaction receipt propagates an error', async () => {
  await assert.rejects(submitDonation({ethereum:wallet(),campaignId:'2',amount:'1',sendDonation:async()=>({wait:async()=>({status:0})})}),/did not succeed/);
});
test('connection failure clears cache and concurrent retries share one attempt', async () => {
  let calls=0;const connection={connected:true};
  const get=createConnectionManager(async()=>{calls++;if(calls===1)throw new Error('Offline');return connection;});
  await assert.rejects(get(),/Offline/);
  const results=await Promise.all([get(),get(),get()]);
  assert.equal(calls,2);assert.ok(results.every(r=>r===connection));
});
test('API validates real HTTP requests and returns consistent errors', async () => {
  const server=createApiServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=body=>fetch(base+'/api/contributions/preview',{method:'POST',headers:{'Content-Type':'application/json'},body});
  try {
    const ok=await post(JSON.stringify({campaignId:'4',amount:'0.000000000000000001'}));
    assert.equal(ok.status,200);assert.equal((await ok.json()).amountWei,'1');
    assert.equal((await post('{')).status,400);
    assert.equal((await post(JSON.stringify({campaignId:'4',amount:'-1'}))).status,400);
    assert.equal((await post(JSON.stringify({campaignId:'4',amount:'1',admin:true}))).status,400);
    assert.equal((await fetch(base+'/api/contributions/preview')).status,405);
    assert.equal((await fetch(base+'/unknown')).status,404);
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
