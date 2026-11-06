import test from 'node:test';
import assert from 'node:assert/strict';
import {csvText,xlsxBytes,exportTable} from '../lib/transaction-export.mjs';
const row={dateTime:'2026-11-05 12:34:56',operator:'astra',entry:'=HYPERLINK("https://example.com")',exit:'Gerbang, "Timur"\nBaru',fare:12000,balance:0,card:'0145000000000001'};
test('CSV quotes multiline text, blocks formulas, preserves zero and omits card numbers',()=>{
 const csv=csvText([row]);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=HYPERLINK(""https://example.com"")"'));assert.ok(csv.includes('"Gerbang, ""Timur""\nBaru"'));assert.ok(csv.includes('"12000","0"'));assert.ok(!csv.includes(row.card));assert.equal(exportTable([row]).length,2);
});
test('Excel uses real OOXML ZIP and encodes untrusted text as strings rather than formulas',()=>{
 const bytes=xlsxBytes([row]);assert.deepEqual([...bytes.slice(0,4)],[80,75,3,4]);const text=new TextDecoder().decode(bytes);assert.ok(text.includes('t="inlineStr"'));assert.ok(!text.includes('<f>'));assert.ok(text.includes('<v>12000</v>'));assert.ok(text.includes('<v>0</v>'));assert.ok(!text.includes(row.card));assert.ok(text.includes('autoFilter ref="A1:I2"'));
});
