from pathlib import Path
from copy import deepcopy
from zipfile import ZipFile
from lxml import etree as E
from docx import Document
from docx.shared import Pt,RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import re,json
from chapter_data import CONTENT,TABLES,GROUPS,NOTES,LEARN_STEPS
R=Path(__file__).resolve().parent;SOURCE=R/'source-drive.docx';OUT=R/'LUANVAN_updated.docx'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';N={'w':W}
def q(s):return '{'+W+'}'+s
def text(p):return ''.join(x.text or '' for x in p.iter(q('t')))
evidence=json.loads((R/'test-evidence.json').read_text(encoding='utf-8'))
assert evidence['total_tests']==sum(len(g[3]) for g in GROUPS)==66
assert len(GROUPS)==evidence['file_count']==8
assert evidence['passed_tests']==66 and evidence['failed_tests']==0
for prefix,title,file,cases in GROUPS:
 observed=next(f for f in evidence['files'] if f['file']==file)
 assert observed['count']==len(cases) and all(c['status']=='passed' for c in observed['cases'])
doc=Document(SOURCE);templates={}
for p in doc.paragraphs:
 if p.style.name in ('Heading 1','Heading 2','Heading 3') and p.style.name not in templates:templates[p.style.name]=deepcopy(p._p.pPr)
templates['normal']=deepcopy(next(p._p.pPr for p in reversed(doc.paragraphs) if p.text and p.style.name=='normal'))
entries=[];captions=[];bookmark_id=15000;tn=0
def runstyle(run,size=13,bold=False,italic=False):
 run.font.name='Times New Roman';run.font.size=Pt(size);run.bold=bold;run.italic=italic;run.font.color.rgb=RGBColor(0,0,0)
 fonts=run._r.get_or_add_rPr().find(qn('w:rFonts'))
 for k in ('ascii','hAnsi','cs','eastAsia'):fonts.set(qn('w:'+k),'Times New Roman')
def bookmark(p,prefix):
 global bookmark_id
 bookmark_id+=1;name=f'nc_ch4_{prefix}_{bookmark_id}'
 s=OxmlElement('w:bookmarkStart');s.set(qn('w:id'),str(bookmark_id));s.set(qn('w:name'),name)
 e=OxmlElement('w:bookmarkEnd');e.set(qn('w:id'),str(bookmark_id));p._p.insert(1,s);p._p.append(e)
 return name
def para(s,kind='p',keep=False):
 sty={'h1':'Heading 1','h2':'Heading 2','h3':'Heading 3'}.get(kind,'normal');p=doc.add_paragraph(style=sty)
 p._p.remove(p._p.pPr);p._p.insert(0,deepcopy(templates[sty]));pf=p.paragraph_format;pf.widow_control=True
 if kind=='p':
  p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY;pf.space_after=Pt(6);pf.line_spacing=1.2;pf.keep_with_next=keep
 else:
  pf.keep_with_next=True;pf.page_break_before=kind=='h1' or (kind=='h2' and s.startswith(('4.2 ','4.3 ','4.4 ','4.5 ','4.6 '))) or s.startswith('4.4.8 ')
  if kind=='h1':p.alignment=WD_ALIGN_PARAGRAPH.CENTER
 runstyle(p.add_run(s),16 if kind=='h1' else 14 if kind=='h2' else 13,kind!='p')
 if kind!='p':entries.append({'text':s,'level':int(kind[-1]),'anchor':bookmark(p,'h')})
 return p
