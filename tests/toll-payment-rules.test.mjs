import {test} from 'node:test';import assert from 'node:assert/strict';
import {priceTollSection} from '../lib/toll-network.mjs';
import {tariffGateName} from '../lib/tariff-gate-name.mjs';
import data from '../data/pu-toll-network.json' with {type:'json'};
const row=(origin,destination,fare,road='Surabaya-Mojokerto')=>({road,origin,destination,fares:[fare]});
const point=name=>{const g=data.gates.find(g=>g.name===name);assert.ok(g,name);return {latitude:g.lat,longitude:g.lon};};
const price=(names,rows,points)=>priceTollSection(names,rows,points,{startPointIndex:0,endPointIndex:points.length-1});
test('Warugunung aliases retain the closed tariff endpoint',()=>{
 for(const name of ['WRR / Warugunung','WRR/Warugunung (Tertutup)','WRR/Warugunung'])assert.equal(tariffGateName(name),'WRR/Warugunung');
 assert.notEqual(tariffGateName('Waru (Terbuka)'),tariffGateName('WRR/Warugunung'));
});
test('Sumo charges open plus closed sections in both directions only when crossing Warugunung',()=>{
 const rows=[row('Waru (Terbuka)','WRR/Warugunung',8500),row('WRR/Warugunung (Tertutup)','Mojokerto',35000),row('Mojokerto','WRR / Warugunung',35000)];
 const points=[{latitude:-7.43,longitude:112.45},point('GT WARUGUNUNG'),point('GT WARU 5')];
 assert.equal(price(['Kertosono Mojokerto','Surabaya Mojokerto'],rows,points)[1].fare,43500);
 assert.equal(price(['Surabaya Mojokerto','Kertosono Mojokerto'],rows,[...points].reverse())[0].fare,43500);
 assert.equal(price(['Kertosono Mojokerto','Surabaya Mojokerto'],rows,[points[0],points[2]])[1].fare,null);
 assert.equal(price(['Kertosono Mojokerto','Surabaya Mojokerto'],rows.slice(1),points)[1].fare,null);
 const closed=[points[0],points[1]];assert.equal(price(['Kertosono Mojokerto','Surabaya Mojokerto'],rows,closed)[1].fare,35000);
});
test('Serbaraja prices traversed zones in both directions without enabling Industri',()=>{
 const road='Serpong-Balaraja Seksi 1 (Serpong-SS Legok)',rows=[row('Serpong','SS CBD',6000,road),row('SS CBD','SS Legok',7000,road)];
 const cbd=point('GT CBD 1'),legok=point('GT LEGOK'),serpong={latitude:-6.32,longitude:106.69};
 assert.equal(price(['Serbaraja','Jakarta Serpong'],rows,[cbd,serpong])[0].fare,6000);
 assert.equal(price(['Jakarta Serpong','Serbaraja'],rows,[serpong,cbd])[1].fare,6000);
 assert.equal(price(['Serbaraja'],rows,[cbd,legok])[0].fare,7000);
 assert.equal(price(['Serbaraja'],rows,[legok,cbd])[0].fare,7000);
 assert.equal(price(['Serbaraja','Jakarta Serpong'],rows,[legok,cbd,serpong])[0].fare,13000);
 assert.equal(price(['Jakarta Serpong','Serbaraja'],rows,[serpong,cbd,legok])[1].fare,13000);
 assert.equal(price(['Serbaraja','Jakarta Serpong'],rows.slice(0,1),[legok,cbd,serpong])[0].fare,null);
 assert.ok(!data.gates.some(g=>g.name==='GT INDUSTRI'));
 assert.ok(data.gates.filter(g=>g.system==='serbaraja').every(g=>g.originalStatus==='Konstruksi'&&g.statusSource));
});
