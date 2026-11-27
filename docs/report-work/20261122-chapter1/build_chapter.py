from pathlib import Path
from copy import deepcopy
from io import BytesIO
import hashlib, json, re, zipfile
from lxml import etree as E
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from chapter_data import CASES, INTRO, ENDING, ACTORS, PENALTIES

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'source-drive.docx'
OUT=ROOT/'LUANVAN_updated.docx'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W=NS['w']
def qt(t):return '{'+W+'}'+t
def txt(p):return ''.join(n.text or '' for n in p.iter(qt('t')))
doc=Document(SOURCE)
body=doc._element.body
old=list(body)
part2=next(i for i,p in enumerate(old) if txt(p)=='PHẦN II NỘI DUNG')
# Retain native styles and formatting from the uploaded file.
templates={}
for p in doc.paragraphs:
    if p.style.name in ['Heading 1','Heading 2','Heading 3'] and p.style.name not in templates:
        templates[p.style.name]=deepcopy(p._p.pPr)
    if p.text.startswith('Một khóa học gồm') or p.text.startswith('Học lập trình là'):
        templates['Normal']=deepcopy(p._p.pPr)
for el in old[part2:]:
    if el.tag!=qt('sectPr'):body.remove(el)

for rel in list(doc.part.rels.values()):
    pass # Keep existing parts and references while constructing a scoped replacement.

bookmark_id=5000
entries=[];captions=[]
def bookmark(p, prefix):
    global bookmark_id
    bookmark_id+=1
    name=f'nc_{prefix}_{bookmark_id}'
    b=OxmlElement('w:bookmarkStart');b.set(qn('w:id'),str(bookmark_id));b.set(qn('w:name'),name)
    e=OxmlElement('w:bookmarkEnd');e.set(qn('w:id'),str(bookmark_id))
    p._p.insert(1,b);p._p.append(e)
    return name

def run_style(run,size=13,bold=False,italic=False):
    run.font.name='Times New Roman';run.font.size=Pt(size);run.bold=bold;run.italic=italic
    run.font.color.rgb=RGBColor(0,0,0)
    rp=run._r.get_or_add_rPr();fonts=rp.find(qn('w:rFonts'))
    if fonts is not None:
        for k in ['ascii','hAnsi','cs','eastAsia']:fonts.set(qn('w:'+k),'Times New Roman')

def para(text,kind='p',break_before=False):
    style={'h1':'Heading 1','h2':'Heading 2','h3':'Heading 3'}.get(kind,'Normal')
    p=doc.add_paragraph(style=style)
    if style in templates:
        p._p.remove(p._p.pPr);p._p.insert(0,deepcopy(templates[style]))
    r=p.add_run(text)
    run_style(r,16 if kind=='h1' else 14 if kind=='h2' else 13,kind!='p')
    if kind=='h1':
        p.alignment=WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.page_break_before=not text.startswith('CHƯƠNG 1')
    elif kind=='p':p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
    if kind!='p':
        p.paragraph_format.keep_with_next=True
        name=bookmark(p,'h');entries.append({'text':text,'level':int(kind[1]),'anchor':name})
    if break_before or text in ['1.2.3 Sơ đồ use case của giảng viên','1.2.4 Sơ đồ use case của quản trị viên','1.4 Quy trình nghiệp vụ và các quy tắc xử lý']:
        p.paragraph_format.page_break_before=True
    return p

def caption(text,kind):
    p=doc.add_paragraph()
    p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before=Pt(5);p.paragraph_format.space_after=Pt(5)
    p.paragraph_format.keep_with_next=kind=='table'
    p.paragraph_format.keep_together=True
    run_style(p.add_run(text),12,italic=True)
    name=bookmark(p,'caption');captions.append({'text':text,'kind':kind,'anchor':name})
    return p

def table(headers,rows,widths,repeat_header=True):
    t=doc.add_table(rows=1,cols=len(headers))
    t.autofit=False
    for col,width in zip(t.columns,widths):col.width=Pt(width)
    props=t._tbl.tblPr
    borders=OxmlElement('w:tblBorders')
    for tag in ['top','left','bottom','right','insideH','insideV']:
        e=OxmlElement('w:'+tag);e.set(qn('w:val'),'single');e.set(qn('w:sz'),'4');e.set(qn('w:color'),'888888');borders.append(e)
    props.append(borders)
    margins=OxmlElement('w:tblCellMar')
    for side in ['top','bottom','left','right']:
        e=OxmlElement('w:'+side);e.set(qn('w:w'),'65' if side in ['top','bottom'] else '90');e.set(qn('w:type'),'dxa');margins.append(e)
    props.append(margins)
    def fill(row,values,header=False):
        for i,(c,val) in enumerate(zip(row.cells,values)):
            c.width=Pt(widths[i])
            ls=val if isinstance(val,list) else [val]
            for j,s in enumerate(ls):
                p=c.paragraphs[0] if j==0 else c.add_paragraph()
                p.paragraph_format.space_before=Pt(0);p.paragraph_format.space_after=Pt(4)
                p.paragraph_format.line_spacing=1.08
                p.alignment=WD_ALIGN_PARAGRAPH.LEFT
                run_style(p.add_run(s),12,header or i==0)
            if header:
                sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'EEEEEE');c._tc.get_or_add_tcPr().append(sh)
        rp=row._tr.get_or_add_trPr();rp.append(OxmlElement('w:cantSplit'))
        if header and repeat_header:rp.append(OxmlElement('w:tblHeader'))
    fill(t.rows[0],headers,True)
    for vals in rows:fill(t.add_row(),vals)
    # Keep a short table header with at least its first data row.
    for c in t.rows[0].cells:
        for p in c.paragraphs:p.paragraph_format.keep_with_next=True
    return t

