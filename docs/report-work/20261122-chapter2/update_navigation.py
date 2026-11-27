from pathlib import Path
from copy import deepcopy
from zipfile import ZipFile
from lxml import etree as E
import re,json
ROOT=Path(__file__).resolve().parent
FILE=ROOT/'LUANVAN_updated.docx'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';N={'w':W}
def q(s):return '{'+W+'}'+s
def text(x):return ''.join(t.text or '' for t in x.iter(q('t')))
with ZipFile(FILE) as z:
 raw=z.read('word/document.xml');root=E.fromstring(raw);body=root.find('w:body',N)
 sdt=root.find('.//w:sdt',N);content=sdt.find('w:sdtContent',N)
 structure=json.loads((ROOT/'chapter-structure.json').read_text(encoding='utf-8'))
 # Reuse the exact hierarchy and typography of the user's edited TOC.
 def peer(prefix):return next(p for p in content if text(p).startswith(prefix))
 peers={1:peer('CHƯƠNG 1 '),2:peer('1.1 '),3:peer('1.2.1 ')}
 pm=ROOT/'qa/page-map.json';pages=json.loads(pm.read_text(encoding='utf-8-sig')) if pm.exists() else {}
 def entry(p,label,anchor):
  new=E.Element(q('p'));new.append(deepcopy(p.find('w:pPr',N)))
  hs=p.findall('w:hyperlink',N)
  labelprops=hs[0].find('w:r/w:rPr',N)
  number_text=hs[-1].findall('.//w:t',N)[-1]
  numberprops=number_text.getparent().find('w:rPr',N)
  h=E.SubElement(new,q('hyperlink'));h.set(q('anchor'),anchor)
  def run(kind,val=None,props=None):
   r=E.SubElement(h,q('r'))
   if props is not None:r.append(deepcopy(props))
   el=E.SubElement(r,q(kind))
   if kind=='fldChar':el.set(q('fldCharType'),val)
   elif val is not None:el.text=str(val)
   if kind=='instrText':el.set('{http://www.w3.org/XML/1998/namespace}space','preserve')
  run('t',label,labelprops);run('tab',props=numberprops)
  run('fldChar','begin',numberprops);run('instrText',f' PAGEREF {anchor} \\h ',numberprops)
  run('fldChar','separate',numberprops);run('t',pages.get(anchor,1),numberprops);run('fldChar','end',numberprops)
  return new
 new_sdt=deepcopy(sdt);nc=new_sdt.find('w:sdtContent',N)
 # Idempotent: replace only the appended chapter entries.
 for p in list(nc):
  if any((h.get(q('anchor')) or '').startswith('nc_ch2_') for h in p.findall('w:hyperlink',N)):nc.remove(p)
 for h in structure['headings']:nc.append(entry(peers[h['level']],h['text'],h['anchor']))
 def update_pages(el):
  for p in el.iter(q('p')):
   hs=p.findall('w:hyperlink',N)
   if not hs:continue
   anchor=hs[-1].get(q('anchor'))
   if anchor not in pages:continue
   ts=hs[-1].findall('.//w:t',N)
   if ts and (ts[-1].text or '').strip().isdigit():ts[-1].text=str(pages[anchor])
 update_pages(new_sdt)
 def serial(el):
  b=E.tostring(el,encoding='utf-8')
  def decl(m):
   k=m.group(1).decode() if m.group(1) else None
   return b'' if root.nsmap.get(k)==m.group(2).decode() else m.group()
  return re.sub(rb' xmlns(?::([A-Za-z0-9_]+))?="([^"]*)"',decl,b)
 sd=re.search(rb'<w:sdt(?=[\s>])[^>]*>.*?</w:sdt>',raw,re.S);edits=[(sd.start(),sd.end(),serial(new_sdt))]
 # Retain existing table and figure list rows and append the two new captions.
 for label,endlabel,kind in [('Danh mục bảng','Danh mục hình','table'),('Danh mục hình','CAM KẾT KẾT QUẢ','figure')]:
  start=next(x for x in body if text(x)==label);end=next(x for x in body if text(x)==endlabel)
  children=list(body);i=children.index(start);j=children.index(end);rows=children[i+1:j]
  existing=[deepcopy(p) for p in rows if not any((h.get(q('anchor')) or '').startswith('nc_ch2_') for h in p.findall('w:hyperlink',N))]
  template=next(p for p in existing if p.findall('w:hyperlink',N))
  for c in structure['captions']:
   if c['kind']==kind:existing.append(entry(template,c['text'],c['anchor']))
  for x in existing:update_pages(x)
  # Locate the same paragraph boundaries in raw XML to preserve all other body bytes.
  import html
  matches=list(re.finditer(rb'<w:p(?=[\s>])[^>]*>.*?</w:p>',raw,re.S))
  def plain(m):return html.unescape(''.join(x.decode() for x in re.findall(rb'<w:t[^>]*>(.*?)</w:t>',m.group())))
  a=next(m for m in matches if plain(m)==label);b=next(m for m in matches if plain(m)==endlabel)
  edits.append((a.end(),b.start(),b''.join(serial(x) for x in existing)))
 for a,b,data in sorted(edits,reverse=True):raw=raw[:a]+data+raw[b:]
 E.fromstring(raw)
 tmp=ROOT/'nav-temp.docx'
 with ZipFile(tmp,'w') as out:
  for info in z.infolist():out.writestr(info,raw if info.filename=='word/document.xml' else z.read(info.filename))
tmp.replace(FILE)
print('TOC extended with',len(structure['headings']),'chapter headings; cached pages updated:',len(pages))
