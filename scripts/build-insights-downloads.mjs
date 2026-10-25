import fs from 'node:fs';
import path from 'node:path';
import {deflateRawSync} from 'node:zlib';
const output=path.join('public','downloads');
fs.mkdirSync(output,{recursive:true});
const xmlEscape=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
function pdf(){
 const lines=[],emit=x=>lines.push(x);
 const str=s=>String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^ -~]/g,'');
 const text=(s,x,y,size=10,bold=false)=>emit('BT /'+(bold?'F2':'F1')+' '+size+' Tf '+x+' '+y+' Td ('+str(s)+') Tj ET');
 emit('0.118 0.153 0.165 rg 0 705 595 137 re f');
 emit('0.956 0.961 0.945 rg');
 text('HUMMIN  /  PRACTICAL GUIDES',40,797,11,true);
 text('30-day enquiry log',40,754,26);
 emit('0.71 0.325 0.173 rg 40 731 112 3 re f');
 emit('0.118 0.153 0.165 rg');
 text('Track every enquiry for 30 days. Give each one an owner and a next action.',40,674,10);
 text('Review every Friday: what is open, who owns it, and when will they reply?',40,658,9);
 emit('0.906 0.922 0.902 rg 40 614 515 26 re f');
 emit('0.118 0.153 0.165 rg');
 const columns=[['Date',43],['Source',103],['Contact',175],['Enquiry',268],['Owner',388],['Next action / due',457]];
 for(const [name,x] of columns)text(name,x,623,8,true);
 for(let row=0;row<25;row++){
  const y=614-(row+1)*18;
  if(row%2===1){emit('0.971 0.973 0.966 rg 40 '+y+' 515 18 re f');}
  emit('0.796 0.824 0.800 RG 0.4 w 40 '+y+' m 555 '+y+' l S');
  for(const [,x] of columns.slice(1))emit(x+' '+y+' m '+x+' '+(y+18)+' l S');
 }
 emit('0.71 0.325 0.173 rg');text('FRIDAY REVIEW',40,117,10,true);
 emit('0.118 0.153 0.165 rg');
 text('Enquiries: ________    Replied to: ________    Still open: ________',40,97,9);
 text('One improvement for next week: __________________________________________',40,78,9);
 text('HUMMIN  |  Embedded advisory and execution  |  hummin.org',40,42,8);
 const content=Buffer.from(lines.join('\n')+'\n','latin1');
 const objects=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  '<< /Length '+content.length+' >>\nstream\n'+content.toString('latin1')+'endstream'
 ];
 let out='%PDF-1.4\n',offsets=[0];
 for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(out,'latin1'));out+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}
 const xref=Buffer.byteLength(out,'latin1');out+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
 for(const p of offsets.slice(1))out+=String(p).padStart(10,'0')+' 00000 n \n';
 out+='trailer\n<< /Root 1 0 R /Size '+(objects.length+1)+' >>\nstartxref\n'+xref+'\n%%EOF\n';
 fs.writeFileSync(path.join(output,'enquiry-log.pdf'),Buffer.from(out,'latin1'));
}
const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zip(files){
 const locals=[],centers=[];let offset=0;
 for(const [name,source] of Object.entries(files)){
  const nameBytes=Buffer.from(name),raw=Buffer.from(source,'utf8'),compressed=deflateRawSync(raw),crc=crc32(raw);
  const l=Buffer.alloc(30+nameBytes.length);l.writeUInt32LE(0x04034b50,0);l.writeUInt16LE(20,4);l.writeUInt16LE(8,6);l.writeUInt16LE(8,8);l.writeUInt32LE(crc,14);l.writeUInt32LE(compressed.length,18);l.writeUInt32LE(raw.length,22);l.writeUInt16LE(nameBytes.length,26);nameBytes.copy(l,30);
  locals.push(l,compressed);
  const c=Buffer.alloc(46+nameBytes.length);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(8,8);c.writeUInt16LE(8,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(compressed.length,20);c.writeUInt32LE(raw.length,24);c.writeUInt16LE(nameBytes.length,28);c.writeUInt32LE(offset,42);nameBytes.copy(c,46);centers.push(c);
  offset+=l.length+compressed.length;
 }
 const center=Buffer.concat(centers);
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(centers.length,8);end.writeUInt16LE(centers.length,10);end.writeUInt32LE(center.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...locals,center,end]);
}
function excel(){
 const headers=['Week starting','Sales (KES)','New enquiries','Cash in bank (KES)','Overdue >30 days (KES)','Bottleneck count','Action / owner'];
 const cell=(column,row,value,style=0)=>{
  const ref=String.fromCharCode(65+column)+row;
  if(value===null)return '<c r="'+ref+'" s="'+style+'"/>';
  if(typeof value==='number')return '<c r="'+ref+'" s="'+style+'"><v>'+value+'</v></c>';
  return '<c r="'+ref+'" t="inlineStr" s="'+style+'"><is><t>'+xmlEscape(value)+'</t></is></c>';
 };
 let rows='<row r="1" ht="34" customHeight="1">'+cell(0,1,'HUMMIN  |  MONDAY FIGURES',1)+'</row>';
 rows+='<row r="2">'+cell(0,2,'Five figures, ten minutes. Record one row every Monday for 12 weeks.')+'</row>';
 rows+='<row r="4" ht="36" customHeight="1">'+headers.map((h,i)=>cell(i,4,h,2)).join('')+'</row>';
 for(let r=5;r<=16;r++)rows+='<row r="'+r+'" ht="25" customHeight="1">'+headers.map((_,i)=>cell(i,r,null,i===1||i===3||i===4?3:0)).join('')+'</row>';
 rows+='<row r="18">'+cell(0,18,'Review questions:')+cell(1,18,'What changed?')+cell(2,18,'What do we do?')+'</row>';
 rows+='<row r="19">'+cell(0,19,'Collect by Monday 10:00. Agree one action each week.')+'</row>';
 const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:G19"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="19" customWidth="1"/><col min="2" max="2" width="18" customWidth="1"/><col min="3" max="3" width="20" customWidth="1"/><col min="4" max="4" width="23" customWidth="1"/><col min="5" max="5" width="25" customWidth="1"/><col min="6" max="6" width="20" customWidth="1"/><col min="7" max="7" width="37" customWidth="1"/></cols><sheetData>'+rows+'</sheetData></worksheet>';
 const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font><font><b/><sz val="10"/><color rgb="FF1E272A"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E272A"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE7EBE6"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>';
 const types='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
 const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Monday Figures" sheetId="1" r:id="rId1"/></sheets></workbook>';
 const bookrels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
 fs.writeFileSync(path.join(output,'monday-figures.xlsx'),zip({'[Content_Types].xml':types,'_rels/.rels':rels,'xl/workbook.xml':workbook,'xl/_rels/workbook.xml.rels':bookrels,'xl/worksheets/sheet1.xml':sheet,'xl/styles.xml':styles}));
}
pdf();excel();
console.log('Generated HUMMIN enquiry log PDF and Monday figures XLSX');
