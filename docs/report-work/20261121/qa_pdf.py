from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw
import pypdfium2 as pdfium
import json, re, sys

out = Path(__file__).resolve().parent
name = sys.argv[1] if len(sys.argv)>1 else 'luanvan-qa-1.pdf'
path = out/name
stem = path.stem
reader=PdfReader(path)
pages=[]
for i,page in enumerate(reader.pages):
    raw=page.extract_text() or ''
    normalized=re.sub(r'\s+',' ',raw).strip()
    pages.append({'page':i+1,'text':normalized,'chars':len(normalized)})
(out/(stem+'-pages.json')).write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf-8')
doc=pdfium.PdfDocument(path)
ims=[]
for i,page in enumerate(doc):
    im=page.render(scale=1.25).to_pil().convert('RGB')
    im.save(out/(stem+'-page-'+str(i+1)+'.png'))
    ims.append(im)
for k in range(0,len(ims),6):
    sheet=Image.new('RGB',(1500,1450),'#dddddd')
    for j,im in enumerate(ims[k:k+6]):
        small=ImageOps.contain(im,(480,680))
        x=(j%3)*500+10; y=(j//3)*725+25
        sheet.paste(small,(x,y))
        ImageDraw.Draw(sheet).text((x,y-17),str(k+j+1),fill='black')
    sheet.save(out/(stem+'-sheet-'+str(k//6+1)+'.png'))
print(json.dumps({'pages':len(pages),'summary':[{'page':p['page'],'chars':p['chars'],'start':p['text'][:85],'end':p['text'][-65:]} for p in pages]},ensure_ascii=False))
