import {operatorName} from './operator-catalog.mjs';
const headers=['Waktu transaksi','Operator','Gerbang masuk','Gerbang keluar','Ruas tol','Golongan','Bank','Tarif (Rp)','Saldo saat transaksi (Rp)'];
export function exportTable(rows){return [headers,...rows.map(r=>[r.dateTime,operatorName(r.operator),r.entry||'',r.exit||'',r.road||'',String(r.vehicleClass??''),r.bank||'',r.fare??'',r.balance??''])];}
// Quote every CSV cell, and neutralize formulas in operator-provided text.
export function csvText(rows){return '\uFEFF'+exportTable(rows).map(row=>row.map(value=>{
 let text=String(value??'');if(typeof value!=='number'&&/^[\s]*[=+@-]/.test(text))text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}).join(',')).join('\r\n')+'\r\n';}
const encoder=new TextEncoder();
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function concat(parts){const result=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){result.set(p,offset);offset+=p.length;}return result;}
// Small uncompressed ZIP writer for the five fixed OOXML parts; no user filenames.
function zip(files){const local=[],central=[];let offset=0;
 for(const [name,text] of Object.entries(files)){
  const path=encoder.encode(name),data=encoder.encode(text),crc=crc32(data);
  const header=new Uint8Array(30+path.length),h=new DataView(header.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,path.length,true);header.set(path,30);
  const directory=new Uint8Array(46+path.length),d=new DataView(directory.buffer);
  d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,path.length,true);d.setUint32(42,offset,true);directory.set(path,46);
  local.push(header,data);central.push(directory);offset+=header.length+data.length;
 }
 const directory=concat(central),end=new Uint8Array(22),e=new DataView(end.buffer);
 e.setUint32(0,0x06054b50,true);e.setUint16(8,central.length,true);e.setUint16(10,central.length,true);e.setUint32(12,directory.length,true);e.setUint32(16,offset,true);
 return concat([...local,directory,end]);
}
const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function xlsxBytes(rows){
 const table=exportTable(rows);if(table.length>1048576)throw Error('Terlalu banyak transaksi untuk satu lembar Excel.');
 const sheet=table.map((row,i)=>`<row r="${i+1}">${row.map((v,j)=>{const ref=String.fromCharCode(65+j)+(i+1);return typeof v==='number'&&Number.isFinite(v)?`<c r="${ref}"><v>${v}</v></c>`:`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;}).join('')}</row>`).join('');
 return zip({
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':'<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Transaksi tol" sheetId="1" r:id="rId1"/></sheets></workbook>',
 'xl/_rels/workbook.xml.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
 'xl/worksheets/sheet1.xml':`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="7" width="24" customWidth="1"/><col min="8" max="9" width="22" customWidth="1"/></cols><sheetData>${sheet}</sheetData><autoFilter ref="A1:I${table.length}"/></worksheet>`
 });
}
export function saveSpreadsheet(rows,format){
 if(!rows.length)throw Error('Pilih transaksi yang ingin diunduh.');
 if(!['csv','xlsx'].includes(format))throw Error('Format tidak didukung.');
 const blob=new Blob([format==='csv'?csvText(rows):xlsxBytes(rows)],{type:format==='csv'?'text/csv;charset=utf-8':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`JejakTol-transaksi.${format}`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
