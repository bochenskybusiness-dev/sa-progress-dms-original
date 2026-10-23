const demoDialog=document.querySelector('#demo-dialog');
const leadDialog=document.querySelector('#lead-dialog');
let returnFocus=null;
document.addEventListener('open-demo-notice',event=>{
  returnFocus=event.detail?.opener||null;
  demoDialog.showModal();
});

function setError(input,message){
  input.setAttribute('aria-invalid',String(Boolean(message)));
  const errorId=input.getAttribute('aria-describedby');
  if(errorId)document.getElementById(errorId).textContent=message;
}
function validateInput(input){
  let message='';
  const value=input.value.trim();
  if(input.name==='name'&&value.length<2)message='Укажите ваше имя';
  if(input.name==='phone'){
    const digits=value.replace(/\D/g,'');
    if(!/^[+\d\s().-]+$/.test(value)||digits.length<10||digits.length>15)message='Проверьте номер телефона';
  }
  if(input.name==='employees'&&value&&(!Number.isInteger(Number(value))||Number(value)<1||Number(value)>100000))message='Укажите целое число от 1 до 100 000';
  setError(input,message);
  return !message;
}
document.querySelectorAll('[data-lead-form]').forEach(form=>{
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const fields=[...form.querySelectorAll('input')].filter(input=>['name','phone','employees'].includes(input.name));
    const invalid=fields.filter(input=>!validateInput(input));
    if(invalid.length){invalid[0].focus();return;}
    returnFocus=leadDialog?.open?returnFocus:form.querySelector('[type="submit"]');
    if(leadDialog?.open)leadDialog.close();
    // Demonstration only: no network requests, persistence or file reads.
    demoDialog.showModal();
  });
  form.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{
    if(input.getAttribute('aria-invalid')==='true')validateInput(input);
  }));
});
demoDialog.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>demoDialog.close()));
demoDialog.addEventListener('close',()=>returnFocus?.focus());
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
  });
});

const serviceInputs=[...document.querySelectorAll('.service-choices input')];
function chosenServices(){return serviceInputs.filter(input=>input.checked).map(input=>input.value);}
function updateServiceCount(){document.querySelector('#service-count').textContent='Выбрано: '+chosenServices().length;}
serviceInputs.forEach(input=>input.addEventListener('change',updateServiceCount));
document.querySelectorAll('[data-open-lead]').forEach(button=>button.addEventListener('click',()=>{
  returnFocus=button;
  const selected=button.dataset.context==='price'?chosenServices():[];
  document.querySelector('#lead-context').textContent=selected.length?'Ваши приоритеты: '+selected.join(', ').toLowerCase()+'. Уточним задачи и подготовим варианты.':'Уточним задачи вашей компании и подберём подходящие программы ДМС.';
  leadDialog.showModal();
}));

const fileInput=document.querySelector('#policy-file');
const fileLabel=document.querySelector('#file-label');
const fileError=document.querySelector('#file-error');
const fileInitialLabel=fileLabel.innerHTML;
function resetFile(){fileInput.value='';fileLabel.innerHTML=fileInitialLabel;fileError.textContent='';}
document.querySelectorAll('[name="scenario"]').forEach(input=>input.addEventListener('change',()=>{
  const renewal=input.value==='renew';
  document.querySelector('#program-file').hidden=!renewal;
  document.querySelector('#scenario-description').textContent=renewal?'Сравним действующие условия с доступными предложениями.':'Подберём программу с учётом задач вашей компании.';
  if(!renewal)resetFile();
}));
fileInput.addEventListener('change',()=>{
  const file=fileInput.files?.[0];
  fileError.textContent='';
  if(!file){resetFile();return;}
  if(file.size>10*1024*1024||!/(\.pdf|\.docx?|\.xlsx?)$/i.test(file.name)){
    resetFile();fileError.textContent='Выберите PDF, DOC, DOCX, XLS или XLSX размером до 10 МБ.';return;
  }
  fileLabel.textContent=file.name;
  const note=document.createElement('small');note.textContent='Файл выбран';fileLabel.append(note);
});

