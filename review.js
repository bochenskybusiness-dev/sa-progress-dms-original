const reviewCanvas=document.querySelector('.review-canvas');
const reviewStage=document.querySelector('.review-stage');
const reviewWidth=Number(document.documentElement.dataset.width);
const scaleButton=document.querySelector('#review-scale');
let actualSize=false;
function updateReview(){const scale=actualSize?1:Math.min(1,(window.innerWidth-32)/reviewWidth);reviewCanvas.style.setProperty('--review-scale',scale);reviewStage.style.width=(reviewWidth*scale)+'px';reviewStage.style.height=(reviewCanvas.scrollHeight*scale)+'px';reviewStage.style.minHeight='0';scaleButton.textContent=actualSize?'По ширине окна':'Масштаб 100%';scaleButton.setAttribute('aria-pressed',String(actualSize));}
scaleButton.addEventListener('click',()=>{actualSize=!actualSize;updateReview();});
window.addEventListener('resize',updateReview);
new ResizeObserver(updateReview).observe(reviewCanvas);
document.fonts.ready.then(updateReview);
window.addEventListener('load',updateReview);
updateReview();

window.addEventListener('load',()=>{
  document.fonts.ready.then(()=>{
    updateReview();
    if(location.hash)requestAnimationFrame(()=>{
      const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if(target&&window.pageScroll)window.pageScroll.to(target,{immediate:true});
      else target?.scrollIntoView({behavior:'instant',block:'start'});
    });
  });
});
