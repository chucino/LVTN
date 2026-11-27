from pathlib import Path
import json
import pypdfium2 as pdfium
from PIL import Image,ImageDraw

R=Path(__file__).resolve().parent/'qa'
pdf=pdfium.PdfDocument(str(R/'revised.pdf'))
pages=[]
for i in range(len(pdf)):
 p=pdf[i];t=p.get_textpage().get_text_range();pages.append({'page':i+1,'text':t})
 p.render(scale=1.5).to_pil().convert('RGB').save(R/f'page-{i+1}.png')
for j in range(0,len(pdf),4):
 s=Image.new('RGB',(1800,2590),'#dddddd');d=ImageDraw.Draw(s)
 for k,i in enumerate(range(j,min(j+4,len(pdf)))):
  im=Image.open(R/f'page-{i+1}.png');im.thumbnail((880,1245))
  x=(k%2)*900+10;y=(k//2)*1295+32
  s.paste(im,(x,y));d.text((x,y-22),f'PAGE {i+1}',fill='black')
 s.save(R/f'sheet-{j//4+1}.png')
(R/'rendered-text.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf-8')
print('Rendered',len(pdf),'pages')
