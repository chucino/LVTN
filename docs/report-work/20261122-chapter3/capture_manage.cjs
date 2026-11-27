const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1119-907-0_26.1119.907.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
(async()=>{
 const root=path.resolve(__dirname,'../../..');process.loadEnvFile(path.join(root,'.env'));
 const seed=fs.readFileSync(path.join(root,'src/seeds/courses.seed-data.ts'),'utf8');
 const email=seed.match(/const instructorOne\s*=\s*'([^']+)'/)[1];
 const password=process.env.SEED_INSTRUCTOR_PASSWORD||'NextCodeSeed@123';
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1050}});const page=await context.newPage();
 await page.goto('http://127.0.0.1:5173/login',{waitUntil:'networkidle'});
 await page.locator('#login-email').fill(email);await page.locator('#login-password').fill(password);
 await page.locator('button[type=submit]').click();
 await page.waitForURL('http://127.0.0.1:5173/',{timeout:20000});
 await page.goto('http://127.0.0.1:5173/dashboard/courses?keyword=HTML',{waitUntil:'networkidle'});await page.waitForTimeout(1600);
 await page.screenshot({path:path.join(__dirname,'manage-courses.png'),animations:'disabled'});
 const links=await page.locator('a[href$="/edit"]').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
 console.log('Instructor login and course list captured; editable links:',links.length);
 if(links[0]){
  await page.goto('http://127.0.0.1:5173'+links[0],{waitUntil:'networkidle'});await page.waitForTimeout(1800);
  await page.screenshot({path:path.join(__dirname,'course-editor.png'),animations:'disabled'});
  const id=links[0].split('/')[3];
  await page.goto('http://127.0.0.1:5173/dashboard/courses/'+id+'/students',{waitUntil:'networkidle'});await page.waitForTimeout(1400);
  await page.screenshot({path:path.join(__dirname,'course-students.png'),animations:'disabled'});
  // Teacher preview returns lesson data without writing student enrollment or progress.
  await page.goto('http://127.0.0.1:5173/learn/'+id,{waitUntil:'networkidle'});await page.waitForTimeout(1800);
  await page.screenshot({path:path.join(__dirname,'learning-preview.png'),animations:'disabled'});
 }
 await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
