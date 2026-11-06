// Ordered from the public operator interfaces; JLB uses the available receipt fields.
export const resultColumns={
 serbaraja:[['dateTime','Waktu transaksi'],['entry','Gerbang masuk'],['exit','Gerbang keluar'],['vehicleClass','Golongan'],['bank','Bank'],['fare','Tarif'],['balance','Saldo'],['receiptNo','No. Resi']],
 jtd:[['receiptNo','No. Resi'],['exit','Gerbang'],['booth','Gardu'],['balance','Saldo'],['fare','Tarif'],['dateTime','Waktu transaksi']],
 bsd:[['dateTime','Waktu transaksi'],['booth','Gardu'],['vehicleClass','Golongan'],['fare','Tarif'],['balance','Saldo']],
 makassar:[['dateTime','Waktu transaksi'],['exit','Gerbang / Gardu'],['vehicleClass','Golongan'],['fare','Tarif'],['balance','Saldo']],
 astra:[['card','Nomor kartu'],['dateTime','Waktu transaksi'],['entry','Gerbang masuk'],['exit','Gerbang keluar'],['bank','Bank'],['vehicleClass','Golongan'],['fare','Tarif'],['balance','Saldo']],
 citra:[['dateTime','Waktu transaksi'],['exit','Gerbang'],['road','Ruas'],['vehicleClass','Golongan'],['bank','Bank'],['card','Nomor kartu'],['fare','Tarif'],['balance','Saldo']],
 jlb:[['dateTime','Waktu transaksi'],['exit','Gerbang'],['vehicleClass','Golongan'],['bank','Bank'],['fare','Tarif'],['balance','Saldo'],['receiptNo','No. Resi']]
};
export function resultValue(row,key){if(key==='dateTime')return row.dateTime?.replace('T',' ')||'—';return row[key]===null||row[key]===undefined||row[key]===''?'—':row[key];}
