from pathlib import Path
import zipfile,re,json,hashlib
from lxml import etree as E
from docx import Document
from pypdf import PdfReader

R=Path(__file__).resolve().parent
N={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W=N['w']
def text(p):return ''.join(p.xpath('.//w:t/text()',namespaces=N))
def span(raw,a,b):
    matches=list(re.finditer(rb'<w:p(?=[\s>])[^>]*>.*?</w:p>',raw,re.S))
    def plain(m):
        import html
        return html.unescape(''.join(x.decode('utf-8') for x in re.findall(rb'<w:t[^>]*>(.*?)</w:t>',m.group())))
    st=next(m.start() for m in matches if plain(m)==a and b'Heading1' in m.group())
    en=next(m.start() for m in matches if plain(m)==b and b'Heading1' in m.group())
    return raw[st:en]
with zipfile.ZipFile(R/'source-drive.docx') as a,zipfile.ZipFile(R/'LUANVAN_updated.docx') as b:
    ar=a.read('word/document.xml');br=b.read('word/document.xml')
    assert span(ar,'PHẦN I GIỚI THIỆU','PHẦN II NỘI DUNG')==span(br,'PHẦN I GIỚI THIỆU','PHẦN II NỘI DUNG')
    assert span(ar,'CAM KẾT KẾT QUẢ','PHẦN I GIỚI THIỆU')==span(br,'CAM KẾT KẾT QUẢ','PHẦN I GIỚI THIỆU')
    changed=[n for n in a.namelist() if a.read(n)!=b.read(n)]
    assert changed==['word/document.xml','word/_rels/document.xml.rels'],changed
    r=E.fromstring(br)
    names={x.get('{'+W+'}name') for x in r.findall('.//w:bookmarkStart',N)}
    anchors=[x.get('{'+W+'}anchor') for x in r.findall('.//w:hyperlink',N) if x.get('{'+W+'}anchor')]
    missing=set(anchors)-names
    assert not missing,missing
    nav=json.loads((R/'navigation-entries.json').read_text(encoding='utf-8'))
    pages=json.loads((R/'qa/page-map.json').read_text(encoding='utf-8-sig'))
    assert all(x['anchor'] in pages for x in nav),[x['text'] for x in nav if x['anchor'] not in pages]
    dd=Document(R/'LUANVAN_updated.docx')
    assert len(dd.tables)==26
    uc=[p.text for p in dd.paragraphs if re.match(r'1\.3\.\d+ ',p.text)]
    assert len(uc)==23
    report={
        'part_i_bytes_unchanged':True,
        'commitment_and_abstract_bytes_unchanged':True,
        'changed_original_zip_members':changed,
        'tables':len(dd.tables),'specifications':len(uc),'figures':len(dd.inline_shapes),
        'navigation_entries':len(nav),'missing_bookmark_targets':list(missing),
        'pdf_pages':len(PdfReader(R/'qa/revised.pdf').pages),
        'source_sha256':hashlib.sha256((R/'source-drive.docx').read_bytes()).hexdigest(),
        'output_sha256':hashlib.sha256((R/'LUANVAN_updated.docx').read_bytes()).hexdigest()
    }
    (R/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
