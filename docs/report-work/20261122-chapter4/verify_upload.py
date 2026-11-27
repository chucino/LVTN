from pathlib import Path
import json,urllib.request,hashlib
R=Path(__file__).resolve().parent
job=R/'download-job.json'
j=json.loads(job.read_text(encoding='utf-8'))
with urllib.request.urlopen(j['url']) as f:
 data=f.read()
(R/'published-readback.docx').write_bytes(data)
local=(R/'LUANVAN_updated.docx').read_bytes()
assert data==local,'Drive readback differs from verified local document'
proof={'file_id':'1Zmk82SqyhpA7KK8TINmVPHbI3ByaK2ED','size':len(data),
 'sha256':hashlib.sha256(data).hexdigest(),'readback_matches':True,'modified_time':j.get('modified_time')}
(R/'publish-proof.json').write_text(json.dumps(proof,indent=2),encoding='utf-8')
job.unlink()
print(json.dumps(proof,indent=2))
