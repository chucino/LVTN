from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
import json,hashlib
R=Path(__file__).resolve().parent
j=json.loads((R/'test-results.json').read_text(encoding='utf-8'))
c=json.loads((R/'coverage/coverage-summary.json').read_text(encoding='utf-8'))
files=[]
for f in j['testResults']:
 p=Path(f['name']);cases=[]
 for a in f['assertionResults']:cases.append({'title':a['title'],'status':a['status'],'duration_ms':a.get('duration'),'full_name':a.get('fullName')})
 files.append({'file':p.name,'count':len(cases),'status':f['status'],'cases':cases})
result={'total_tests':j['numTotalTests'],'passed_tests':j['numPassedTests'],'failed_tests':j['numFailedTests'],
 'pending_tests':j['numPendingTests'],'todo_tests':j['numTodoTests'],'success':j['success'],
 'file_count':len(files),'start_epoch_ms':j['startTime'],'end_epoch_ms':max(x['endTime'] for x in j['testResults']),
 'coverage_totals':c['total'],'coverage_file_count':len(c)-1,'files':files,
 'service_coverage':{Path(k.replace('\\','/')).name:v for k,v in c.items() if k.endswith('.service.ts')},
 'source_hashes':{str(p.relative_to(R.parents[2])).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in R.parents[2].glob('src/**/*.spec.ts')},
}
(R/'test-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('RESULT', {k:result[k] for k in ('total_tests','passed_tests','failed_tests','file_count','coverage_file_count')})
print('COVERAGE',result['coverage_totals'])
print('FILES',[(x['file'],x['count']) for x in files])
print('SERVICES',[(k,v['lines']['pct']) for k,v in result['service_coverage'].items()])
with ZipFile(R/'source-drive.docx') as z:
 root=E.fromstring(z.read('word/document.xml'));N={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'};W=N['w']
 for s in root.findall('.//w:sdtContent',N):print('SDT',len(s),'LAST', [''.join(p.xpath('.//w:t/text()',namespaces=N)) for p in list(s)[-3:]])
 heads=[p for p in root.findall('w:body/w:p',N) if p.find('w:pPr/w:pStyle',N) is not None and p.find('w:pPr/w:pStyle',N).get('{'+W+'}val') in ('Heading1','Heading2','Heading3')]
 print('BODY HEADINGS',len(heads))
 for p in heads[-3:]:print('LAST HEADING',''.join(p.xpath('.//w:t/text()',namespaces=N)),[x.get('{'+W+'}name') for x in p.findall('w:bookmarkStart',N)])
