from pathlib import Path
import json
import pypdfium2 as pdfium
from PIL import Image, ImageOps, ImageDraw

WORK = Path(__file__).resolve().parent
QA = WORK / 'qa'
pdf = pdfium.PdfDocument(str(QA / 'revised.pdf'))
pages = []
intro_pages = []
for i in range(len(pdf)):
    page = pdf[i]
    txt = page.get_textpage().get_text_range()
    pages.append({'page': i+1, 'text': txt})
    im = page.render(scale=1.5).to_pil().convert('RGB')
    im.save(QA / f'page-{i+1}.png')
    if 'PHẦN I GIỚI THIỆU' in txt and i > 7:
        intro_pages.append(i+1)
for j in range(0,len(pdf),4):
    sheet = Image.new('RGB', (1800, 2590), '#ddd')
    draw = ImageDraw.Draw(sheet)
    for k, i in enumerate(range(j, min(j+4, len(pdf)))):
        im=Image.open(QA / f'page-{i+1}.png')
        im.thumbnail((880,1245))
        x=(k%2)*900+10; y=(k//2)*1295+32
        sheet.paste(im,(x,y))
        draw.text((x,y-22),f'PAGE {i+1}',fill='black')
    sheet.save(QA/f'sheet-{j//4+1}.png')
QA.joinpath('rendered-text.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf-8')
print('Pages:',len(pdf))
for p in pages:
    print(p['page'], p['text'][:95].replace('\r','').replace('\n',' | '))

ref=Path(r'C:\Users\congchuc\OneDrive - zzz\đề tài luận văn\báo cáo\B2110156_TaQuangVinh_Xây dựng hệ thống freelance marketplace dùng ReactJS và Java Spring có tích hợp hệ thống gợi ý và chatbot.pdf')
rp=pdfium.PdfDocument(str(ref))
for idx, group in enumerate([[18,19,20,21],[22,23,24,25],[26,27,30,101],[129,141,184,206]]):
    sheet=Image.new('RGB',(1800,2590),'#ddd'); draw=ImageDraw.Draw(sheet)
    for k,i in enumerate(group):
        im=rp[i].render(scale=1.5).to_pil().convert('RGB'); im.thumbnail((880,1245))
        x=(k%2)*900+10; y=(k//2)*1295+32
        sheet.paste(im,(x,y));draw.text((x,y-22),f'REFERENCE PAGE {i+1}',fill='black')
    sheet.save(QA/f'reference-sheet-{idx+1}.png')
