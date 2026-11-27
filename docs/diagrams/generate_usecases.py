"""Convert the five supplied PlantUML use-case diagrams into native StarUML models.

Usage: python docs/diagrams/generate_usecases.py [source-directory]
Only the five .mdj deliverables are written to diagrams/usecase/.
Graphviz is used locally for layout; no content is sent to a remote service.
"""
import argparse
import json
from pathlib import Path
import re
import subprocess
import tempfile
import uuid

OUT = Path(__file__).resolve().parent / 'usecase'
DEFAULT_SOURCE = Path(r'C:\Users\congchuc\OneDrive - zzz\đề tài luận văn\class\NextCode_5_SoDo_UseCase_PlantUML')

def ref(value):
    return {'$ref': value}

def obj(kind, parent=None, **props):
    return dict(_type=kind, _id=uuid.uuid4().hex,
                **({'_parent': ref(parent)} if parent else {}), **props)

def walk(value):
    if isinstance(value, dict):
        yield value
        for v in value.values():
            yield from walk(v)
    elif isinstance(value, list):
        for v in value:
            yield from walk(v)

def parse(path):
    source = path.read_text(encoding='utf-8-sig')
    groups, nodes, relations, stack = [], {}, [], []
    for raw in source.splitlines():
        line = raw.strip()
        if line.startswith("'"):
            continue
        g = re.fullmatch(r'(rectangle|package) "([^"]+)" \{', line)
        if g:
            index = len(groups)
            groups.append(dict(kind=g[1], name=g[2], parent=stack[-1] if stack else None))
            stack.append(index)
        elif line == '}':
            if stack:
                stack.pop()
        n = re.fullmatch(r'(actor|usecase) "([^"]+)" as (\w+)', line)
        if n:
            assert n[3] not in nodes
            nodes[n[3]] = dict(kind=n[1], name=n[2].replace('\\n','\n'), group=stack[-1] if stack else None)
        edge = re.fullmatch(r'(\w+)\s+(-->|\.\.>)\s+(\w+)(?:\s*:\s*(.*))?', line)
        if edge:
            a, arrow, b, label = edge.groups()
            label = (label or '').replace('\\n','\n')
            kind = 'include' if '<<include>>' in label else 'extend' if '<<extend>>' in label else 'association'
            condition = re.sub(r'<<\w+>>', '', label).strip()
            relations.append(dict(a=a,b=b,kind=kind,label=condition))
    for r in relations:
        assert r['a'] in nodes and r['b'] in nodes, r
    assert source.count('  usecase "') == sum(n['kind']=='usecase' for n in nodes.values())
    return dict(title=re.search(r'^title (.+)$', source, re.M)[1], groups=groups, nodes=nodes, relations=relations,
                direction='TB' if 'top to bottom direction' in source else 'LR')

def layout(data):
    if not any(n['kind']=='actor' for n in data['nodes'].values()):
        return layout_relationship_groups(data)
    q=lambda x: json.dumps(x, ensure_ascii=False)
    lines=['digraph G {',f'graph [rankdir={data["direction"]}, nodesep=0.6, ranksep=1.3, pad=0.4, splines=polyline, compound=true, newrank=true];',
           'node [fontname="Arial", fontsize=13, margin="0.22,0.15"];',
           'edge [fontname="Arial", fontsize=11, arrowsize=0.65];']
    def emit_nodes(group):
        for name,n in data['nodes'].items():
            if n['group'] != group:
                continue
            shape='plaintext' if n['kind']=='actor' else 'ellipse'
            lines.append(f'{name} [shape={shape}, width={2.1 if n["kind"]=="actor" else 3.8}, height={1.7 if n["kind"]=="actor" else 1.2}, label={q(n["name"])}];')
    def emit_group(index):
        g=data['groups'][index]
        lines.extend([f'subgraph cluster_g{index} {{', 'label='+q(g['name'])+'; fontname="Arial"; fontsize=14; margin=35;'])
        emit_nodes(index)
        for j,child in enumerate(data['groups']):
            if child['parent']==index:
                emit_group(j)
        lines.append('}')
    emit_nodes(None)
    for i,g in enumerate(data['groups']):
        if g['parent'] is None:
            emit_group(i)
    humans=[k for k,n in data['nodes'].items() if n['kind']=='actor' and k not in ('SMTP','PayOS')]
    external=[k for k in ('SMTP','PayOS') if k in data['nodes']]
    if humans:lines.append('{rank=source; '+';'.join(humans)+';}')
    if external:lines.append('{rank=sink; '+';'.join(external)+';}')
    for i,r in enumerate(data['relations']):
        label=('«'+r['kind']+'»' if r['kind']!='association' else '')+ ('\n'+r['label'] if r['label'] else '')
        style='dashed' if r['kind']!='association' else 'solid'
        lines.append(f'{r["a"]} -> {r["b"]} [id="edge{i}", label={q(label)}, style={style}];')
    lines.append('}')
    dot='\n'.join(lines)
    result=json.loads(subprocess.check_output(['dot','-Tjson'],input=dot.encode('utf-8')))
    return result, dot

