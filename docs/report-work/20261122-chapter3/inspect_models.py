from pathlib import Path
import json, re
R=Path(__file__).resolve().parent
def walk(v):
 if isinstance(v,dict):
  yield v
  for x in v.values():yield from walk(x)
 elif isinstance(v,list):
  for x in v:yield from walk(x)
classes=[]
for x in walk(json.loads((R/'class-reference.mdj').read_text(encoding='utf-8'))):
 if x.get('_type')=='UMLClass':classes.append({'name':x.get('name'),'fields':[(a.get('name'),a.get('type')) for a in x.get('attributes',[])]})
(R/'class-reference-summary.json').write_text(json.dumps(classes,ensure_ascii=False,indent=2),encoding='utf-8')
print('Class reference:',[(x['name'],len(x['fields'])) for x in classes])
names=[]
for p in (R.parent/'20261122-chapter1').glob('0*.mdj'):
 for x in walk(json.loads(p.read_text(encoding='utf-8'))):
  if x.get('_type')=='UMLUseCase':names.append(x.get('name'))
print('Use cases:',sorted(set(names)))
