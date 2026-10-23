// Lenis 1.3.27 is served locally. Touch scrolling stays native.
(() => {
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const root=document.documentElement;
  let scroller=null;
  const componentLocks=new Set();

  function syncDialogs(){
    const open=Boolean(document.querySelector('dialog[open]'))||componentLocks.size>0;
    root.classList.toggle('has-open-dialog',open);
    if(open)scroller?.stop();
    else scroller?.start();
  }
  function configure(){
    scroller?.destroy();
    scroller=null;
    if(!reducedMotion.matches&&window.Lenis){
      scroller=new Lenis({
        autoRaf:true,
        lerp:0.16,
        wheelMultiplier:1,
        smoothWheel:true,
        syncTouch:false,
        anchors:{duration:0.6},
        stopInertiaOnNavigate:true,
        prevent:node=>node.tagName==='DIALOG'
      });
    }
    root.dataset.scrollMode=scroller?'smooth':'native';
    syncDialogs();
  }
  function refresh(){
    scroller?.resize();
  }
  function to(target,{immediate=false,duration=0.6}={}){
    const element=typeof target==='string'?document.querySelector(target):target;
    const margin=element instanceof Element?parseFloat(getComputedStyle(element).scrollMarginTop)||0:0;
    refresh();
    if(scroller){
      scroller.scrollTo(element,{offset:-margin,immediate,duration,easing:t=>1-Math.pow(1-t,3)});
    }else{
      const top=element instanceof Element?element.getBoundingClientRect().top+window.scrollY-margin:Number(element);
      window.scrollTo({top,behavior:immediate||reducedMotion.matches?'instant':'smooth'});
    }
  }
  window.pageScroll={to,refresh,setLock:(key,locked)=>{
    if(locked)componentLocks.add(key);else componentLocks.delete(key);
    syncDialogs();
  }};
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.setAttribute('data-lenis-prevent','');
    new MutationObserver(syncDialogs).observe(dialog,{attributes:true,attributeFilter:['open']});
  });
  reducedMotion.addEventListener('change',configure);
  window.addEventListener('hashchange',()=>requestAnimationFrame(()=>scroller?.scrollTo(window.scrollY,{immediate:true})));
  window.addEventListener('load',refresh);
  document.fonts.ready.then(refresh);
  configure();
})();
