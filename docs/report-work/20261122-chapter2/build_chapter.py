from pathlib import Path
from copy import deepcopy
from zipfile import ZipFile
from lxml import etree as E
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont
import re, json, hashlib, html
from chapter_data import CONTENT, SOURCES, TECH_ROWS

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT/'source-drive.docx'
OUT = ROOT/'LUANVAN_updated.docx'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PKG='http://schemas.openxmlformats.org/package/2006/relationships'
NS={'w':W,'r':R}
def q(s): return '{'+W+'}'+s
def text(p): return ''.join(p.itertext()) if False else ''.join(x.text or '' for x in p.iter(q('t')))

# Draw a project-specific explanatory diagram, rather than copying a reference figure.
im=Image.new('RGB',(1800,580),'white'); draw=ImageDraw.Draw(im)
fontdir=Path('C:/Windows/Fonts')
def f(sz,b=False):return ImageFont.truetype(str(fontdir/('timesbd.ttf' if b else 'times.ttf')),sz)
def centered(x,y,s,size=41,b=False):draw.text((x,y),s,fill='black',font=f(size,b),anchor='mt')
boxes=[(25,120,490,425),(665,120,1130,425),(1305,120,1770,425)]
labels=[('MÁY KHÁCH','Trình duyệt và Vue','Hiển thị nội dung','Tiếp nhận thao tác'),('MÁY CHỦ','Node.js và NestJS','Kiểm tra yêu cầu','Xử lý nghiệp vụ'),('CƠ SỞ DỮ LIỆU','MongoDB','Lưu thông tin','Truy vấn dữ liệu')]
for box,ls in zip(boxes,labels):
 draw.rectangle(box,outline='black',width=4); cx=(box[0]+box[2])//2
 for i,s in enumerate(ls):centered(cx,150+i*63,s,41 if i else 43,i==0)
for a,b in [(490,665),(1130,1305)]:
 y=260;draw.line((a+14,y,b-14,y),fill='black',width=4)
 draw.polygon([(b-14,y),(b-36,y-12),(b-36,y+12)],fill='black')
 y=320;draw.line((a+14,y,b-14,y),fill='black',width=4)
 draw.polygon([(a+14,y),(a+36,y-12),(a+36,y+12)],fill='black')
centered(578,54,'HTTP / API',34);centered(1218,54,'Đọc / ghi',34)
centered(900,485,'Các mũi tên biểu diễn yêu cầu và kết quả trao đổi giữa các thành phần.',35)
im.save(ROOT/'client-server.png',dpi=(300,300))

doc=Document(SOURCE); original_count=len(doc._element.body)
templates={}
for p in doc.paragraphs:
 if p.style.name in ('Heading 1','Heading 2','Heading 3') and p.style.name not in templates:
  templates[p.style.name]=deepcopy(p._p.pPr)
templates['normal']=deepcopy(doc.paragraphs[-1]._p.pPr)
entries=[];captions=[];footnotes=[];bm_id=9000
def style_run(run,size=13,bold=False,italic=False):
 run.font.name='Times New Roman';run.font.size=Pt(size);run.bold=bold;run.italic=italic;run.font.color.rgb=RGBColor(0,0,0)
 fonts=run._r.get_or_add_rPr().find(qn('w:rFonts'))
 for k in ('ascii','hAnsi','eastAsia','cs'):fonts.set(qn('w:'+k),'Times New Roman')
def bookmark(p,prefix):
 global bm_id
 bm_id+=1;name=f'nc_ch2_{prefix}_{bm_id}'
 start=OxmlElement('w:bookmarkStart');start.set(qn('w:id'),str(bm_id));start.set(qn('w:name'),name)
 end=OxmlElement('w:bookmarkEnd');end.set(qn('w:id'),str(bm_id));p._p.insert(1,start);p._p.append(end)
 return name
with ZipFile(SOURCE) as z:
 oldnotes=E.fromstring(z.read('word/footnotes.xml'))
