(function(){
  const mq = window.matchMedia('(min-width: 768px)');

  let rail = null;
  let bar  = null;
  let raf = null;
  let idleTimer = null;
  let attached = false;

  function update(){
    raf = null;
    if (!attached) return;

    const doc = document.scrollingElement || document.documentElement;
    const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const y   = doc.scrollTop;

    // idle fade
    if (!rail._lastYSet || y !== rail._lastY){
      rail.classList.remove('is-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => rail.classList.add('is-idle'), 520);
      rail._lastYSet = true;
      rail._lastY = y;
    }

    // progress
    const p = Math.min(1, Math.max(0, y / max));
    bar.style.height = (p * 100).toFixed(2) + '%';

    // hide at bottom / no scroll
    const noScroll = doc.scrollHeight <= doc.clientHeight + 1;
    const atBottom = p >= 0.999;
    rail.classList.toggle('is-complete', noScroll || atBottom);
  }

  function onTick(){
    if (!raf) raf = requestAnimationFrame(update);
  }

  function attach(){
    if (attached || !mq.matches) return;

    rail = document.createElement('div');
    rail.className = 'scroll-progress is-idle';
    bar = document.createElement('div');
    bar.className = 'scroll-progress__bar';
    rail.appendChild(bar);
    document.body.appendChild(rail);

    ['scroll','resize','load'].forEach(evt=>{
      window.addEventListener(evt, onTick, { passive:true });
    });

    attached = true;
    update();
  }

  function detach(){
    if (!attached) return;

    ['scroll','resize','load'].forEach(evt=>{
      window.removeEventListener(evt, onTick);
    });

    clearTimeout(idleTimer);
    cancelAnimationFrame(raf);
    raf = null; idleTimer = null;

    rail?.remove();
    rail = null; bar = null;
    attached = false;
  }

  // Initial mount (desktop only)
  if (mq.matches) attach();

  // Respond to breakpoint changes (e.g., rotate or resize)
  const mqHandler = (e) => { e.matches ? attach() : detach(); };
  if (mq.addEventListener) mq.addEventListener('change', mqHandler);
  else mq.addListener(mqHandler); // older Safari fallback
})();