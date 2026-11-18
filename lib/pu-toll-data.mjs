export const puKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function readPuFeatures(data,type){
 if(data?.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('Invalid PU FeatureCollection');
 if(data.crs&&!['EPSG:4326','urn:ogc:def:crs:OGC:1.3:CRS84','urn:ogc:def:crs:EPSG::4326'].includes(data.crs.properties?.name))throw Error('Unsupported PU CRS');
 const ids=new Set();
 for(const f of data.features){
  if(!f.properties||!(type==='Point'?['Point']:['LineString','MultiLineString']).includes(f.geometry?.type))throw Error('Unexpected PU geometry');
  const id=f.id??f.properties.objectid;if(id==null||ids.has(id))throw Error('Missing or duplicate PU identifier');ids.add(id);
  const positions=type==='Point'?[f.geometry.coordinates]:f.geometry.type==='LineString'?f.geometry.coordinates:f.geometry.coordinates.flat();
  if(!positions.length||positions.some(p=>!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<94||p[0]>142||p[1]<-12||p[1]>7))throw Error('Invalid PU longitude/latitude');
 }
 return data.features.filter(f=>f.properties.status==='Operasi');
}

export const PUBLIC_GATE_SOURCE='https://sigi.pu.go.id/serverpu/rest/services/Hosted/Gerbang_Tol_(all)_Point/FeatureServer/0';
export function mapTangerangMerakGates(data,tariffs){
 const aliases={'GT CIKUPA':'Cikupa','GT CIKUPA 2':'Cikupa','GT CIKUPA 3':'Cikupa','GT BALARAJA TIMUR':'Balaraja Timur','GT BALARAJA BARAT':'Balaraja Barat','GT CIKANDE':'Cikande','GT CIUJUNG':'Ciujung','GT SERANG TIMUR':'Serang Timur','GT SERANG BARAT':'Serang Barat','GT CILEGON TIMUR':'Cilegon Timur','GT CILEGON BARAT':'Cilegon Barat','GT CILEGON BARAT 1':'Cilegon Barat','GT MERAK':'Merak'};
 const tariffNames=new Set(tariffs.filter(r=>r.road==='Tangerang-Merak').flatMap(r=>[r.origin,r.destination]));
 if(!tariffNames.size)throw Error('Tangerang–Merak tariffs unavailable');
 const gates=[],unmapped=[];
 for(const f of readPuFeatures(data,'Point')){
  if(f.properties.ruas!=='Tangerang - Merak')throw Error('Unexpected public gate corridor');
  const name=f.properties.nama,tariffName=aliases[name];
  if(!tariffName||!tariffNames.has(tariffName)){unmapped.push({id:f.id,name});continue;}
  gates.push({id:`pu-public-${f.id}`,name,tariffName,system:'tangerang-merak',lon:f.geometry.coordinates[0],lat:f.geometry.coordinates[1],source:PUBLIC_GATE_SOURCE});
 }
 return {gates,unmapped};
}