next_note=max(int(x.get(q('id'))) for x in oldnotes)+1
def paragraph(s,kind='p'):
 global next_note
 sty={'h1':'Heading 1','h2':'Heading 2','h3':'Heading 3'}.get(kind,'normal')
 p=doc.add_paragraph(style=sty)
 if p._p.pPr is not None:p._p.remove(p._p.pPr)
 p._p.insert(0,deepcopy(templates[sty]))
 pf=p.paragraph_format
 pf.widow_control=True
 if kind!='p':
  pf.keep_with_next=True
  if kind=='h1':pf.page_break_before=True;p.alignment=WD_ALIGN_PARAGRAPH.CENTER
  else:pf.page_break_before=False
 else:
  p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY;pf.space_after=Pt(6);pf.line_spacing=1.2
 for chunk in re.split(r'(\[[a-z]+\])',s):
  if re.fullmatch(r'\[[a-z]+\]',chunk):
   key=chunk[1:-1];assert key in SOURCES
   r=p.add_run();style_run(r);r.font.superscript=True
   e=OxmlElement('w:footnoteReference');e.set(qn('w:id'),str(next_note));r._r.append(e)
   footnotes.append((next_note,key));next_note+=1
  elif chunk:style_run(p.add_run(chunk),16 if kind=='h1' else 14 if kind=='h2' else 13,kind!='p')
 if kind!='p':entries.append({'text':s,'level':int(kind[-1]),'anchor':bookmark(p,'h')})
 return p
def caption(s,kind):
 p=doc.add_paragraph(style='normal');p.alignment=WD_ALIGN_PARAGRAPH.CENTER
 p.paragraph_format.space_before=Pt(5);p.paragraph_format.space_after=Pt(6)
 p.paragraph_format.keep_together=True;p.paragraph_format.keep_with_next=kind=='table'
 style_run(p.add_run(s),12,italic=True)
 captions.append({'text':s,'kind':kind,'anchor':bookmark(p,'caption')})
def table():
 caption('Bảng 2.1 Vai trò của các nhóm công nghệ trong NextCode','table')
 t=doc.add_table(rows=1,cols=3);t.autofit=False
 widths=[88,130,229]
 for c,width in zip(t.columns,widths):c.width=Pt(width)
 borders=OxmlElement('w:tblBorders')
 for side in ('top','left','bottom','right','insideH','insideV'):
  e=OxmlElement('w:'+side);e.set(qn('w:val'),'single');e.set(qn('w:sz'),'4');e.set(qn('w:color'),'888888');borders.append(e)
 t._tbl.tblPr.append(borders)
 def fill(row,vals,header=False):
  for c,s,width in zip(row.cells,vals,widths):
   c.width=Pt(width);p=c.paragraphs[0];p.paragraph_format.space_after=Pt(2);p.paragraph_format.space_before=Pt(2);p.paragraph_format.line_spacing=1.05
   style_run(p.add_run(s),11.5,header)
   if header:
    sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'EEEEEE');c._tc.get_or_add_tcPr().append(sh)
  rp=row._tr.get_or_add_trPr();rp.append(OxmlElement('w:cantSplit'))
  if header:rp.append(OxmlElement('w:tblHeader'))
 fill(t.rows[0],('Nhóm','Công nghệ','Vai trò'),True)
 for row in TECH_ROWS:fill(t.add_row(),row)
for block in CONTENT.strip().split('\n\n'):
 block=block.strip()
 if block.startswith('### '):paragraph(block[4:],'h3')
 elif block.startswith('## '):paragraph(block[3:],'h2')
 elif block.startswith('# '):paragraph(block[2:],'h1')
 elif block=='@figure':
  p=doc.add_paragraph(style='normal');p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.keep_with_next=True
  p.add_run().add_picture(str(ROOT/'client-server.png'),width=Pt(447))
  caption('Hình 2.1 Mô hình trao đổi dữ liệu giữa các thành phần của NextCode','figure')
 elif block=='@table':table()
 else:paragraph(block)
doc.save(ROOT/'chapter-build.docx')

