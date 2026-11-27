from pathlib import Path
from copy import deepcopy
import hashlib
import html
import json
import re
import zipfile
from lxml import etree as E

WORK = Path(__file__).resolve().parent
SOURCE = Path(r'C:\Users\congchuc\OneDrive - zzz\đề tài luận văn\báo cáo\kết\LUANVAN.docx')
OUTPUT = SOURCE.with_name('LUANVAN_Phan_I_da_viet_lai.docx')
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W}
def q(s): return '{' + W + '}' + s
def text(el): return ''.join(el.xpath('.//w:t/text()', namespaces=NS))
def digest(b): return hashlib.sha256(b).hexdigest()

source_bytes = SOURCE.read_bytes()
with zipfile.ZipFile(SOURCE) as z:
    raw = z.read('word/document.xml')
    root = E.fromstring(raw)
    body = root.find('w:body', NS)
    start = next(i for i, p in enumerate(body) if text(p) == 'PHẦN I GIỚI THIỆU')
    end = next(i for i, p in enumerate(body) if text(p) == 'PHẦN II NỘI DUNG')
    old_part = list(body)[start:end]
    headings = {text(p): p for p in old_part if p.find('w:pPr/w:pStyle', NS) is not None}
    para_matches = list(re.finditer(rb'<w:p(?=[\s>])[^>]*>.*?</w:p>', raw, flags=re.S))
    def plain(m):
        return html.unescape(''.join(t.decode('utf-8') for t in re.findall(rb'<w:t[^>]*>(.*?)</w:t>', m.group())))
    start_match = next(m for m in para_matches if plain(m) == 'PHẦN I GIỚI THIỆU' and b'Heading1' in m.group())
    end_match = next(m for m in para_matches if plain(m) == 'PHẦN II NỘI DUNG' and b'Heading1' in m.group())
    heading_raw = {name: next(m.group() for m in para_matches if plain(m) == name and b'<w:pStyle' in m.group()) for name in headings}
    normal = next(p for p in old_part if text(p).startswith('Một người học'))
    ppr = deepcopy(normal.find('w:pPr', NS))
    rpr = deepcopy(normal.find('w:r/w:rPr', NS))
    def serialize(p):
        b = E.tostring(p, encoding='utf-8')
        return re.sub(rb' xmlns(?::[A-Za-z0-9_]+)?="[^"]*"', b'', b)
    new_paras = []
    heading_order = []
    for chunk in WORK.joinpath('part-i-rewrite.txt').read_text(encoding='utf-8').strip().split('\n\n'):
        if chunk.startswith('# '):
            title = chunk[2:].strip()
            assert title in headings, title
            new_paras.append(heading_raw[title])
            heading_order.append(title)
            continue
        match = re.search(r'\[fn([12])\]$', chunk)
        if match: chunk = chunk[:match.start()]
        p = E.Element(q('p'), nsmap={'w': W}); p.append(deepcopy(ppr))
        r = E.SubElement(p, q('r')); r.append(deepcopy(rpr))
        t = E.SubElement(r, q('t')); t.text = chunk
        if match:
            fr = E.SubElement(p, q('r')); fp = E.SubElement(fr, q('rPr'))
            E.SubElement(fp, q('rStyle')).set(q('val'), 'FootnoteReference')
            E.SubElement(fp, q('vertAlign')).set(q('val'), 'superscript')
            E.SubElement(fr, q('footnoteReference')).set(q('id'), match.group(1))
        new_paras.append(serialize(p))
    assert heading_order == list(headings), heading_order
    replacement = b''.join(new_paras)
    updated = raw[:start_match.start()] + replacement + raw[end_match.start():]
    parsed = E.fromstring(updated)
    newbody = parsed.find('w:body', NS)
    newstart = next(i for i, p in enumerate(newbody) if text(p) == 'PHẦN I GIỚI THIỆU')
    newend = next(i for i, p in enumerate(newbody) if text(p) == 'PHẦN II NỘI DUNG')
    assert [E.tostring(x) for x in list(body)[:start]] == [E.tostring(x) for x in list(newbody)[:newstart]]
    assert [E.tostring(x) for x in list(body)[end:]] == [E.tostring(x) for x in list(newbody)[newend:]]
    assert updated[:start_match.start()] == raw[:start_match.start()]
    assert updated.endswith(raw[end_match.start():])
    with zipfile.ZipFile(OUTPUT, 'w') as out:
        for info in z.infolist():
            out.writestr(info, updated if info.filename == 'word/document.xml' else z.read(info.filename))
with zipfile.ZipFile(SOURCE) as a, zipfile.ZipFile(OUTPUT) as b:
    changed = [n for n in a.namelist() if a.read(n) != b.read(n)]
    assert changed == ['word/document.xml'], changed
    assert a.namelist() == b.namelist()
    toc_before = root.findall('.//w:sdt', NS)
    toc_after = parsed.findall('.//w:sdt', NS)
    assert [E.tostring(x) for x in toc_before] == [E.tostring(x) for x in toc_after]
assert SOURCE.read_bytes() == source_bytes
new_text = '\n'.join(text(p) for p in list(newbody)[newstart:newend])
assert '[fn' not in new_text
assert '(' not in new_text and '"' not in new_text
result = {
    'source': str(SOURCE), 'output': str(OUTPUT),
    'source_sha256': digest(source_bytes),
    'output_sha256': digest(OUTPUT.read_bytes()),
    'changed_zip_members': changed,
    'source_untouched': True, 'toc_xml_unchanged': True,
    'before_part_i_bytes_unchanged': True, 'after_part_i_bytes_unchanged': True,
    'headings_preserved': heading_order,
    'original_part_i_paragraphs': len(old_part), 'new_part_i_paragraphs': len(new_paras),
    'new_part_i_characters': len(new_text), 'new_part_i_space_separated_words': len(new_text.split()),
    'footnotes_preserved': True,
}
WORK.joinpath('preservation-check.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