const articleMore=document.querySelector('#article-more');
const articleToggle=document.querySelector('#article-toggle');
const articleSection=document.querySelector('#article');
const articleReadingActions=document.querySelector('.article-reading-actions');
// Keep this control outside the scaled review canvas so it follows the viewport.
document.body.append(articleReadingActions);
let articleFrame=0;
function updateArticleActions(){
  articleFrame=0;
  const rect=articleSection.getBoundingClientRect();
  const topInset=document.querySelector('.review-toolbar')?.getBoundingClientRect().bottom||0;
  const visible=!articleMore.hidden&&rect.top<window.innerHeight-80&&rect.bottom>topInset+80;
  articleReadingActions.hidden=!visible;
  if(!visible)return;
  const style=getComputedStyle(articleSection);
  const scale=rect.width/articleSection.offsetWidth;
  const left=Math.max(16,rect.left+parseFloat(style.paddingLeft)*scale);
  const right=Math.min(window.innerWidth-16,rect.right-parseFloat(style.paddingRight)*scale);
  articleReadingActions.style.left=left+'px';
  articleReadingActions.style.width=Math.max(0,right-left)+'px';
}
function scheduleArticleActions(){
  if(!articleFrame)articleFrame=requestAnimationFrame(updateArticleActions);
}
window.addEventListener('scroll',scheduleArticleActions,{passive:true});
window.addEventListener('resize',scheduleArticleActions);
new ResizeObserver(scheduleArticleActions).observe(articleSection);
document.querySelector('#review-scale')?.addEventListener('click',scheduleArticleActions);
function setArticleExpanded(expanded,scrollBack=false){
  articleMore.hidden=!expanded;
  articleSection.classList.toggle('is-expanded',expanded);
  articleToggle.hidden=expanded;
  articleToggle.setAttribute('aria-expanded',String(expanded));
  articleToggle.firstElementChild.textContent='Читать полностью';
  articleToggle.lastElementChild.textContent='↓';
  scheduleArticleActions();
  if(scrollBack)requestAnimationFrame(()=>{
    if(window.pageScroll)window.pageScroll.to(articleSection);
    else articleSection.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    articleToggle.focus({preventScroll:true});
  });
}
articleToggle.addEventListener('click',()=>setArticleExpanded(articleMore.hidden,!articleMore.hidden));
document.querySelector('.article-collapse').addEventListener('click',()=>setArticleExpanded(false,true));

// Keep disclosure groups consistent in browsers without native details[name] support.
document.querySelectorAll('details[name]').forEach(details=>details.addEventListener('toggle',()=>{
  if(details.open)document.querySelectorAll(`details[name="${details.name}"]`).forEach(other=>{if(other!==details)other.open=false;});
}));

// Use rendered coordinates so the CTA and the card also align in scaled reviews.
const heroForm=document.querySelector('#hero-form');
const heroVisual=document.querySelector('.hero-visual');
const heroCard=document.querySelector('.free-card');
let heroAlignmentFrame=0;
function alignHeroCard(){
  heroAlignmentFrame=0;
  if(getComputedStyle(heroForm).display==='none'){
    heroVisual.style.removeProperty('--hero-cta-top');
    heroVisual.style.removeProperty('--hero-card-end');
    return;
  }
  const visual=heroVisual.getBoundingClientRect();
  const button=heroForm.querySelector('button').getBoundingClientRect();
  const reviewCanvas=heroVisual.closest('.review-canvas');
  const scale=reviewCanvas?reviewCanvas.getBoundingClientRect().width/reviewCanvas.offsetWidth:1;
  const top=Math.max(0,(button.top-visual.top)/scale);
  const end=top+heroCard.offsetHeight+28;
  heroVisual.style.setProperty('--hero-cta-top',top.toFixed(2)+'px');
  heroVisual.style.setProperty('--hero-card-end',end.toFixed(2)+'px');
}
function scheduleHeroAlignment(){if(!heroAlignmentFrame)heroAlignmentFrame=requestAnimationFrame(alignHeroCard);}
const heroObserver=new ResizeObserver(scheduleHeroAlignment);
heroObserver.observe(document.querySelector('.hero-copy'));
heroObserver.observe(heroForm);
heroObserver.observe(heroCard);
window.addEventListener('resize',scheduleHeroAlignment);
document.fonts.ready.then(scheduleHeroAlignment);
document.querySelector('#review-scale')?.addEventListener('click',scheduleHeroAlignment);
scheduleHeroAlignment();

