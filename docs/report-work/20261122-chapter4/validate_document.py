from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
from docx import Document
import json,hashlib
from chapter_data import GROUPS
R=Path(__file__).resolve().parent;W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';N={'w':W}
def q(s):return '{'+W+'}'+s
def text(p):return ''.join(t.text or '' for t in p.iter(q('t')))
with ZipFile(R/'source-drive.docx') as a,ZipFile(R/'LUANVAN_updated.docx') as b:
 changed=[n for n in a.namelist() if a.read(n)!=b.read(n)]
 assert changed==['word/document.xml'],changed
 assert set(b.namelist())==set(a.namelist())
 x=Document(R/'source-drive.docx');y=Document(R/'LUANVAN_updated.docx')
 assert len(x.tables)==49 and len(y.tables)==65
 assert all(E.tostring(t._tbl)==E.tostring(u._tbl) for t,u in zip(x.tables,y.tables))
 assert len(x.inline_shapes)==len(y.inline_shapes)==21
 ox=list(x._element.body);ny=list(y._element.body)
 oi=next(i for i,p in enumerate(ox) if text(p)=='CAM KẾT KẾT QUẢ')
 ni=next(i for i,p in enumerate(ny) if text(p)=='CAM KẾT KẾT QUẢ')
 stop=next(i for i,p in enumerate(ny) if text(p)=='CHƯƠNG 4 KIỂM THỬ VÀ ĐÁNH GIÁ')
 original=[p for p in ox[oi:] if p.tag!=q('sectPr')];oldarea=ny[ni:stop]
 assert len(original)==len(oldarea)
 for i,(p,u) in enumerate(zip(original,oldarea)):assert E.tostring(p)==E.tostring(u),(i,text(p)[:60])
 assert E.tostring(ox[-1])==E.tostring(ny[-1])
 ti=next(i for i,p in enumerate(ox) if p.tag==q('sdt'))
 assert all(E.tostring(p)==E.tostring(u) for p,u in zip(ox[:ti],ny[:ti]))
 root=E.fromstring(b.read('word/document.xml'))
 names={p.get(q('name')) for p in root.iter(q('bookmarkStart'))}
 anchors={p.get(q('anchor')) for p in root.iter(q('hyperlink')) if p.get(q('anchor'))}
 assert not anchors-names,anchors-names
 assert len(root.findall('.//w:sdt',N))==7
 toc=root.find('.//w:sdtContent',N);assert len(toc)==179
 toc_top=next(i for i,p in enumerate(ny) if p.tag==q('sdt'))
 list_top=next(i for i,p in enumerate(ny) if text(p)=='DANH MỤC BẢNG VÀ HÌNH')
 assert not any(p.findall('w:hyperlink',N) for p in ny[toc_top+1:list_top])
 pages=json.loads((R/'qa/page-map.json').read_text(encoding='utf-8-sig'))
 for p in toc:
  hs=p.findall('w:hyperlink',N)
  anchor=hs[-1].get(q('anchor'));ts=hs[-1].findall('.//w:t',N)
  assert anchor in pages,anchor
  assert str(pages[anchor])==ts[-1].text,(anchor,ts[-1].text,pages[anchor])
 struct=json.loads((R/'chapter-structure.json').read_text(encoding='utf-8'))
 assert len(struct['headings'])==27 and len(struct['captions'])==16
 for c in struct['captions']:
  assert sum(p.text==c['text'] for p in y.paragraphs)==1
 cases={f'{p}-{i:02}' for p,t,f,cs in GROUPS for i in range(1,len(cs)+1)}
 rows={row.cells[0].text for t in y.tables[49:] for row in t.rows[1:] if len(row.cells)==4}
 assert cases==rows,(cases-rows,rows-cases)
 for t in y.tables[49:]:
  assert t.rows[0]._tr.find('w:trPr/w:tblHeader',N) is not None
  for row in t.rows:assert row._tr.find('w:trPr/w:cantSplit',N) is not None
 result={'source_sha256':hashlib.sha256((R/'source-drive.docx').read_bytes()).hexdigest(),
 'output_sha256':hashlib.sha256((R/'LUANVAN_updated.docx').read_bytes()).hexdigest(),
 'changed_parts':changed,'original_body_preserved':True,'original_tables_preserved':49,
 'original_images_preserved':21,'all_other_parts_preserved':True,
 'chapter_4_headings':27,'new_tables':16,'reported_cases':len(cases),
 'toc_entries':179,'all_internal_links_valid':True,'toc_cached_page_numbers_valid':True,
 'chapter_4_first_page':pages[struct['headings'][0]['anchor']]}
 (R/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2))