def table(title,headers,rows,widths=None):
 global tn
 tn+=1;p=doc.add_paragraph(style='normal');p.alignment=WD_ALIGN_PARAGRAPH.CENTER;pf=p.paragraph_format
 pf.space_before=Pt(5);pf.space_after=Pt(6);pf.keep_together=True;pf.keep_with_next=True
 label=f'Bảng 4.{tn} {title}';runstyle(p.add_run(label),12,italic=True)
 captions.append({'text':label,'kind':'table','anchor':bookmark(p,'caption')})
 if widths is None:widths=[155,292] if len(headers)==2 else [225,120,102] if len(headers)==3 else [72,153,180,42]
 t=doc.add_table(rows=1,cols=len(headers));t.autofit=False
 for c,w in zip(t.columns,widths):c.width=Pt(w)
 borders=OxmlElement('w:tblBorders')
 for side in ('top','left','bottom','right','insideH','insideV'):
  e=OxmlElement('w:'+side);e.set(qn('w:val'),'single');e.set(qn('w:sz'),'4');e.set(qn('w:color'),'888888');borders.append(e)
 t._tbl.tblPr.append(borders)
 def fill(row,values,header=False):
  for c,s,w in zip(row.cells,values,widths):
   c.width=Pt(w);p=c.paragraphs[0];pf=p.paragraph_format;pf.space_before=Pt(3);pf.space_after=Pt(3);pf.line_spacing=1.06
   pf.keep_with_next=header;p.alignment=WD_ALIGN_PARAGRAPH.LEFT;runstyle(p.add_run(str(s)),11.5,header)
   if header:
    sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'EEEEEE');c._tc.get_or_add_tcPr().append(sh)
  rp=row._tr.get_or_add_trPr();rp.append(OxmlElement('w:cantSplit'))
  if header:rp.append(OxmlElement('w:tblHeader'))
 fill(t.rows[0],headers,True)
 for row in rows:fill(t.add_row(),row)
 if title=='Độ bao phủ mã nguồn phía máy chủ':
  for row in t.rows[:-1]:
   for c in row.cells:
    for p in c.paragraphs:p.paragraph_format.keep_with_next=True
for block in CONTENT.strip().split('\n\n'):
 block=block.strip()
 if block.startswith('### '):para(block[4:],'h3')
 elif block.startswith('## '):para(block[3:],'h2')
 elif block.startswith('# '):para(block[2:],'h1')
 elif block.startswith('@table '):
  key=block.split()[1];title,headers,rows=TABLES[key];table(title,headers,rows)
 elif block=='@cases':
  for i,(prefix,title,file,cases) in enumerate(GROUPS,1):
   para(f'4.4.{i} {title}','h3');para('Tệp kiểm thử đối chiếu: '+file+'.',keep=True)
   rows=[(f'{prefix}-{j:02}',action,expected,'Đạt') for j,(action,expected) in enumerate(cases,1)]
   table('Kết quả kiểm thử '+title.lower(),['Mã','Dữ liệu và thao tác','Kết quả mong đợi','Kết quả'],rows)
   para(NOTES[prefix])
   if prefix=='LEARN':
    para('Diễn biến của tình huống LEARN-03 được tách thành các bước dưới đây để làm rõ điều kiện học tuần tự. Sáu dòng trong bảng cùng thuộc một tình huống đã chạy, không làm tăng tổng số tình huống của bộ kiểm thử.',keep=True)
    table('Các bước kiểm tra học tuần tự trong LEARN-03',['Dữ liệu và thao tác','Kết quả được đối chiếu'],LEARN_STEPS,[225,222])
 else:para(block)
doc.save(R/'chapter-build.docx')
with ZipFile(SOURCE) as src,ZipFile(R/'chapter-build.docx') as built:
 raw=src.read('word/document.xml');root=E.fromstring(raw)
 def serial(el):
  b=E.tostring(el,encoding='utf-8')
  def decl(m):
   prefix=m.group(1).decode() if m.group(1) else None
   return b'' if root.nsmap.get(prefix)==m.group(2).decode() else m.group()
  return re.sub(rb' xmlns(?::([A-Za-z0-9_]+))?="([^"]*)"',decl,b)
 body=E.fromstring(built.read('word/document.xml')).find('w:body',N)
 i=next(i for i,p in enumerate(body) if text(p)=='CHƯƠNG 4 KIỂM THỬ VÀ ĐÁNH GIÁ')
 inserted=b''.join(serial(x) for x in list(body)[i:] if x.tag!=q('sectPr'))
 pos=raw.rfind(b'<w:sectPr');raw=raw[:pos]+inserted+raw[pos:];E.fromstring(raw)
 with ZipFile(OUT,'w') as out:
  for info in src.infolist():out.writestr(info,raw if info.filename=='word/document.xml' else src.read(info.filename))
(R/'chapter-structure.json').write_text(json.dumps({'headings':entries,'captions':captions},ensure_ascii=False,indent=2),encoding='utf-8')
print('Appended chapter:',len(entries),'headings;',tn,'tables; 66 verified cases')
