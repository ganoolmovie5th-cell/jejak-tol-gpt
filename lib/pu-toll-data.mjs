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
