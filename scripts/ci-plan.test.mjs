import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeploy } from './ci-plan.mjs';
const main = { repository: 'sieblyio/docs', ref: 'refs/heads/main' };
test('only push and manual runs on this repository main branch can deploy', () => {
  for (const eventName of ['push', 'workflow_dispatch']) assert.equal(canDeploy({ ...main, eventName }), true);
  for (const context of [
    { ...main, eventName: 'pull_request' },
    { ...main, eventName: 'pull_request_target' },
    { ...main, eventName: 'workflow_run' },
    { ...main, eventName: 'schedule' },
    { ...main, eventName: 'push', repository: 'someone/docs' },
    { ...main, eventName: 'workflow_dispatch', ref: 'refs/heads/feature' },
    { ...main, eventName: 'workflow_dispatch', ref: 'refs/tags/release' },
  ]) assert.equal(canDeploy(context), false);
});
