const fs = require('fs');
const assert = require('assert/strict');
const { chromium } = require('playwright');
const out = process.env.BRIDGE_TEST_OUTPUT || require('path').resolve('.test-output');
fs.mkdirSync(out,{recursive:true});
(async () => {
  const browser = await chromium.launch({executablePath:process.env.BRIDGE_TEST_CHROME || undefined,headless:true});
  const page = await browser.newPage({viewport:{width:768,height:192},timezoneId:'Asia/Tokyo',deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-08T16:00:00-07:00')});
  await page.clock.pauseAt(new Date('2026-10-08T16:00:19-07:00'));
  await page.goto(process.env.BRIDGE_TEST_URL || 'http://127.0.0.1:8789/');
  await page.waitForSelector('.slide.on');
  await page.waitForFunction(()=>document.querySelector('img')?.complete);
  assert.equal(await page.evaluate(()=>towerSignStatus.percent),33);
  assert.equal(await page.locator('.slide.on').getAttribute('data-content'),'festival');
  await page.screenshot({path:out+'/festival.png'});
  await page.reload();
  await page.waitForSelector('.slide.on');
  assert.equal(await page.locator('.slide.on').getAttribute('data-content'),'festival');
  await page.clock.runFor(4999);
  assert.equal(await page.locator('.slide.on').getAttribute('data-content'),'festival');
  await page.clock.runFor(1);
  assert.equal(await page.locator('.slide.on').getAttribute('data-content'),'make');
  assert.equal(await page.locator('[data-content="festival"]').count(),0);
  await page.clock.runFor(650);

  // Stop timers so all generated layouts can be inspected independently.
  await page.evaluate(()=>{clearTimeout(stepTimer);clearTimeout(resizeTimer);sign.innerHTML='';});
  let checks=0;
  for (const [width,height] of [[768,192],[1536,384],[1280,720]]) {
    await page.setViewportSize({width,height});
    const report=await page.evaluate(({width,height})=>{
      clearTimeout(stepTimer);clearTimeout(resizeTimer);
      W=width;H=height;
      const errors=[];
      let checks=0;
      for(const word of WORDS) for(let index=0;index<LAYOUTS.length;index++) {
        const el=LAYOUTS[index](word,PAIRS[(WORDS.indexOf(word)+index)%PAIRS.length]);
        el.classList.add('on');
        sign.replaceChildren(el);
        const rects=[...el.querySelectorAll('[data-fit-text]')].map(node=>({text:node.textContent,r:node.getBoundingClientRect()}));
        for(const {text,r} of rects) {
          if(r.left < 4 || r.right > width-4 || r.top < 4 || r.bottom > height-4)
            errors.push({word,index,text,bounds:[r.left,r.top,r.right,r.bottom]});
        }
        for(const node of el.querySelectorAll('[data-fit-text]')) {
          const luminance=color=>{
            const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
            return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
          };
          let parent=node,background;
          while(parent) {
            const color=getComputedStyle(parent).backgroundColor;
            if(color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {background=color;break;}
            parent=parent.parentElement;
          }
          const a=luminance(getComputedStyle(node).color),b=luminance(background);
          const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
          if(ratio<4.5) errors.push({word,index,text:node.textContent,contrast:ratio});
        }
        for(let i=0;i<rects.length;i++) for(let j=i+1;j<rects.length;j++) {
          const a=rects[i].r,b=rects[j].r;
          if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)
            errors.push({word,index,overlap:[rects[i].text,rects[j].text]});
        }
        checks++;
      }
      return {errors,checks,words:WORDS};
    },{width,height});
    fs.writeFileSync(out+`/geometry-${width}x${height}.json`,JSON.stringify(report,null,2));
    assert.equal(report.errors.length,0,JSON.stringify(report.errors.slice(0,10)));
    checks+=report.checks;
  }
  await page.setViewportSize({width:768,height:192});
  const words=await page.evaluate(()=>WORDS);
  for(let i=0;i<words.length;i++) {
    await page.evaluate(index=>{
      clearTimeout(stepTimer);clearTimeout(resizeTimer);W=768;H=192;
      const el=LAYOUTS[index%LAYOUTS.length](WORDS[index],PAIRS[index%PAIRS.length]);
      el.classList.add('on');sign.replaceChildren(el);
    },i);
    await page.screenshot({path:out+`/make-${String(i+1).padStart(2,'0')}.png`});
  }
  fs.writeFileSync(out+'/words.json',JSON.stringify(words,null,2));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({geometryChecks:checks,makeMessages:words.length,browserErrors:errors,timezone:'Asia/Tokyo',reloadAndBoundary:'passed'}));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
