(() => {
  const header=document.querySelector('.source-chrome-header');
  const footer=document.querySelector('.source-chrome-footer');
  const modals=document.querySelector('.source-chrome-modals');
  const mobileMenu=header.querySelector('.js-mobile-menu');
  const menuButton=header.querySelector('.js-open-mobile-menu');
  const desktopMenu=header.querySelector('.desktop-menu');
  const canvas=document.querySelector('.review-canvas');
  document.body.append(modals);
  header.querySelectorAll('.c-mobile-menu,.mobile-menu__inner').forEach(e=>e.setAttribute('data-lenis-prevent',''));
  modals.querySelectorAll('.hystmodal').forEach(e=>e.setAttribute('data-lenis-prevent',''));

  function keyboardButton(element,label){
    element.setAttribute('role','button');
    element.tabIndex=0;
    if(label)element.setAttribute('aria-label',label);
    element.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();element.click();}
    });
  }
  function closeSubmenus(){
    mobileMenu.querySelectorAll('.js-mobile-menu-inner').forEach(e=>e.classList.remove('active'));
    mobileMenu.classList.remove('hide-overflow');
  }
  function setMenu(open){
    mobileMenu.classList.toggle('js-hidden',!open);
    menuButton.classList.toggle('active',open);
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
    window.pageScroll?.setLock('source-menu',open);
    if(!open)closeSubmenus();
    updateFixedElements();
  }
  keyboardButton(menuButton,'Открыть меню');
  menuButton.setAttribute('aria-expanded','false');
  menuButton.addEventListener('click',()=>setMenu(mobileMenu.classList.contains('js-hidden')));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false);});
  header.querySelectorAll('.js-mobile-section-switch').forEach(button=>{
    keyboardButton(button);
    button.addEventListener('click',()=>{
      const type=button.dataset.type;
      header.querySelectorAll('.js-mobile-section-switch').forEach(e=>e.classList.toggle('active',e===button));
      header.querySelectorAll('.js-mobile-section').forEach(e=>e.classList.toggle('js-hidden',e.dataset.type!==type));
      closeSubmenus();
    });
  });
  header.querySelectorAll('.js-mobile-menu-parent').forEach(parent=>{
    const submenu=parent.querySelector('.js-mobile-menu-inner');
    const title=parent.querySelector('.js-mobile-menu-submenu-title');
    title.textContent=parent.dataset.title;
    title.href=parent.dataset.link;
    parent.addEventListener('click',event=>{
      if(event.target.closest('.js-mobile-menu-inner'))return;
      submenu.classList.add('active');
      mobileMenu.classList.add('hide-overflow');
      updateFixedElements();
    });
  });
  header.querySelectorAll('.js-mobile-menu-close-subsection').forEach(button=>{
    keyboardButton(button);
    button.addEventListener('click',event=>{event.stopPropagation();closeSubmenus();});
  });
  footer.querySelectorAll('.footer-menu__btn').forEach(button=>{
    keyboardButton(button);
    button.setAttribute('aria-expanded','false');
    button.addEventListener('click',()=>{
      const item=button.closest('.footer-menu__item');
      const menu=item.querySelector('.footer-sub-menu');
      menu.classList.toggle('js-hidden-sub-menu');
      button.setAttribute('aria-expanded',String(!menu.classList.contains('js-hidden-sub-menu')));
      item.querySelectorAll('.footer-btn-img').forEach(image=>image.classList.toggle('js-hidden-btn-img'));
    });
  });

  const desktopSearch=header.querySelector('#main-menu-search-form');
  header.querySelectorAll('.js-toggle-desktop-search-btn').forEach(button=>{
    keyboardButton(button,'Поиск');
    button.addEventListener('click',()=>{
      desktopSearch.classList.toggle('js-hidden');
      if(!desktopSearch.classList.contains('js-hidden'))desktopSearch.elements.query.focus();
    });
  });
  document.querySelectorAll('.source-chrome .js-clear-search-form').forEach(button=>button.addEventListener('click',()=>{
    button.closest('form').elements.query.value='';
  }));

  let pendingDemo=null;
  const originalModal=new HystModal({
    linkAttributeName:'data-hystmodal',
    backscroll:false,
    beforeOpen(){
      setMenu(false);
      header.classList.add('opened-modal');
      window.pageScroll?.setLock('source-modal',true);
    },
    afterClose(){
      header.classList.remove('opened-modal');
      window.pageScroll?.setLock('source-modal',false);
      if(pendingDemo){
        document.dispatchEvent(new CustomEvent('open-demo-notice',{detail:{opener:pendingDemo}}));
        pendingDemo=null;
      }
    }
  });
  const callbackForm=modals.querySelector('#feedback-form-short form');
  const agreement=callbackForm.querySelector('.js-form-agreement-section');
  const consent=agreement.querySelector('.js-agreement-btn');
  keyboardButton(consent,'Ознакомлен с политиками');
  consent.setAttribute('aria-pressed','false');
  consent.addEventListener('click',()=>{
    agreement.classList.toggle('checked');
    consent.setAttribute('aria-pressed',String(agreement.classList.contains('checked')));
    if(agreement.classList.contains('checked'))agreement.classList.remove('error');
  });
  callbackForm.addEventListener('submit',event=>{
    event.preventDefault();
    const phone=callbackForm.elements.phone;
    const group=phone.closest('.form-group');
    const valid=/^[+\d\s().-]+$/.test(phone.value)&&phone.value.replace(/\D/g,'').length>=10&&phone.value.replace(/\D/g,'').length<=15;
    group.classList.toggle('error',!valid);
    group.querySelector('.input-label.error').textContent=valid?'':'Проверьте номер телефона';
    agreement.classList.toggle('error',!agreement.classList.contains('checked'));
    if(!valid){phone.focus();return;}
    if(!agreement.classList.contains('checked')){consent.focus();return;}
    pendingDemo=header.querySelector('.callback-btn-desktop');
    originalModal.close();
  });

  let frame=0;
  function measureFixed(){
    // The original site reserves this space in its main wrapper when the menu
    // becomes fixed. Preserve the same flow without shifting the landing page.
    const wasFixed=header.classList.contains('fixed-state');
    header.classList.remove('fixed-state');
    header.style.minHeight='';
    header.style.minHeight=getComputedStyle(header.querySelector('header')).height;
    header.classList.toggle('fixed-state',wasFixed);
    scheduleFixed();
  }
  function updateFixedElements(){
    frame=0;
    header.classList.toggle('fixed-state',window.scrollY>=100);
    if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const scale=rect.width/canvas.offsetWidth;
    const toolbar=document.querySelector('.review-toolbar').getBoundingClientRect().bottom;
    const viewportTop=(toolbar-rect.top)/scale;
    desktopMenu.style.top=header.classList.contains('fixed-state')?viewportTop+'px':'';
    const mobileOrigin=Math.max(toolbar,rect.top);
    header.querySelectorAll('.c-mobile-menu,.mobile-menu__inner').forEach(element=>{
      element.style.top=((mobileOrigin-rect.top)/scale+60)+'px';
      element.style.height=Math.max(0,(window.innerHeight-mobileOrigin)/scale-60)+'px';
    });
  }
  function scheduleFixed(){if(!frame)frame=requestAnimationFrame(updateFixedElements);}
  window.addEventListener('scroll',scheduleFixed,{passive:true});
  window.addEventListener('resize',()=>{measureFixed();if(getComputedStyle(menuButton).display==='none')setMenu(false);});
  document.querySelector('#review-scale')?.addEventListener('click',measureFixed);
  window.addEventListener('load',measureFixed);
  document.fonts.ready.then(measureFixed);
  measureFixed();
})();
