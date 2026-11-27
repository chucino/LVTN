from pathlib import Path
from copy import deepcopy
from zipfile import ZipFile
from lxml import etree as E
from docx import Document
from docx.shared import Pt,RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image
import re,json
from chapter_data import CONTENT,TABLES,FIGURES
from data_dictionary import SCHEMAS
R=Path(__file__).resolve().parent;SOURCE=R/'source-drive.docx';OUT=R/'LUANVAN_updated.docx'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';N={'w':W}
def q(s):return '{'+W+'}'+s
def text(p):return ''.join(x.text or '' for x in p.iter(q('t')))
doc=Document(SOURCE);templates={}
for p in doc.paragraphs:
 if p.style.name in ('Heading 1','Heading 2','Heading 3') and p.style.name not in templates:templates[p.style.name]=deepcopy(p._p.pPr)
templates['normal']=deepcopy(next(p._p.pPr for p in reversed(doc.paragraphs) if p.text and p.style.name=='normal'))
entries=[];captions=[];bookmark_id=12000;tn=0;fn=0
def runstyle(run,size=13,bold=False,italic=False):
 run.font.name='Times New Roman';run.font.size=Pt(size);run.bold=bold;run.italic=italic;run.font.color.rgb=RGBColor(0,0,0)
 fonts=run._r.get_or_add_rPr().find(qn('w:rFonts'))
 for k in ('ascii','hAnsi','cs','eastAsia'):fonts.set(qn('w:'+k),'Times New Roman')
def bookmark(p,prefix):
 global bookmark_id
 bookmark_id+=1;name=f'nc_ch3_{prefix}_{bookmark_id}'
 s=OxmlElement('w:bookmarkStart');s.set(qn('w:id'),str(bookmark_id));s.set(qn('w:name'),name)
 e=OxmlElement('w:bookmarkEnd');e.set(qn('w:id'),str(bookmark_id));p._p.insert(1,s);p._p.append(e)
 return name
def para(s,kind='p',keep=False):
 sty={'h1':'Heading 1','h2':'Heading 2','h3':'Heading 3'}.get(kind,'normal')
 p=doc.add_paragraph(style=sty)
 p._p.remove(p._p.pPr);p._p.insert(0,deepcopy(templates[sty]));pf=p.paragraph_format
 pf.widow_control=True
 if kind=='p':
  p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY;pf.space_after=Pt(6);pf.line_spacing=1.2;pf.keep_with_next=keep
 else:
  pf.keep_with_next=True
  pf.page_break_before=kind=='h1' or (kind=='h2' and s.startswith(('3.2 ','3.3 ','3.4 ','3.5 ','3.6 ')))
  if kind=='h1':p.alignment=WD_ALIGN_PARAGRAPH.CENTER
 runstyle(p.add_run(s),16 if kind=='h1' else 14 if kind=='h2' else 13,kind!='p')
 if kind!='p':entries.append({'text':s,'level':int(kind[-1]),'anchor':bookmark(p,'h')})
 return p
def caption(s,kind):
 p=doc.add_paragraph(style='normal');p.alignment=WD_ALIGN_PARAGRAPH.CENTER;pf=p.paragraph_format
 pf.space_before=Pt(5);pf.space_after=Pt(6);pf.keep_together=True;pf.keep_with_next=kind=='table'
 runstyle(p.add_run(s),12,italic=True);captions.append({'text':s,'kind':kind,'anchor':bookmark(p,'caption')})