with ZipFile(SOURCE) as src, ZipFile(ROOT/'chapter-build.docx') as built:
 raw=src.read('word/document.xml');root=E.fromstring(raw)
 def serial(el):
  b=E.tostring(el,encoding='utf-8')
  def decl(m):
   prefix=m.group(1).decode() if m.group(1) else None
   return b'' if root.nsmap.get(prefix)==m.group(2).decode() else m.group()
  return re.sub(rb' xmlns(?::([A-Za-z0-9_]+))?="([^"]*)"',decl,b)
 newbody=E.fromstring(built.read('word/document.xml')).find('w:body',NS)
 start=next(i for i,x in enumerate(newbody) if text(x)=='CHƯƠNG 2 CƠ SỞ LÝ THUYẾT')
 newcontent=b''.join(serial(x) for x in list(newbody)[start:] if x.tag!=q('sectPr'))
 pos=raw.rfind(b'<w:sectPr');raw=raw[:pos]+newcontent+raw[pos:]
 # Only two short linking passages in the approved text need to reflect the new chapter structure.
 source_doc=Document(SOURCE)
 changes={
  source_doc.paragraphs[138].text:'Phần II Nội dung trình bày bài toán và giải pháp xây dựng hệ thống. Chương 1 Mô tả bài toán xác định các nhóm người dùng, yêu cầu chức năng, yêu cầu chất lượng và các quy trình cần giải quyết. Chương 2 Cơ sở lý thuyết giải thích các kiến thức và công nghệ được sử dụng. Các chương tiếp theo trình bày thiết kế, cài đặt giải pháp, kiểm thử và đánh giá sản phẩm.',
  source_doc.paragraphs[276].text:source_doc.paragraphs[276].text.replace('Trên nền tảng đó, chương tiếp theo trình bày thiết kế và cách cài đặt giải pháp.','Chương tiếp theo trình bày các kiến thức và công nghệ làm cơ sở cho việc xây dựng giải pháp.'),
 }
 matches=list(re.finditer(rb'<w:p(?=[\s>])[^>]*>.*?</w:p>',raw,re.S));edits=[]
 for m in matches:
  p=E.fromstring(m.group(),parser=E.XMLParser(recover=True)) if False else None
  tx=html.unescape(''.join(x.decode() for x in re.findall(rb'<w:t[^>]*>(.*?)</w:t>',m.group())))
  if tx in changes:
   old=next(x for x in source_doc.paragraphs if x.text==tx)._p
   p=deepcopy(old);ts=list(p.iter(q('t')));ts[0].text=changes[tx]
   for t in ts[1:]:t.text=''
   edits.append((m.start(),m.end(),serial(p)))
 assert len(edits)==2
 for a,b,data in sorted(edits,reverse=True):raw=raw[:a]+data+raw[b:]
 E.fromstring(raw)
 # Native footnotes preserve the existing Moodle and F8 references.
 notes=E.fromstring(src.read('word/footnotes.xml'));rels=E.fromstring(src.read('word/_rels/footnotes.xml.rels'))
 oldids=[int(x.get('Id')[3:]) for x in rels if x.get('Id','').startswith('rId')]
 rid=max(oldids,default=0)
 def fn_run(parent,s=None,reference=False,link=False):
  r=E.SubElement(parent,q('r'));rp=E.SubElement(r,q('rPr'));fonts=E.SubElement(rp,q('rFonts'))
  for k in ('ascii','hAnsi','cs','eastAsia'):fonts.set(q(k),'Times New Roman')
  sz=E.SubElement(rp,q('sz'));sz.set(q('val'),'20')
  if reference:
   va=E.SubElement(rp,q('vertAlign'));va.set(q('val'),'superscript');E.SubElement(r,q('footnoteRef'))
  else:
   if link:
    c=E.SubElement(rp,q('color'));c.set(q('val'),'1155CC');u=E.SubElement(rp,q('u'));u.set(q('val'),'single')
   t=E.SubElement(r,q('t'));t.set('{http://www.w3.org/XML/1998/namespace}space','preserve');t.text=s
 for id,key in footnotes:
  org,title,url=SOURCES[key];rid+=1;relid=f'rId{rid}'
  rel=E.SubElement(rels,'{'+PKG+'}Relationship');rel.set('Id',relid);rel.set('Type',R+'/hyperlink');rel.set('Target',url);rel.set('TargetMode','External')
  fn=E.SubElement(notes,q('footnote'));fn.set(q('id'),str(id));p=E.SubElement(fn,q('p'));pp=E.SubElement(p,q('pPr'))
  spacing=E.SubElement(pp,q('spacing'));spacing.set(q('line'),'240');spacing.set(q('lineRule'),'auto');spacing.set(q('after'),'40')
  fn_run(p,reference=True);fn_run(p,' '+org+', ')
  h=E.SubElement(p,q('hyperlink'));h.set('{'+R+'}id',relid);fn_run(h,title,link=True)
  fn_run(p,', truy cập ngày 22 tháng 11 năm 2026.')
 replaced={
 'word/document.xml':raw,
 'word/_rels/document.xml.rels':built.read('word/_rels/document.xml.rels'),
 'word/footnotes.xml':E.tostring(notes,xml_declaration=True,encoding='UTF-8',standalone=True),
 'word/_rels/footnotes.xml.rels':E.tostring(rels,xml_declaration=True,encoding='UTF-8',standalone=True),
 }
 with ZipFile(OUT,'w') as out:
  for info in src.infolist():out.writestr(info,replaced.get(info.filename,src.read(info.filename)))
  for info in built.infolist():
   if info.filename not in src.namelist():out.writestr(info,built.read(info.filename))
ROOT.joinpath('chapter-structure.json').write_text(json.dumps({'headings':entries,'captions':captions,'footnotes':footnotes,'sources':SOURCES},ensure_ascii=False,indent=2),encoding='utf-8')
print('Built chapter:',len(entries),'headings;',len(footnotes),'new footnotes;',len(CONTENT),'characters')
