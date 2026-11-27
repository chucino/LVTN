"""Regenerate UML artifacts from the checked description and TypeScript schemas.

Run from the repository root: python docs/diagrams/generate.py
Requires Graphviz (dot). Does not connect to the database or change application code.
"""
from pathlib import Path
import copy
import html
import json
import re
import subprocess
import uuid

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
DOC = ROOT / 'docs/So_Do_Lop_Moi.md'

def uid():
    return uuid.uuid4().hex

def ref(value):
    return {'$ref': value}

def entity(kind, parent=None, **fields):
    return dict(_type=kind, _id=uid(), **({'_parent': ref(parent)} if parent else {}), **fields)

def walk(value):
    if isinstance(value, dict):
        yield value
        for item in value.values():
            yield from walk(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk(item)

def main():
    text = DOC.read_text(encoding='utf-8-sig')
    blocks = re.findall(r'```mermaid\s*\n(.*?)```', text, re.S)
    classes = {}
    for i, block in enumerate(blocks[:2]):
        for name, body in re.findall(r'class (\w+) \{(.*?)\n    \}', block, re.S):
            attrs, operations = [], []
            for line in body.splitlines():
                line = line.strip()
                if not line.startswith(('+', '-')):
                    continue
                if '(' in line:
                    operations.append(line[1:])
                else:
                    typ, field = line[1:].split(' ', 1)
                    attrs.append((field, typ.replace('~', '<', 1).replace('~', '>')))
            stereo = re.search(r'<<(.*?)>>', body)
            classes[name] = dict(attrs=attrs, ops=operations,
                                 stereo=stereo.group(1) if stereo else ('Service' if i else 'Collection'))

    # Reflect optional/null declarations in the diagram; names remain those in the description.
    for path in (ROOT / 'src/modules').glob('*/schemas/*.ts'):
        source = path.read_text(encoding='utf-8')
        parts = re.split(r'export class (\w+) \{', source)
        for i in range(1, len(parts), 2):
            name, body = parts[i:i+2]
            if name not in classes:
                continue
            types = dict(re.findall(r'^  (\w+)[!?]?: ([^;\n]+);', body, re.M))
            optional = set(re.findall(r'^  (\w+)\?:', body, re.M))
            updated = []
            for field, typ in classes[name]['attrs']:
                ts = types.get(field, '')
                if '| null' in ts and ' | null' not in typ:
                    typ += ' | null'
                if field in optional:
                    typ += ' [0..1]'
                if name == 'BuiltinCouponRule' and field in ('devOnly', 'fixedFinalAmount'):
                    typ += ' [0..1]'
                updated.append((field, typ))
            classes[name]['attrs'] = updated
    classes['BuiltinCouponRule']['stereo'] = 'interface'
    classes['BuiltinCouponRule']['attrs'] = [(n, t + (' | null' if n=='maxDiscountAmount' else ' [0..1]' if n in ('devOnly','fixedFinalAmount') else '')) for n,t in classes['BuiltinCouponRule']['attrs']]
    classes['PaymentTransaction']['attrs'] = [(n, 'Record<String, unknown>' if n=='rawPayload' else t) for n,t in classes['PaymentTransaction']['attrs']]
    classes['User']['attrs'] = [(n, t + ' | null' if n in ('dateOfBirth','occupation','avatar') else t) for n,t in classes['User']['attrs']]
    classes['ViolationHistoryItem']['stereo'] = 'EmbeddedStructure'
    classes['User']['attrs'] = [(n, t + ' {derived, readOnly}' if n == 'isActive' else t)
                                 for n, t in classes['User']['attrs']]

    relations = []
    for block in blocks[:2]:
        for line in block.splitlines():
            match = re.match(r'    (\w+)(?: "([^"]+)")? (\*--|-->|\.\.>)(?: "([^"]+)")? (\w+) : (.*)', line)
            if match:
                a, am, kind, bm, b, label = match.groups()
                relations.append(dict(a=a, b=b, am=am or '', bm=bm or '', kind=kind, label=label))

    enums = {}
    for path in (ROOT / 'src').rglob('*.ts'):
        if path.name.endswith('.spec.ts'):
            continue
        source = path.read_text(encoding='utf-8')
        for name, body in re.findall(r'export enum (\w+) \{(.*?)\}', source, re.S):
            enums[name] = re.findall(r"\w+\s*=\s*'([^']+)'", body)
    enums['CourseLevel'] = re.findall(r"'([^']+)'", (ROOT / 'src/common/constants/course-level.constant.ts').read_text(encoding='utf-8').split(']')[0])
    listed = set(re.findall(r'^\| `(\w+)` \|', text.split('## 6.')[1].split('## 7.')[0], re.M))
    enums = {n: v for n,v in enums.items() if n in listed}

    # Store a portable, reviewable inventory alongside the rendered artifacts.
    (OUT / 'model.json').write_text(json.dumps(dict(classes=classes, relations=relations, enums=enums), ensure_ascii=False, indent=2), encoding='utf-8')
    domain = [n for n, c in classes.items() if c['stereo'] not in ('Service', 'Guard')]
    services = [n for n in classes if n not in domain]
    groups = [
        ('00_Tong_Quan', 'NextCode / Sơ đồ lớp tổng quan', domain, True),
        ('01_Nguoi_Dung_Xac_Thuc', 'Người dùng và xác thực', ['User', 'Otp', 'RefreshToken', 'ViolationHistoryItem'], False),
        ('02_Khoa_Hoc_Hoc_Tap', 'Khóa học, học tập và chứng chỉ', ['User','Category','Course','Chapter','Lesson','QuizQuestion','Enrollment','LessonProgress','QuizAttempt','Certificate'], False),
        ('03_Don_Hang_Thanh_Toan', 'Đơn hàng và thanh toán', ['User','Course','Order','PaymentTransaction','BuiltinCouponRule'], False),
        ('04_Tuong_Tac_Kiem_Duyet', 'Hỏi đáp, đánh giá và kiểm duyệt', ['User','Course','Lesson','LessonComment','CommentReplyToUser','CommentReaction','CommentReport','CourseReview','Report','Notification'], False),
        ('05_Dich_Vu', 'Các dịch vụ và guard / phương thức chính', services, False),
    ]

    project = entity('Project', name='NextCode - So do lop da doi chieu')
    model = entity('UMLModel', project['_id'], name='NextCode', ownedElements=[])
    project['ownedElements'] = [model]
    models = {}
    for name, c in classes.items():
        m = entity('UMLClass', model['_id'], name=name, stereotype=c['stereo'], attributes=[], operations=[], ownedElements=[])
        for field, typ in c['attrs']:
            m['attributes'].append(entity('UMLAttribute', m['_id'], name=field, type=typ, visibility='public', isDerived=field=='isActive', isReadOnly=field=='isActive'))
        for op in c['ops']:
            m['operations'].append(entity('UMLOperation', m['_id'], name=op.split('(')[0], visibility='public', documentation=op))
        models[name] = m
        model['ownedElements'].append(m)
    for r in relations:
        a, b = models[r['a']], models[r['b']]
        if r['kind'] == '..>':
            m = entity('UMLDependency', a['_id'], name=r['label'], source=ref(a['_id']), target=ref(b['_id']))
        else:
            m = entity('UMLAssociation', a['_id'], name=r['label'])
            m['end1'] = entity('UMLAssociationEnd', m['_id'], reference=ref(a['_id']), multiplicity=r['am'], aggregation='composite' if r['kind']=='*--' else 'none', navigable='unspecified')
            m['end2'] = entity('UMLAssociationEnd', m['_id'], reference=ref(b['_id']), multiplicity=r['bm'], navigable='unspecified')
        a['ownedElements'].append(m)
        r['model'] = m

    def class_view(name, diagram, x, y, w, h):
        m = models[name]
        v = entity('UMLClassView', diagram['_id'], model=ref(m['_id']), left=x, top=y, width=w, height=h,
                   font='Arial;12;0', fillColor='#ffffff', lineColor='#334155', subViews=[], suppressOperations=not bool(m['operations']))
        for prop, kind, top, height in [('nameCompartment','UMLNameCompartmentView',y,42),
                ('attributeCompartment','UMLAttributeCompartmentView',y+42,max(10,18*len(m['attributes'])+10)),
                ('operationCompartment','UMLOperationCompartmentView',y+52+18*len(m['attributes']),max(10,18*len(m['operations'])+10)),
                ('receptionCompartment','UMLReceptionCompartmentView',y,10),
                ('templateParameterCompartment','UMLTemplateParameterCompartmentView',y,10)]:
            comp = entity(kind, v['_id'], model=ref(m['_id']), left=x, top=top, width=w, height=height, font='Arial;12;0', subViews=[])
            if prop in ('receptionCompartment','templateParameterCompartment'):
                comp['visible'] = False
            if prop=='nameCompartment':
                for key, val, visible, ty in [('stereotypeLabel','«'+classes[name]['stereo']+'»',True,y+5), ('nameLabel',name,True,y+22),('namespaceLabel','',False,y),('propertyLabel','',False,y)]:
                    label = entity('LabelView', comp['_id'], text=val, visible=visible, left=x+5, top=ty, width=w-10, height=16, font='Arial;12;1' if key=='nameLabel' else 'Arial;11;0')
                    comp['subViews'].append(label)
                    comp[key]=ref(label['_id'])
            for j, member in enumerate(m['attributes'] if prop=='attributeCompartment' else m['operations'] if prop=='operationCompartment' else []):
                label = entity('UMLAttributeView' if prop=='attributeCompartment' else 'UMLOperationView', comp['_id'], model=ref(member['_id']), text='+'+member['name']+(': '+member['type'] if 'type' in member else '()'), left=x+6, top=top+5+18*j, width=w-12, height=16, font='Arial;12;0', horizontalAlignment=0)
                comp['subViews'].append(label)
            v['subViews'].append(comp)
            v[prop]=ref(comp['_id'])
        return v

    for stem, title, names, compact in groups:
        subset = [r for r in relations if r['a'] in names and r['b'] in names]
        if compact:
            subset = [r for r in subset if not (
                (r['a']=='User' and r['b'] in ('CommentReplyToUser','CommentReaction','CommentReport','PaymentTransaction'))
                or (r['a']=='Lesson' and r['b'] in ('Notification','Report'))
                or (r['a']=='Course' and r['b'] in ('Notification','PaymentTransaction'))
                or (r['a']=='Enrollment' and r['b']=='Lesson')
            )]
        lines = ['digraph G {', 'graph [rankdir=LR, bgcolor="white", pad=0.4, nodesep=0.65, ranksep=1.3, splines=polyline, outputorder=edgesfirst, fontname="Arial", labelloc=t, label='+json.dumps(title+'\nNextCode | 21-11-2026 | *-- composition; -- association; ..> dependency', ensure_ascii=False)+'];', 'node [shape=plain, fontname="Arial"];', 'edge [fontname="Arial", fontsize=10, color="#64748b", arrowsize=0.7];']
        for name in names:
            c = classes[name]
            fields = c['attrs']
            rows = ['+ '+f+': '+t for f,t in fields]
            if not compact:
                rows += ['+ '+op for op in c['ops']]
            color = '#e0f2fe' if c['stereo']=='Collection' else '#f1f5f9' if c['stereo'] in ('Service','Guard') else '#fef3c7'
            head = html.escape('«'+c['stereo']+'»')+'<BR/><B>'+name+'</B>'
            body = ''.join(html.escape(row)+'<BR ALIGN="LEFT"/>' for row in rows) or ' '
            lines.append(f'{name} [label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="8" COLOR="#334155"><TR><TD BGCOLOR="{color}">{head}</TD></TR><HR/><TR><TD ALIGN="LEFT">{body}</TD></TR></TABLE>>];')
        for i,r in enumerate(subset):
            opts = dict(label=r['label'], arrowhead='none', taillabel=r['am'], headlabel=r['bm'], id='edge'+str(i))
            if r['kind']=='*--': opts.update(dir='both', arrowtail='diamond')
            if r['kind']=='..>': opts.update(style='dashed', arrowhead='vee')
            lines.append(f"{r['a']} -> {r['b']} ["+', '.join(k+'='+json.dumps(v) for k,v in opts.items())+'];')
        lines.append('}')
        dot = OUT / (stem+'.dot')
        dot.write_text('\n'.join(lines), encoding='utf-8')
        for fmt in ('svg','png'):
            cmd=['dot','-T'+fmt,str(dot),'-o',str(OUT/(stem+'.'+fmt))]
            if fmt=='png':cmd.insert(1,'-Gsize=24,24')
            subprocess.run(cmd,check=True,capture_output=True)
        layout=json.loads(subprocess.check_output(['dot','-Tjson',str(dot)]))
        _,_,_,maxy=map(float,layout['bb'].split(','))
        diagram=entity('UMLClassDiagram',model['_id'],name=stem,ownedViews=[],defaultDiagram=stem.startswith('00'))
        model['ownedElements'].append(diagram)
        views={}
        # Full attributes in StarUML, including the overview, with generous spacing.
        scale=2.4 if compact else 1.6
        for node in layout['objects']:
            name=node['name']
            if name not in names:continue
            px,py=map(float,node['pos'].split(','))
            w=max(310,float(node['width'])*72)
            h=max(float(node['height'])*72,64+18*(len(models[name]['attributes'])+len(models[name]['operations'])))
            v=class_view(name,diagram,round(px*scale-w/2+40),round((maxy-py)*scale-h/2+40),round(w),round(h))
            views[name]=v
            diagram['ownedViews'].append(v)
        for i,r in enumerate(subset):
            m=r['model'];a=views[r['a']];b=views[r['b']]
            x1,y1=a['left']+a['width']/2,a['top']+a['height']/2
            x2,y2=b['left']+b['width']/2,b['top']+b['height']/2
            graph_edge = next(e for e in layout['edges'] if e.get('id')=='edge'+str(i))
            route = re.findall(r'(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)', re.sub(r'[es],-?[\d.]+,-?[\d.]+\s*', '', graph_edge.get('pos','')))
            points=';'.join(f'{round(float(px)*scale+40)}:{round((maxy-float(py))*scale+40)}' for px,py in route) if route else f'{x1}:{y1};{x2}:{y2}'
            if a is b:points=f'{x1}:{y1};{a["left"]-70}:{y1};{a["left"]-70}:{a["top"]-40};{x1}:{a["top"]-40};{x1}:{a["top"]}'
            edge=entity('UMLDependencyView' if r['kind']=='..>' else 'UMLAssociationView',diagram['_id'],model=ref(m['_id']),head=ref(b['_id']),tail=ref(a['_id']),lineStyle=1,points=points,subViews=[],font='Arial;11;0',showMultiplicity=True)
            for key,val,pos,target in [('nameLabel',r['label'],1,m['_id']),('stereotypeLabel','',1,m['_id']),('propertyLabel','',1,m['_id'])]+([] if r['kind']=='..>' else [('tailMultiplicityLabel',r['am'],2,m['end1']['_id']),('headMultiplicityLabel',r['bm'],0,m['end2']['_id']),('tailRoleNameLabel','',2,m['end1']['_id']),('headRoleNameLabel','',0,m['end2']['_id']),('tailPropertyLabel','',2,m['end1']['_id']),('headPropertyLabel','',0,m['end2']['_id'])]):
                lab=entity('EdgeLabelView',edge['_id'],model=ref(target),hostEdge=ref(edge['_id']),text=val,visible=bool(val),edgePosition=pos,alpha=0.6,distance=20,left=(x1+x2)/2,top=(y1+y2)/2,width=max(20,len(val)*6),height=14,font='Arial;11;0')
                edge['subViews'].append(lab);edge[key]=ref(lab['_id'])
            diagram['ownedViews'].append(edge)

    for name, values in enums.items():
        e=entity('UMLEnumeration',model['_id'],name=name,literals=[])
        e['literals']=[entity('UMLEnumerationLiteral',e['_id'],name=v) for v in values]
        model['ownedElements'].append(e)
    ids=[x['_id'] for x in walk(project) if '_id' in x]
    assert len(ids)==len(set(ids)), 'Duplicate IDs'
    idset=set(ids)
    missing=[x['$ref'] for x in walk(project) if '$ref' in x and x['$ref'] not in idset]
    assert not missing, missing
    (OUT/'So_Do_Lop_NextCode.mdj').write_text(json.dumps(project,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Generated {len(classes)} classes, {len(enums)} enum/constants, {len(relations)} relationships, {len(groups)} diagrams. StarUML references valid.')

if __name__=='__main__':
    main()