def table(title,headers,rows,widths=None):
 global tn
 tn+=1;caption(f'Bảng 3.{tn} {title}','table')
 if widths is None:widths=[160,287] if len(headers)==2 else [122,83,242]
 t=doc.add_table(rows=1,cols=len(headers));t.autofit=False
 for c,w in zip(t.columns,widths):c.width=Pt(w)
 borders=OxmlElement('w:tblBorders')
 for side in ('top','left','bottom','right','insideH','insideV'):
  e=OxmlElement('w:'+side);e.set(qn('w:val'),'single');e.set(qn('w:sz'),'4');e.set(qn('w:color'),'888888');borders.append(e)
 t._tbl.tblPr.append(borders)
 def fill(row,values,header=False):
  for c,s,w in zip(row.cells,values,widths):
   c.width=Pt(w);p=c.paragraphs[0];pf=p.paragraph_format;pf.space_before=Pt(3);pf.space_after=Pt(3);pf.line_spacing=1.06
   pf.keep_with_next=header;p.alignment=WD_ALIGN_PARAGRAPH.LEFT
   runstyle(p.add_run(s),11.5,header)
   if header:
    sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'EEEEEE');c._tc.get_or_add_tcPr().append(sh)
  rp=row._tr.get_or_add_trPr();rp.append(OxmlElement('w:cantSplit'))
  if header:rp.append(OxmlElement('w:tblHeader'))
 fill(t.rows[0],headers,True)
 for values in rows:fill(t.add_row(),values)
def figure(name):
 global fn
 fn+=1;file=R/(name+'.png');assert file.exists(),file
 p=doc.add_paragraph(style='normal');p.alignment=WD_ALIGN_PARAGRAPH.CENTER
 p.paragraph_format.keep_with_next=True;p.paragraph_format.space_before=Pt(4);p.paragraph_format.space_after=Pt(0)
 with Image.open(file) as im:height=447*im.height/im.width
 base_width=300 if name=='login' else 280 if name=='register' else 447
 height=base_width*im.height/im.width
 width=base_width if height<=460 else base_width*460/height
 run=p.add_run();run.add_picture(str(file),width=Pt(width))
 shape=run._r.find('.//'+qn('wp:docPr'))
 if shape is not None:shape.set('descr',FIGURES[name])
 caption(f'Hình 3.{fn} {FIGURES[name]}','figure')
for block in CONTENT.strip().split('\n\n'):
 block=block.strip()
 if block.startswith('### '):para(block[4:],'h3')
 elif block.startswith('## '):para(block[3:],'h2')
 elif block.startswith('# '):para(block[2:],'h1')
 elif block.startswith('@figure '):figure(block.split()[1])
 elif block.startswith('@table '):
  key=block.split()[1];title,headers,rows=TABLES[key]
  widths=[120,175,152] if key=='course-states' else [235,212] if key=='api' else [225,222] if key=='environment' else None
  table(title,headers,rows,widths)
 elif block=='@schemas':
  for i,(model,collection,title,intro,data) in enumerate(SCHEMAS,2):
   para(f'3.3.{i} {title}','h3');para(intro,keep=True)
   if collection:para(f'Tập hợp lưu trữ: {collection}. Model trong chương trình: {model}.',keep=True)
   table('Các thuộc tính của '+model,['Trường dữ liệu','Kiểu','Ý nghĩa'],[tuple(s.strip() for s in ln.split('|')) for ln in data.strip().splitlines()])
 else:para(block)
assert tn==22 and fn==16,(tn,fn)
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
 i=next(i for i,p in enumerate(body) if text(p)=='CHƯƠNG 3 THIẾT KẾ VÀ CÀI ĐẶT GIẢI PHÁP')
 inserted=b''.join(serial(x) for x in list(body)[i:] if x.tag!=q('sectPr'))
 pos=raw.rfind(b'<w:sectPr');raw=raw[:pos]+inserted+raw[pos:];E.fromstring(raw)
 with ZipFile(OUT,'w') as out:
  for info in src.infolist():
   data=raw if info.filename=='word/document.xml' else built.read(info.filename) if info.filename=='word/_rels/document.xml.rels' else src.read(info.filename)
   out.writestr(info,data)
  for info in built.infolist():
   if info.filename not in src.namelist():out.writestr(info,built.read(info.filename))
(R/'chapter-structure.json').write_text(json.dumps({'headings':entries,'captions':captions},ensure_ascii=False,indent=2),encoding='utf-8')
print('Appended chapter:',len(entries),'headings;',tn,'tables;',fn,'figures')
