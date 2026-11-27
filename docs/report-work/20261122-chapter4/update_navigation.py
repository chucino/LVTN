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
 # The latest user export has a stale TOC ending at Chapter 1. Rebuild only
 # this TOC from the actual headings, preserving its edited peer styles.
 for p in list(nc):nc.remove(p)
 headings=[]
 for p in body.findall('w:p',N):
  st=p.find('w:pPr/w:pStyle',N)
  if st is None or st.get(q('val')) not in ('Heading1','Heading2','Heading3'):continue
  label=text(p)
  if not label.strip():continue
  anchors=[b.get(q('name')) for b in p.findall('w:bookmarkStart',N)]
  anchors=[a for a in anchors if a and a!='_GoBack']
  preferred=[a for a in anchors if a.startswith('_heading=')]
  if not anchors:raise ValueError('Missing heading bookmark: '+label)
  anchor=(preferred or anchors)[0];level=int(st.get(q('val'))[-1])
  headings.append({'text':label,'level':level,'anchor':anchor})
  nc.append(entry(peers[level],label,anchor))
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
 # Older chapter entries were exported as ordinary hyperlink paragraphs
 # immediately after the TOC control. Their headings are now in the rebuilt
 # TOC; remove these navigation duplicates, retaining the list heading.
 import html
 matches=list(re.finditer(rb'<w:p(?=[\s>])[^>]*>.*?</w:p>',raw,re.S))
 def plain(m):return html.unescape(''.join(x.decode() for x in re.findall(rb'<w:t[^>]*>(.*?)</w:t>',m.group())))
 nav_end=next(m for m in matches if plain(m)=='DANH MỤC BẢNG VÀ HÌNH')
 between=[m for m in matches if sd.end()<=m.start()<nav_end.start()]
 for m in between:
  # Anchors identify the old generated TOC rows without touching body text.
  if re.search(rb'w:anchor="nc_ch[23]_h_',m.group()) or (not plain(m).strip() and b'<w:sectPr' not in m.group() and b'<w:drawing' not in m.group()):edits.append((m.start(),m.end(),b''))
 # Retain existing table and figure list rows and append the two new captions.
 for label,endlabel,kind in [('Danh mục bảng','Danh mục hình','table'),('Danh mục hình','CAM KẾT KẾT QUẢ','figure')]:
  start=next(x for x in body if text(x)==label);end=next(x for x in body if text(x)==endlabel)
  children=list(body);i=children.index(start);j=children.index(end);rows=children[i+1:j]
  existing=[deepcopy(p) for p in rows if not any((h.get(q('anchor')) or '').startswith('nc_ch4_') for h in p.findall('w:hyperlink',N))]
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
print('TOC rebuilt with',len(headings),'headings; cached pages updated:',len(pages))
