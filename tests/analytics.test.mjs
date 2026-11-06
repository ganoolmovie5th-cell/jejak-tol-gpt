import test from 'node:test';
import assert from 'node:assert/strict';
import {trackEvent} from '../lib/analytics.mjs';
test('analytics only forwards allowlisted event names without private data', () => {
  const target = {};
  trackEvent('toll_search_success', target);
  trackEvent('toll_pdf_download', target);
  trackEvent('unexpected_private_value', target);
  assert.deepEqual(target.dataLayer.map(args=>Array.from(args)), [['event','toll_search_success',{send_to:'G-YVM1Z7BV1F'}], ['event','toll_pdf_download',{send_to:'G-YVM1Z7BV1F'}]]);
});
test('blocked analytics never breaks application actions', () => {
  assert.doesNotThrow(() => trackEvent('toll_search_success', {dataLayer:{push(){throw Error('blocked');}}}));
});
