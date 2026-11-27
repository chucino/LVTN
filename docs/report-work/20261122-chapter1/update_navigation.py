from pathlib import Path
from copy import deepcopy
import zipfile,re,json
from lxml import etree as E

ROOT=Path(__file__).resolve().parent
FILE=ROOT/'LUANVAN_updated.docx'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
N={'w':W}
def q(s):return '{'+W+'}'+s
def text(p):return ''.join(x.text or '' for x in p.iter(q('t')))

with zipfile.ZipFile(FILE) as z:
    raw=z.read('word/document.xml');root=E.fromstring(raw);body=root.find('w:body',N)
    sdt=root.find('.//w:sdt',N);content=sdt.find('w:sdtContent',N)
    with zipfile.ZipFile(ROOT/'source-drive.docx') as original_zip:
        original_root=E.fromstring(original_zip.read('word/document.xml'))
    original_sdt=original_root.find('.//w:sdt',N)
    oldrows=list(original_sdt.find('w:sdtContent',N))
    templates={}
    for p in oldrows:
        st=p.find('w:pPr/w:pStyle',N)
        if st is not None and st.get(q('val')) in ['TOC1','TOC2','TOC3']:
            templates.setdefault(st.get(q('val')),deepcopy(p))
    begin=[]
    for c in oldrows[1]:
        if c.tag==q('hyperlink'):break
        if c.tag!=q('pPr'):begin.append(deepcopy(c))
    pagefile=ROOT/'qa/page-map.json'
    page_map=json.loads(pagefile.read_text(encoding='utf-8-sig')) if pagefile.exists() else {}

    def add_run(parent,kind,value=None,props=None):
        r=E.SubElement(parent,q('r'))
        if props is not None:r.append(deepcopy(props))
        e=E.SubElement(r,q(kind))
        if kind=='fldChar':e.set(q('fldCharType'),value)
        elif kind=='instrText':e.set('{http://www.w3.org/XML/1998/namespace}space','preserve');e.text=value
        elif value is not None:e.text=value
        return r

    def entry(template,label,anchor,page='1'):
        p=E.Element(q('p'),nsmap={'w':W});p.append(deepcopy(template.find('w:pPr',N)))
        h=E.SubElement(p,q('hyperlink'));h.set(q('anchor'),anchor);h.set(q('history'),'1')
        peer=template.find('w:hyperlink/w:r/w:rPr',N)
        if peer is None:peer=template.find('w:r/w:rPr',N)
        number_peer=peer
        source_h=template.find('w:hyperlink',N)
        if source_h is not None:
            texts=source_h.findall('.//w:t',N)
            if texts:number_peer=texts[-1].getparent().find('w:rPr',N)
        add_run(h,'t',label,peer)
        add_run(h,'tab',props=number_peer)
        add_run(h,'fldChar','begin',number_peer)
        add_run(h,'instrText',f' PAGEREF {anchor} \\h ',number_peer)
        add_run(h,'fldChar','separate',number_peer)
        add_run(h,'t',str(page_map.get(anchor,page)),number_peer)
        add_run(h,'fldChar','end',number_peer)
        return p

    headings=[]
    for p in body:
        st=p.find('w:pPr/w:pStyle',N)
        if st is None or st.get(q('val')) not in ['Heading1','Heading2','Heading3']:continue
        b=p.findall('w:bookmarkStart',N)
        choices=[x.get(q('name')) for x in b]
        anchor=next((x for x in choices if x.startswith('_Toc')), choices[0] if choices else None)
        assert anchor, text(p)
        headings.append({'text':text(p),'level':int(st.get(q('val'))[-1]),'anchor':anchor})
    new_sdt=deepcopy(sdt);new_content=new_sdt.find('w:sdtContent',N)
    for p in list(new_content)[1:]:new_content.remove(p)
    for i,h in enumerate(headings):
        p=entry(templates[f'TOC{h["level"]}'],h['text'],h['anchor'])
        if i==0:
            for j,r in enumerate(begin):p.insert(j+1,r)
        new_content.append(p)
    add_run(new_content[-1],'fldChar','end')

    structure=json.loads((ROOT/'chapter-structure.json').read_text(encoding='utf-8'))
    source=E.fromstring(zipfile.ZipFile(ROOT/'source-drive.docx').read('word/document.xml'))
    sb=source.find('w:body',N)
    header_tables=next(p for p in sb if text(p)=='Danh mục bảng')
    header_figures=next(p for p in sb if text(p)=='Danh mục hình')
    list_peer=next(p for p in sb if text(p).startswith('Bảng 1.1 Tác nhân'))
    list_template=deepcopy(list_peer)
    # Keep the supplied typography, use native right-aligned dotted tab stops.
    pp=list_template.find('w:pPr',N)
    jc=pp.find('w:jc',N)
    if jc is not None:jc.set(q('val'),'left')
    tabs=pp.find('w:tabs',N)
    if tabs is None:tabs=E.SubElement(pp,q('tabs'))
    tab=E.SubElement(tabs,q('tab'));tab.set(q('val'),'right');tab.set(q('leader'),'dot');tab.set(q('pos'),'8779')

    def serial(el):
        b=E.tostring(el,encoding='utf-8')
        def decl(m):
            k=m.group(1).decode() if m.group(1) else None
            return b'' if root.nsmap.get(k)==m.group(2).decode() else m.group()
        return re.sub(rb' xmlns(?::([A-Za-z0-9_]+))?="([^"]*)"',decl,b)
    new_table_entries=b''.join(serial(entry(list_template,x['text'],x['anchor'])) for x in structure['captions'] if x['kind']=='table')
    new_figure_entries=b''.join(serial(entry(list_template,x['text'],x['anchor'])) for x in structure['captions'] if x['kind']=='figure')
    pm=list(re.finditer(rb'<w:p(?=[\s>])[^>]*>.*?</w:p>',raw,re.S))
    def plain(m):
        import html
        return html.unescape(''.join(x.decode('utf-8') for x in re.findall(rb'<w:t[^>]*>(.*?)</w:t>',m.group())))
    def find_header(label):return next(m for m in pm if plain(m)==label)
    table_h=find_header('Danh mục bảng');fig_h=find_header('Danh mục hình');end_h=find_header('CAM KẾT KẾT QUẢ')
    sd=re.search(rb'<w:sdt(?=[\s>])[^>]*>.*?</w:sdt>',raw,re.S)
    edits=[(table_h.end(),fig_h.start(),new_table_entries),(fig_h.end(),end_h.start(),new_figure_entries),(sd.start(),sd.end(),serial(new_sdt))]
    for start,end,data in sorted(edits,reverse=True):raw=raw[:start]+data+raw[end:]
    E.fromstring(raw)
    temp=ROOT/'navigation-temp.docx'
    with zipfile.ZipFile(temp,'w') as out:
        for info in z.infolist():out.writestr(info,raw if info.filename=='word/document.xml' else z.read(info.filename))
temp.replace(FILE)
ROOT.joinpath('navigation-entries.json').write_text(json.dumps(headings+structure['captions'],ensure_ascii=False,indent=2),encoding='utf-8')
print('Updated navigation using original TOC formatting:',len(headings),'headings and',len(structure['captions']),'captions')
