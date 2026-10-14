/* Optional real-browser verification. Requires Playwright and a running preview. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.JORNADA_PLAYWRIGHT||'playwright');
const base=process.env.JORNADA_URL||'http://127.0.0.1:8085';
const artifacts=process.env.JORNADA_SCREENSHOTS||'/tmp/jornada-v8-preview';
(async()=>{
 fs.mkdirSync(artifacts,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 let checks=0;const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true,colorScheme:'light'});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.waitForFunction(()=>document.getElementById('keys').children.length===12);
  assert.equal(await page.locator('#modo,#restCard,#quickPunch,#monthPicker').count(),0);checks++;
  await page.locator('[data-tab="cfg"]').click();await page.waitForFunction(()=>document.getElementById('pwaStatus').textContent==='Pronto para usar offline');checks++;
  await page.locator('#testSound').click();await page.waitForFunction(()=>document.getElementById('toasts').textContent.includes('Toque de teste reproduzido'));assert.equal(await page.evaluate(()=>alertAudio.state),'running');checks++;
  await page.locator('#soundVolume').focus();await page.keyboard.press('Home');for(let step=0;step<7;step++)await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#soundVolume').inputValue(),'35');checks++;
  await page.locator('#soundMode').selectOption('system');assert.equal(await page.locator('#soundVolume').isDisabled(),true);await page.reload();await page.locator('[data-tab="cfg"]').click();assert.equal(await page.locator('#soundMode').inputValue(),'system');assert.equal(await page.locator('#soundVolume').inputValue(),'35');checks++;
  await page.locator('#soundMode').selectOption('silent');await page.locator('#testSound').click();await page.waitForFunction(()=>document.getElementById('toasts').textContent.includes('configurados sem som'));checks++;
  await page.locator('#soundMode').selectOption('app');
  await page.locator('[data-tab="hoje"]').click();
  await page.locator('#dt').fill('2026-10-13');await page.locator('#dt').dispatchEvent('change');
  await page.locator('#ent').click();await page.keyboard.type('0800');await page.waitForFunction(()=>document.getElementById('shT').textContent==='Saída almoço'&&!document.getElementById('sheet').hidden);
  await page.keyboard.type('1200');await page.waitForFunction(()=>document.getElementById('shT').textContent==='Volta almoço'&&!document.getElementById('sheet').hidden);
  await page.keyboard.type('1300');await page.waitForFunction(()=>document.getElementById('sheet').hidden);
  await page.locator('#fin').click();await page.keyboard.type('1700');await page.waitForFunction(()=>document.getElementById('sheet').hidden);
  assert.match(await page.locator('#out').innerText(),/\+00:40/);checks++;
  await page.reload();assert.equal(await page.locator('#ent').inputValue(),'08:00');assert.equal(await page.locator('#fin').inputValue(),'17:00');checks++;
  await page.locator('[data-tab="mes"]').click();assert.match(await page.locator('#hc').innerText(),/08:00/);checks++;
  await page.locator('#fileRst').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({cfg:{},days:{'2026-10-13':{ent:'29:99'}}}))});
  await page.waitForFunction(()=>document.getElementById('toasts').textContent.includes('Arquivo de backup inválido'));
  assert.equal(await page.locator('#ent').inputValue(),'08:00');checks++;
  await context.setOffline(true);await page.reload();assert.match(await page.locator('#out').innerText(),/\+00:40/);checks++;
  await context.setOffline(false);
  for(const width of [320,360,390,1440]){
   await page.setViewportSize({width,height:900});
   for(const tab of ['hoje','mes','cfg']){
    await page.locator(`[data-tab="${tab}"]`).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow em ${width}px/${tab}`);checks++;
    if(tab==='hoje'&&width<=390){assert.ok(await page.evaluate(()=>Array.from(document.querySelectorAll('.times .f')).every(field=>{const label=field.querySelector('label'),button=field.querySelector('button').getBoundingClientRect(),range=document.createRange();range.selectNodeContents(label);return Array.from(range.getClientRects()).every(text=>text.right<=button.left||text.bottom<=button.top||text.top>=button.bottom);})),`Rótulo sobreposto em ${width}px`);checks++;}
   }
  }
  await page.setViewportSize({width:360,height:800});await page.locator('[data-tab="hoje"]').click();await page.screenshot({path:path.join(artifacts,'mobile-light.png'),fullPage:true});
  await page.emulateMedia({colorScheme:'dark'});await page.screenshot({path:path.join(artifacts,'mobile-dark.png'),fullPage:true});
  await page.emulateMedia({colorScheme:'light'});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(artifacts,'notebook.png'),fullPage:true});
  const html=fs.readFileSync('calculador-jornada-v8.html','utf8');
  await page.route('**/reference-v8',route=>route.fulfill({contentType:'text/html',body:html}));
  const raw=await context.newPage();raw.on('pageerror',error=>errors.push(error.message));await raw.goto(base+'/reference-v8');
  const signature=target=>target.evaluate(()=>{const pick=selector=>{const style=getComputedStyle(document.querySelector(selector));return{background:style.backgroundColor,color:style.color,borderRadius:style.borderRadius,font:style.fontFamily};};return{body:pick('body'),bar:pick('.bar'),card:pick('.card'),tabs:pick('.tabs'),punch:pick('.times .f')};});
  assert.deepEqual(await signature(page),await signature(raw));checks++;
  assert.deepEqual(errors,[]);checks++;
  console.log(`${checks} verificações no Chrome aprovadas; screenshots: ${artifacts}`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
