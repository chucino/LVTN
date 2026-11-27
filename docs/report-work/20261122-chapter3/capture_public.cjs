const fs=require('node:fs');const path=require('node:path');
const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1119-907-0_26.1119.907.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const response=await fetch('http://127.0.0.1:3000/api/v1/courses?limit=12');const data=await response.json();
 const payload=data.data;const items=Array.isArray(payload)?payload:(payload.items||payload.courses||[]);
 fs.writeFileSync(path.join(__dirname,'public-course-ids.json'),JSON.stringify(items.map(x=>({id:x.id||x._id,title:x.title,type:x.type})),null,2));
 const routes=[['login','/login'],['register','/register']];
 const chosen=items.find(x=>/JavaScript|HTML|Python/.test(x.title))||items[0];
 for(const [name,url] of routes){
  await page.goto('http://127.0.0.1:5173'+url,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1600);
  await page.locator('form').locator('..').screenshot({path:path.join(__dirname,name+'.png'),animations:'disabled'});
  console.log(name,await page.title());
 }
 fs.writeFileSync(path.join(__dirname,'capture-errors.json'),JSON.stringify(errors,null,2));
 await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
