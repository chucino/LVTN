const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');const ts=require(path.join(root,'node_modules/typescript'));
const out={};
function walk(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);if(e.isDirectory())walk(p);
  else if(e.name.endsWith('.schema.ts')){
   const sf=ts.createSourceFile(p,fs.readFileSync(p,'utf8'),ts.ScriptTarget.Latest,true);
   for(const node of sf.statements)if(ts.isClassDeclaration(node)){
    out[node.name.text]={path:path.relative(root,p).replaceAll('\\','/'),fields:node.members.filter(ts.isPropertyDeclaration).map(m=>m.name.getText(sf))};
   }
  }
 }
}
walk(path.join(root,'src/modules'));
fs.writeFileSync(path.join(__dirname,'actual-class-fields.json'),JSON.stringify(out,null,2));
console.log('Extracted class fields from actual TypeScript:',Object.keys(out).length);
