export const operators={
 astra:{name:'Astra Tol',url:'https://www.astratol.co.id/',company:'Astra Infra',road:'Tangerang–Merak · Jombang–Mojokerto · Cikopo–Palimanan'},
 serbaraja:{name:'Serbaraja',url:'https://serbaraja.sinarmasland.com/',company:'PT Trans Bumi Serbaraja',road:'Serpong–Balaraja'},
 jtd:{name:'JTD',url:'https://jtd.co.id/',company:'Jakarta Tollroad Development',road:'Tol Dalam Kota Jakarta'},
 bsd:{name:'BSD Tol',url:'https://www.bsdtol.com/struk',company:'PT Bintaro Serpong Damai',road:'Pondok Aren 1 & Pondok Aren 2'},
 makassar:{name:'Tol Makassar',url:'https://tolmakassar.com/struk',company:'Tol Makassar',road:'Makassar'},
 citra:{name:'Citra Persada',url:'https://struk.citrapersada.net/',company:'PT Citra Persada Infrastruktur',road:'Citra Persada'},
 jlb:{name:'JLB',url:'https://strukdigital.jlbjorrw1.com/struk',company:'PT Jakarta Lingkar Baratsatu',road:'JORR W1'}
};
export const operatorName=id=>operators[id]?.name||id;
