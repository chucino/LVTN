from pathlib import Path
import re, json, hashlib

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
records = []
chunks = []
for base in ['src', 'client/src']:
    for p in sorted((root / base).rglob('*')):
        if not p.is_file() or p.suffix not in ['.ts', '.vue', '.css', '.svg']:
            continue
        raw = p.read_bytes()
        t = raw.decode('utf-8-sig')
        relative = p.relative_to(root).as_posix()
        methods = []
        relevant = []
        for n, line in enumerate(t.splitlines(), 1):
            st = line.strip()
            if re.search(r'\b(async\s+\w+\s*\(|(?:function|class|interface|enum)\s+\w+|(?:describe|it|test)\s*\()', st):
                methods.append({'line': n, 'declaration': st[:220]})
            if re.search(r'@(Get|Post|Patch|Put|Delete|Roles|Controller|Public)|summary:|throw new|(?:title|label|description|roles|path):|requiredPassPercent|0\.6|OrderStatus\.|CourseStatus\.', st):
                relevant.append(f'{n}: {st[:220]}')
        records.append({'file': relative, 'lines': len(t.splitlines()), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(), 'declarations': methods})
        chunks.append(relative + '\n' + '\n'.join(relevant))
(out / 'source-inventory.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
(out / 'source-business-index.txt').write_text('\n\n'.join(chunks), encoding='utf-8')
print(json.dumps({'files_read': len(records), 'lines': sum(x['lines'] for x in records), 'bytes': sum(x['bytes'] for x in records), 'output': str(out / 'source-inventory.json')}, ensure_ascii=False))