def layout_relationship_groups(data):
    """Stack disconnected relationship families inside the two source boundaries."""
    q=lambda x:json.dumps(x,ensure_ascii=False)
    components=[]
    max_width=0
    heights=[]
    for gi in range(len(data['groups'])):
        todo=[name for name,n in data['nodes'].items() if n['group']==gi]
        family=[]
        while todo:
            seen={todo.pop(0)}
            while True:
                expanded=seen|{r['b'] for r in data['relations'] if r['a'] in seen}|{r['a'] for r in data['relations'] if r['b'] in seen}
                if expanded==seen:break
                seen=expanded
            todo=[n for n in todo if n not in seen]
            ordered=[n for n in data['nodes'] if n in seen]
            lines=['digraph G {','graph [rankdir=TB, ranksep=0.9, nodesep=0.5, splines=polyline];','node [shape=ellipse, fontname="Arial", fontsize=13, width=3.5, height=1.05, margin="0.2,0.1"];','edge [fontname="Arial", fontsize=11];']
            for name in ordered:lines.append(f'{name} [label={q(data["nodes"][name]["name"])}];')
            for i,r in enumerate(data['relations']):
                if r['a'] not in seen:continue
                label='«'+r['kind']+'»'+ ('\n'+r['label'] if r['label'] else '')
                lines.append(f'{r["a"]} -> {r["b"]} [id="edge{i}", style=dashed, label={q(label)}];')
            lines.append('}')
            result=json.loads(subprocess.check_output(['dot','-Tjson'],input='\n'.join(lines).encode('utf-8')))
            w,h=map(float,result['bb'].split(',')[2:])
            max_width=max(max_width,w)
            family.append((result,w,h))
        components.append(family)
        heights.append(sum(h+75 for _,_,h in family)+90)
    total_height=max(heights)
    group_width=max_width+110
    graph=dict(bb=f'0,0,{group_width*len(data["groups"])+60},{total_height}',objects=[],edges=[])
    preview=['digraph G {','graph [layout=neato, overlap=true];','node [shape=ellipse, fontname="Arial", fontsize=13];','edge [fontname="Arial", fontsize=11];']
    for gi,family in enumerate(components):
        left=gi*(group_width+30)
        graph['objects'].append(dict(name='cluster_g'+str(gi),bb=f'{left},0,{left+group_width},{total_height}'))
        preview.extend([f'subgraph cluster_g{gi} {{','label='+q(data['groups'][gi]['name'])+'; fontname="Arial"; fontsize=14;'])
        top=total_height-75
        for part,w,h in family:
            dx=left+(group_width-w)/2
            dy=top-h
            def translate_pair(match):
                return f'{float(match[1])+dx:.3f},{float(match[2])+dy:.3f}'
            for n in part['objects']:
                n['pos']=re.sub(r'(-?[\d.]+),(-?[\d.]+)',translate_pair,n['pos'])
                graph['objects'].append(n)
                preview.append(f'{n["name"]} [label={q(data["nodes"][n["name"]]["name"])}, pos={q(n["pos"]+"!")}, width={n["width"]}, height={n["height"]}];')
            for e in part['edges']:
                e['pos']=re.sub(r'(-?[\d.]+),(-?[\d.]+)',translate_pair,e['pos'])
                e['lp']=re.sub(r'(-?[\d.]+),(-?[\d.]+)',translate_pair,e['lp'])
                graph['edges'].append(e)
                ri=int(e['id'][4:]);r=data['relations'][ri]
                label='«'+r['kind']+'»'+ ('\n'+r['label'] if r['label'] else '')
                preview.append(f'{r["a"]} -> {r["b"]} [style=dashed, label={q(label)}, pos={q(e["pos"])}, lp={q(e["lp"])}];')
            top=dy-75
        preview.append('}')
    preview.append('}')
    return graph,'\n'.join(preview)

