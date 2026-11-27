from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
from docx import Document
import json,hashlib
R=Path(__file__).resolve().parent
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';N={'w':W}
def q(s):return '{'+W+'}'+s
def text(x):return ''.join(t.text or '' for t in x.iter(q('t')))
with ZipFile(R/'source-drive.docx') as a,ZipFile(R/'LUANVAN_updated.docx') as b:
 x=Document(R/'source-drive.docx');y=Document(R/'LUANVAN_updated.docx')
 allowed={'word/document.xml','word/_rels/document.xml.rels','word/footnotes.xml','word/_rels/footnotes.xml.rels'}
 changed=[n for n in a.namelist() if a.read(n)!=b.read(n)]
 assert set(changed)<=allowed
 assert set(b.namelist())-set(a.namelist())=={'word/media/image5.png'}
 assert len(x.tables)==26 and len(y.tables)==27
 assert all(E.tostring(t._tbl)==E.tostring(u._tbl) for t,u in zip(x.tables,y.tables))
 # Existing paragraph XML outside the lists and two announced transitions stays intact.
 oldbody=x._element.body;newbody=y._element.body
 oldparas=[p for p in oldbody if p.tag==q('p')];newparas=[p for p in newbody if p.tag==q('p')]
 end=next(i for i,p in enumerate(newparas) if text(p)=='CHƯƠNG 2 CƠ SỞ LÝ THUYẾT')
 oldfiltered=[p for i,p in enumerate(oldparas) if not (36<=i<=66 or i in (138,276))]
 newfiltered=[p for p in newparas[:end] if not (text(p).startswith(('Bảng 1.','Bảng 2.','Hình 1.','Hình 2.')) or text(p).startswith('Phần II Nội dung trình bày') or text(p).startswith('Chương 1 đã xác định'))]
 # Source table/figure captions in the body are retained; exclude only list rows by position.
 original_start=next(i for i,p in enumerate(oldparas) if text(p)=='CAM KẾT KẾT QUẢ')
 updated_start=next(i for i,p in enumerate(newparas) if text(p)=='CAM KẾT KẾT QUẢ')
 assert original_start==67 and updated_start==69
 assert all(E.tostring(p)==E.tostring(u) for p,u in zip(oldparas[:36],newparas[:36]))
 tail_old=oldparas[67:];tail_new=newparas[69:end]
 assert len(tail_old)==len(tail_new)
 differences=[]
 for i,(p,u) in enumerate(zip(tail_old,tail_new),67):
  if E.tostring(p)!=E.tostring(u):differences.append(i)
 assert differences==[138,276],differences
 root=E.fromstring(b.read('word/document.xml'))
 bookmarks={p.get(q('name')) for p in root.iter(q('bookmarkStart'))}
 anchors={p.get(q('anchor')) for p in root.iter(q('hyperlink')) if p.get(q('anchor'))}
 assert not anchors-bookmarks,anchors-bookmarks
 refs=[int(p.get(q('id'))) for p in root.iter(q('footnoteReference'))]
 notes=E.fromstring(b.read('word/footnotes.xml'))
 ids=[int(p.get(q('id'))) for p in notes]
 assert len(refs)==22 and set(refs)==set(ids) and len(ids)==22
 originalnotes=E.fromstring(a.read('word/footnotes.xml'))
 for p,u in zip(originalnotes,list(notes)[:2]):assert E.tostring(p)==E.tostring(u)
 assert len(y.inline_shapes)==5
 toc=root.find('.//w:sdtContent',N)
 assert len(toc)==104
 assert len([p for p in toc if 'nc_ch2_' in E.tostring(p).decode()])==31
 pages=json.loads((R/'qa/page-map.json').read_text(encoding='utf-8-sig'))
 wrong=[]
 for p in toc:
  hs=p.findall('w:hyperlink',N)
  if hs:
   anchor=hs[-1].get(q('anchor'));value=hs[-1].findall('.//w:t',N)[-1].text
   if anchor in pages and str(pages[anchor])!=value:wrong.append((anchor,value,pages[anchor]))
 assert not wrong,wrong
 report={'source_sha256':hashlib.sha256((R/'source-drive.docx').read_bytes()).hexdigest(),
 'output_sha256':hashlib.sha256((R/'LUANVAN_updated.docx').read_bytes()).hexdigest(),
 'changed_parts':changed,'existing_tables_preserved':26,'existing_images_preserved':4,
 'prior_body_paragraphs_changed':differences,'chapter_2_headings':31,'new_footnotes':20,
 'total_footnotes':22,'all_internal_links_valid':True,'toc_cached_page_numbers_valid':True,
 'scope':'Chapter 2, navigation, and two chapter-structure linking paragraphs'}
 (R/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(report,ensure_ascii=False,indent=2))
