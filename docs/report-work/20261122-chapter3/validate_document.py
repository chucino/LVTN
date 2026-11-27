from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
from docx import Document
import json,hashlib
from data_dictionary import SCHEMAS
R=Path(__file__).resolve().parent;W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';N={'w':W}
def q(s):return '{'+W+'}'+s
def text(p):return ''.join(t.text or '' for t in p.iter(q('t')))
with ZipFile(R/'source-drive.docx') as a,ZipFile(R/'LUANVAN_updated.docx') as b:
 changed=[n for n in a.namelist() if a.read(n)!=b.read(n)]
 assert set(changed)=={'word/document.xml','word/_rels/document.xml.rels'},changed
 newparts=set(b.namelist())-set(a.namelist())
 assert len(newparts)==16 and all(n.startswith('word/media/') for n in newparts),newparts
 x=Document(R/'source-drive.docx');y=Document(R/'LUANVAN_updated.docx')
 assert len(x.tables)==27 and len(y.tables)==49
 assert all(E.tostring(t._tbl)==E.tostring(u._tbl) for t,u in zip(x.tables,y.tables))
 assert len(x.inline_shapes)==5 and len(y.inline_shapes)==21
 # Apart from navigation, every existing top-level body node is byte-identical.
 ox=list(x._element.body);ny=list(y._element.body)
 oi=next(i for i,p in enumerate(ox) if text(p)=='CAM KẾT KẾT QUẢ')
 ni=next(i for i,p in enumerate(ny) if text(p)=='CAM KẾT KẾT QUẢ')
 stop=next(i for i,p in enumerate(ny) if text(p)=='CHƯƠNG 3 THIẾT KẾ VÀ CÀI ĐẶT GIẢI PHÁP')
 original=[p for p in ox[oi:] if p.tag!=q('sectPr')]
 oldarea=ny[ni:stop]
 assert len(original)==len(oldarea)
 for i,(p,u) in enumerate(zip(original,oldarea)):assert E.tostring(p)==E.tostring(u),(i,text(p)[:60])
 assert E.tostring(ox[-1])==E.tostring(ny[-1])
 # Cover page, acknowledgements and all content before the TOC stay intact.
 toc_index=next(i for i,p in enumerate(ox) if p.tag==q('sdt'))
 assert all(E.tostring(p)==E.tostring(u) for p,u in zip(ox[:toc_index],ny[:toc_index]))
 root=E.fromstring(b.read('word/document.xml'))
 names={p.get(q('name')) for p in root.iter(q('bookmarkStart'))}
 anchors={p.get(q('anchor')) for p in root.iter(q('hyperlink')) if p.get(q('anchor'))}
 assert not anchors-names,anchors-names
 assert b.read('word/footnotes.xml')==a.read('word/footnotes.xml')
 assert b.read('word/_rels/footnotes.xml.rels')==a.read('word/_rels/footnotes.xml.rels')
 structure=json.loads((R/'chapter-structure.json').read_text(encoding='utf-8'))
 assert len(structure['headings'])==48 and len(structure['captions'])==38
 toc=root.find('.//w:sdtContent',N)
 assert len(toc)==152
 pages=json.loads((R/'qa/page-map.json').read_text(encoding='utf-8-sig'))
 wrong=[]
 for p in toc:
  hs=p.findall('w:hyperlink',N)
  if hs:
   anchor=hs[-1].get(q('anchor'));ts=hs[-1].findall('.//w:t',N)
   if anchor in pages and str(pages[anchor])!=ts[-1].text:wrong.append((anchor,ts[-1].text,pages[anchor]))
 assert not wrong,wrong
 for entry in structure['captions']:
  hits=[p for p in y.paragraphs if p.text==entry['text']]
  assert len(hits)==1,(entry['text'],len(hits))
 # All documented field names exist in the current TypeScript schemas.
 actual=json.loads((R/'actual-class-fields.json').read_text(encoding='utf-8'))
 for model,collection,title,intro,data in SCHEMAS:
  fields={f.strip() for ln in data.strip().splitlines() for f in ln.split('|')[0].split(',')}
  code=set(actual[model]['fields'])
  assert not fields-code,(model,fields-code)
  assert not code-fields-{'_id','createdAt','updatedAt'},(model,code-fields)
 result={'source_sha256':hashlib.sha256((R/'source-drive.docx').read_bytes()).hexdigest(),
 'output_sha256':hashlib.sha256((R/'LUANVAN_updated.docx').read_bytes()).hexdigest(),
 'changed_parts':changed,'original_body_preserved':True,'original_tables_preserved':27,
 'original_images_preserved':5,'original_footnotes_preserved':22,'chapter_3_headings':48,
 'new_tables':22,'new_figures':16,'new_diagrams':9,'application_screenshots':7,
 'documented_models':18,'separate_collections':15,'schema_field_coverage':'complete except shared id/timestamp fields explained in prose',
 'all_internal_links_valid':True,'toc_cached_page_numbers_valid':True}
 (R/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2))