def add_content(blocks):
    for kind,value in blocks:
        if kind.startswith('h') or kind=='p':
            para(value,kind)
        elif kind=='actors':
            caption('Bảng 1.1 Các tác nhân và phạm vi sử dụng','table')
            table(['Tác nhân','Công việc chính','Phạm vi sử dụng'],ACTORS,[86,188,173])
        elif kind=='catalog':
            caption('Bảng 1.2 Danh mục chức năng của NextCode','table')
            table(['Mã','Chức năng','Mục đích'],[(x['id'],x['title'],x['purpose']) for x in CASES],[42,145,260])
        elif kind=='penalties':
            caption('Bảng 1.26 Các mức hạn chế tài khoản khi xử lý vi phạm','table')
            table(['Số lần hoặc mức độ vi phạm','Hình thức xử lý'],PENALTIES,[170,277])
        elif kind=='figure':
            name,label=value
            p=doc.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.keep_with_next=True
            p.paragraph_format.space_before=Pt(4);p.paragraph_format.space_after=Pt(0)
            p.add_run().add_picture(str(ROOT/(name+'.png')),width=Pt(447))
            caption(label,'figure')

add_content(INTRO)
for i,c in enumerate(CASES):
    # A complete, readable case per page avoids splitting the main procedure across pages.
    para(f'1.3.{i+1} '+c['title'],'h3',break_before=True)
    caption(f'Bảng 1.{i+3} Đặc tả {c["id"]} {c["title"][0].lower()+c["title"][1:]}','table')
    rows=[('Mã trường hợp',c['id']),('Tác nhân',c['actors']),('Mục đích',c['purpose']),
          ('Điều kiện',c['pre']),('Luồng chính',[f'{j+1}. {s}' for j,s in enumerate(c['steps'])]),
          ('Trường hợp khác',[f'{j+1}. {s}' for j,s in enumerate(c['alternatives'])]),('Kết quả',c['post'])]
    table(['Nội dung','Đặc tả'],rows,[83,364])

add_content(ENDING)
doc.save(ROOT/'chapter-build.docx')

def serialize(el):
    b=E.tostring(el,encoding='utf-8')
    def decl(m):
        prefix=m.group(1).decode() if m.group(1) else None
        return b'' if root.nsmap.get(prefix)==m.group(2).decode() else m.group()
    return re.sub(rb' xmlns(?::([A-Za-z0-9_]+))?="([^"]*)"',decl,b)

with zipfile.ZipFile(SOURCE) as src,zipfile.ZipFile(ROOT/'chapter-build.docx') as built:
    raw=src.read('word/document.xml')
    root=E.fromstring(raw);oldbody=root.find('w:body',NS)
    matches=list(re.finditer(rb'<w:p(?=[\s>])[^>]*>.*?</w:p>',raw,re.S))
    def rawtext(m):
        import html
        return html.unescape(''.join(x.decode('utf-8') for x in re.findall(rb'<w:t[^>]*>(.*?)</w:t>',m.group())))
    first=next(m for m in matches if rawtext(m)=='PHẦN II NỘI DUNG' and b'Heading1' in m.group())
    newroot=E.fromstring(built.read('word/document.xml'));newbody=newroot.find('w:body',NS)
    ns=next(i for i,p in enumerate(newbody) if txt(p)=='PHẦN II NỘI DUNG')
    endraw=raw[raw.rfind(b'<w:sectPr'):]
    newraw=raw[:first.start()]+b''.join(serialize(x) for x in list(newbody)[ns:] if x.tag!=qt('sectPr'))+endraw
    E.fromstring(newraw)
    with zipfile.ZipFile(OUT,'w') as out:
        for info in src.infolist():
            if info.filename=='word/document.xml':data=newraw
            elif info.filename=='word/_rels/document.xml.rels':data=built.read(info.filename)
            else:data=src.read(info.filename)
            out.writestr(info,data)
        for info in built.infolist():
            if info.filename not in src.namelist():out.writestr(info,built.read(info.filename))
    assert newraw[:first.start()]==raw[:first.start()]

ROOT.joinpath('chapter-structure.json').write_text(json.dumps({'headings':entries,'captions':captions},ensure_ascii=False,indent=2),encoding='utf-8')
ROOT.joinpath('draft-check.json').write_text(json.dumps({'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'output':str(OUT),'part_i_and_front_bytes_preserved':True,'cases':len(CASES),'figures':4,'tables':26},indent=2),encoding='utf-8')
print('Built',OUT,'cases',len(CASES),'tables',26,'headings',len(entries))
