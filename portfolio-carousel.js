// Shared desktop carousel. Original cards remain the mobile/fallback view.
(() => {
  const doc = document;
  const win = window;
  const setImage = (img, item) => {
    let fallbacks;
    try { fallbacks = JSON.parse(item.fallbacks); } catch (_) { fallbacks = []; }
    img.style.visibility = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => {
      const next = fallbacks.shift();
      if (next) img.src = next;
      else { img.onerror = null; img.style.visibility = 'hidden'; }
    };
    if (item.src) img.src = item.src;
    else { img.removeAttribute('src'); img.style.visibility = 'hidden'; }
  };
  const build = () => {
    doc.querySelectorAll('#graphic .portfolio-section, #video .portfolio-section').forEach(section => {
      if(section.querySelector('.editorial-carousel')) return;
      const cards = [...section.querySelectorAll('.work-card')];
      if(cards.length < 2) return;
      const carouselLimit = 8;
      const items=cards.slice(0, carouselLimit).map(card=>({title:card.querySelector('.card-title').textContent.trim(),src:card.querySelector('img')?.getAttribute('src')||'',fallbacks:card.querySelector('img')?.dataset.coverFallbacks||'[]',href:card.getAttribute('href'),tags:card.querySelector('.card-tags')?.textContent.trim()||''}));
      const root=doc.createElement('div');root.className='editorial-carousel';root.setAttribute('role','region');root.setAttribute('aria-label',section.querySelector('.portfolio-section-title')?.textContent+'轮播');root.tabIndex=0;
      root.innerHTML='<a class="ec-image" target="_blank" rel="noopener noreferrer"><img alt=""></a><div class="ec-copy"><img class="ec-frost" alt="" aria-hidden="true"><div class="ec-content"><h3><a target="_blank" rel="noopener noreferrer"></a></h3></div><div class="ec-controls"><span class="ec-count"></span><div class="ec-dots"></div><button aria-label="上一项"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 7-5 5 5 5"/></svg></button><button aria-label="下一项"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 7 5 5-5 5"/></svg></button></div></div>';
      section.append(root);
      section.classList.add('ec-ready');
      if (cards.length > carouselLimit) {
        const grid = section.querySelector('.card-grid');
        grid.classList.add('ec-overflow-grid');
        cards.slice(0, carouselLimit).forEach(card => card.classList.add('ec-featured-card'));
        root.classList.add('ec-has-overflow');
        root.after(grid);
      }
      let current=0,hover=false;
      const reducedMotion=win.matchMedia('(prefers-reduced-motion:reduce)');
      const dots=root.querySelector('.ec-dots');
      items.forEach((item,i)=>{const b=doc.createElement('button');b.setAttribute('aria-label','查看第 '+(i+1)+' 项');b.onclick=()=>show(i);dots.append(b)});
      const show=index=>{
        current=(index+items.length)%items.length;const item=items[current];
        const main=root.querySelector('.ec-image');main.href=item.href;setImage(main.querySelector('img'),item);main.querySelector('img').alt=item.title;
        setImage(root.querySelector('.ec-frost'),item);
        const title=root.querySelector('h3 a');title.textContent=item.title;title.href=item.href;
        title.title=item.title;
        root.querySelector('.ec-count').textContent=String(current+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');
        [...dots.children].forEach((dot,i)=>dot.setAttribute('aria-current',String(i===current)));
        if(!reducedMotion.matches) root.querySelector('.ec-content').animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,easing:'ease-out'});
      };
      const controls=root.querySelectorAll('.ec-controls>button');controls[0].onclick=()=>show(current-1);controls[1].onclick=()=>show(current+1);
      root.onmouseenter=()=>hover=true;root.onmouseleave=()=>hover=false;
      root.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(current+(e.key==='ArrowRight'?1:-1))}};
      const timer=win.setInterval(()=>{if(!root.isConnected){win.clearInterval(timer);return;}if(!reducedMotion.matches&&!hover&&!doc.hidden&&!root.contains(doc.activeElement)&&win.matchMedia('(min-width:1000px)').matches){const r=root.getBoundingClientRect();if(r.top<win.innerHeight&&r.bottom>0)show(current+1)}},5500);
      show(0);
    });
  };
  build();
  window.mountPortfolioCarousels = build;
})();
