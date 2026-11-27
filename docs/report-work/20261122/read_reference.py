from pathlib import Path
from pypdf import PdfReader
from lxml import etree
from zipfile import ZipFile
import json,re

out=Path(__file__).resolve().parent
source=Path('C:/Users/congchuc/OneDrive - zzz/đề tài luận văn/báo cáo/B2110156_TaQuangVinh_Xây dựng hệ thống freelance marketplace dùng ReactJS và Java Spring có tích hợp hệ thống gợi ý và chatbot.pdf')
pages=[]
for i,p in enumerate(PdfReader(source).pages):
    text=p.extract_text() or ''
    pages.append({'page':i+1,'text':text})
(out/'reference-pages.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'reference-full.txt').write_text('\n\n'.join(f'PAGE {p["page"]}\n{p["text"]}' for p in pages),encoding='utf-8')
print(json.dumps({'pages':len(pages),'characters':sum(len(p['text']) for p in pages)},ensure_ascii=False))
doc=Path('C:/Users/congchuc/OneDrive - zzz/đề tài luận văn/báo cáo/kết/LUANVAN.docx')
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(doc) as z:
    root=etree.fromstring(z.read('word/document.xml'))
    body=root.find('w:body',ns)
    children=list(body)
    get_text=lambda el:''.join(el.itertext())
    targets=[]
    for i,el in enumerate(children):
        txt=''.join(el.xpath('.//w:t/text()',namespaces=ns))
        if txt.startswith(('PHẦN I GIỚI THIỆU','PHẦN II NỘI DUNG')):
            targets.append({'bodyIndex':i,'text':txt,'xml':etree.tostring(el,encoding='unicode')})
    print(json.dumps({'boundaries':targets,'footnotes':z.read('word/footnotes.xml').decode('utf-8') if 'word/footnotes.xml' in z.namelist() else None,'documentRelationships':z.read('word/_rels/document.xml.rels').decode('utf-8')},ensure_ascii=False))