def build(path, qa):
    data=parse(path)
    graph,dot=layout(data)
    maxy=float(graph['bb'].split(',')[3])
    # Leave additional space for StarUML's own label measurement and actor symbols.
    scale=1.3
    xy=lambda x,y:(round(float(x)*scale+60),round((maxy-float(y))*scale+60))
    graph_nodes={n['name']:n for n in graph['objects']}
    project=obj('Project',name=path.stem,documentation=f'Chuyển từ {path.name}. Giữ nguyên nội dung và chiều quan hệ trong PlantUML nguồn.')
    model=obj('UMLModel',project['_id'],name='NextCode',ownedElements=[])
    project['ownedElements']=[model]
    diagram=obj('UMLUseCaseDiagram',model['_id'],name=path.stem,defaultDiagram=True,ownedViews=[],documentation=data['title'])
    model['ownedElements'].append(diagram)
    groups={}
    group_views={}
    models={}
    views={}
    def bounds(n):
        if 'bb' in n:
            l,b,r,t=map(float,n['bb'].split(',')); x,y=xy(l,t)
            return x,y,round((r-l)*scale),round((t-b)*scale)
        px,py=map(float,n['pos'].split(','));w=float(n['width'])*72;h=float(n['height'])*72
        x,y=xy(px-w/2,py+h/2)
        return x,y,round(w*scale),round(h*scale)

    def node_view(kind,m,box,container=None,actor=False,group=False):
        x,y,w,h=box
        v=obj(kind,diagram['_id'],model=ref(m['_id']),left=x,top=y,width=w,height=h,
              font='Arial;13;0',lineColor='#315A7D',fillColor='#FFFFFF' if group or actor else '#F7FBFF',
              fontColor='#172B3A',parentStyle=False,showShadow=False,wordWrap=True,
              showVisibility=False,showNamespace=False,showProperty=False,subViews=[],containedViews=[])
        if container:
            v['containerView']=ref(container['_id']);container['containedViews'].append(ref(v['_id']))
        if actor:v['stereotypeDisplay']='icon'
        nc=obj('UMLNameCompartmentView',v['_id'],model=ref(m['_id']),left=x,top=y if group else y+max(0,(h-65)//2),width=w,height=55,font='Arial;13;0',parentStyle=True,wordWrap=True,subViews=[])
        for key,text,visible,top in [('nameLabel',m['name'],True,nc['top']+8),('stereotypeLabel','',False,y),('namespaceLabel','',False,y),('propertyLabel','',False,y)]:
            label=obj('LabelView',nc['_id'],text=text,visible=visible,left=x+12,top=top,width=w-24,height=55 if not group else 28,
                      font='Arial;13;1' if group else 'Arial;13;0',parentStyle=True,wordWrap=True,horizontalAlignment=2)
            nc['subViews'].append(label);nc[key]=ref(label['_id'])
        v['subViews'].append(nc);v['nameCompartment']=ref(nc['_id'])
        if not group:
            for key,typ in [('attributeCompartment','UMLAttributeCompartmentView'),('operationCompartment','UMLOperationCompartmentView'),('receptionCompartment','UMLReceptionCompartmentView'),('templateParameterCompartment','UMLTemplateParameterCompartmentView')]+([] if actor else [('extensionPointCompartment','UMLExtensionPointCompartmentView')]):
                c=obj(typ,v['_id'],model=ref(m['_id']),visible=False,left=x,top=y,width=w,height=0,font='Arial;13;0',parentStyle=True,subViews=[])
                v['subViews'].append(c);v[key]=ref(c['_id'])
            v.update(suppressAttributes=True,suppressOperations=True,suppressReceptions=True)
        return v

    for i,g in enumerate(data['groups']):
        parent=groups[g['parent']] if g['parent'] is not None else model
        m=obj('UMLUseCaseSubject' if g['kind']=='rectangle' else 'UMLPackage',parent['_id'],name=g['name'],ownedElements=[])
        parent['ownedElements'].append(m);groups[i]=m
        v=node_view('UMLUseCaseSubjectView' if g['kind']=='rectangle' else 'UMLPackageView',m,bounds(graph_nodes['cluster_g'+str(i)]),group_views.get(g['parent']),group=True)
        group_views[i]=v;diagram['ownedViews'].append(v)
    for name,n in data['nodes'].items():
        parent=groups[n['group']] if n['group'] is not None else model
        m=obj('UMLActor' if n['kind']=='actor' else 'UMLUseCase',parent['_id'],name=n['name'],ownedElements=[])
        parent['ownedElements'].append(m);models[name]=m
        v=node_view('UMLActorView' if n['kind']=='actor' else 'UMLUseCaseView',m,bounds(graph_nodes[name]),group_views.get(n['group']),actor=n['kind']=='actor')
        views[name]=v;diagram['ownedViews'].append(v)
    for i,r in enumerate(data['relations']):
        a,b=models[r['a']],models[r['b']]
        typ='UMLInclude' if r['kind']=='include' else 'UMLExtend' if r['kind']=='extend' else 'UMLAssociation'
        m=obj(typ,a['_id'],name=r['label'] if r['kind']=='association' else '')
        if r['kind']=='association':
            m['end1']=obj('UMLAssociationEnd',m['_id'],reference=ref(a['_id']),navigable='unspecified')
            m['end2']=obj('UMLAssociationEnd',m['_id'],reference=ref(b['_id']),navigable='navigable')
        else:
            m.update(source=ref(a['_id']),target=ref(b['_id']))
            if r['kind']=='extend':m['condition']=r['label'].strip('[]')
        a['ownedElements'].append(m)
        e=next(e for e in graph['edges'] if e.get('id')=='edge'+str(i))
        pos=e['pos']
        end=re.search(r'e,(-?[\d.]+),(-?[\d.]+)',pos)
        pos=re.sub(r'[es],-?[\d.]+,-?[\d.]+\s*','',pos)
        pts=[xy(x,y) for x,y in re.findall(r'(-?[\d.]+),(-?[\d.]+)',pos)]
        if end:pts.append(xy(end[1],end[2]))
        # Graphviz emits cubic control points, valid as a polyline after removing duplicates.
        points=[]
        for point in pts:
            if not points or point!=points[-1]:points.append(point)
        assert len(points)>1
        v=obj(typ+'View',diagram['_id'],model=ref(m['_id']),tail=ref(views[r['a']]['_id']),head=ref(views[r['b']]['_id']),
              lineStyle=1,points=';'.join(f'{x}:{y}' for x,y in points),font='Arial;12;0',lineColor='#52677A',fontColor='#172B3A',
              parentStyle=False,showShadow=False,showVisibility=False,showProperty=True,subViews=[])
        if r['kind']=='association':v['showMultiplicity']=False
        lx,ly=xy(*e['lp'].split(',')) if 'lp' in e else points[len(points)//2]
        labels=[('nameLabel',r['label'] if r['kind']=='association' else '',m['_id']),
                ('stereotypeLabel','«'+r['kind']+'»' if r['kind']!='association' else '',m['_id']),
                ('propertyLabel',r['label'] if r['kind']=='extend' else '',m['_id'])]
        if r['kind']=='association':
            labels += [(key,'',m[end]['_id']) for key,end in [('tailRoleNameLabel','end1'),('tailMultiplicityLabel','end1'),('tailPropertyLabel','end1'),('headRoleNameLabel','end2'),('headMultiplicityLabel','end2'),('headPropertyLabel','end2')]]
        for key,text,target in labels:
            lab=obj('EdgeLabelView',v['_id'],model=ref(target),hostEdge=ref(v['_id']),text=text,visible=bool(text),font='Arial;12;0',parentStyle=True,
                    edgePosition=1,alpha=1.5707963267948966,distance=16 if key!='propertyLabel' else 35,
                    left=lx-150,top=ly-14,width=300,height=30,wordWrap=True)
            v['subViews'].append(lab);v[key]=ref(lab['_id'])
        diagram['ownedViews'].append(v)
    # Title inside the diagram, above the system boundaries.
    diagram['ownedViews'].insert(0,obj('UMLTextView',diagram['_id'],text=data['title'],left=60,top=12,width=1600,height=36,font='Arial;18;1',wordWrap=True,showShadow=False,fontColor='#172B3A'))
    validate(project,data)
    output=OUT/(path.stem+'.mdj')
    output.write_text(json.dumps(project,ensure_ascii=False,indent=2),encoding='utf-8')
    qa.mkdir(parents=True,exist_ok=True)
    (qa/(path.stem+'.dot')).write_text(dot,encoding='utf-8')
    engine=['dot'] if any(n['kind']=='actor' for n in data['nodes'].values()) else ['neato','-n2']
    subprocess.run(engine+['-Tpng','-Gsize=20,24','-o',str(qa/(path.stem+'.png'))],input=dot.encode('utf-8'),check=True,capture_output=True)
    print(f'{output.name}: {sum(n["kind"]=="actor" for n in data["nodes"].values())} actors; {sum(n["kind"]=="usecase" for n in data["nodes"].values())} use cases; {len(data["relations"])} relationships')

def validate(project,data):
    all_objects=list(walk(project))
    ids=[v['_id'] for v in all_objects if '_id' in v]
    assert len(ids)==len(set(ids))
    assert all(v['$ref'] in ids for v in all_objects if '$ref' in v)
    assert sum(v.get('_type')=='UMLUseCase' for v in all_objects)==sum(n['kind']=='usecase' for n in data['nodes'].values())
    assert sum(v.get('_type') in ('UMLInclude','UMLExtend','UMLAssociation') for v in all_objects)==len(data['relations'])
    # Validate serialized fields/types against the installed StarUML metamodel.
    meta={}
    for file in [Path(r'C:\Program Files\StarUML\resources\default\metamodel.json'),Path(r'C:\Program Files\StarUML\extensions\essential\uml\metamodel.json')]:
        if file.exists():meta.update(json.loads(file.read_text(encoding='utf-8')))
    if meta:
        for v in all_objects:
            if '_type' not in v:continue
            assert v['_type'] in meta, v['_type']
            attrs={};kind=v['_type']
            while kind:
                definition=meta[kind]
                attrs.update({a['name']:a for a in definition.get('attributes',[])})
                kind=definition.get('super')
            for key,value in v.items():
                assert key=='_type' or key in attrs,(v['_type'],key)
                if key in attrs and attrs[key]['kind']=='enum':
                    assert value in meta[attrs[key]['type']]['literals'],(key,value)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',nargs='?',type=Path,default=DEFAULT_SOURCE)
    args=parser.parse_args()
    files=sorted(args.source.glob('0[1-5]_usecase_*.puml'))
    assert len(files)==5, f'Expected 5 supplied PlantUML files; found {len(files)}'
    OUT.mkdir(parents=True,exist_ok=True)
    for file in files:build(file,Path(tempfile.gettempdir())/'nextcode-usecase-qa')
