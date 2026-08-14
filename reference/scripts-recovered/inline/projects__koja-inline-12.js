(function(){
  if (window.__hbwRainbowFaviconInit) return;
  window.__hbwRainbowFaviconInit = true;

  function createFavicon(color){
    const c=document.createElement('canvas'); c.width=c.height=32;
    const ctx=c.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle=color; ctx.fillRect(0,0,32,32);
    return c.toDataURL('image/png');
  }

  /* Drop Webflow (or theme) static favicons so they don’t win over our script. */
  function removeStaticFavicons() {
    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(function (el) {
      if (/^hbw-rainbow-favicon/.test(el.id || '')) return;
      el.remove();
    });
  }

  function ensureLink(id, media) {
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement('link');
    el.id = id;
    el.rel = 'icon';
    el.type = 'image/png';
    el.setAttribute('sizes', '32x32');
    if (media) el.setAttribute('media', media);
    document.head.insertBefore(el, document.head.firstChild);
    return el;
  }

  removeStaticFavicons();

  /* Prepend in order: fallback → dark → light so final head order is light → dark → fallback.
     Browsers match the first applicable icon; fallback (no media) must be last. */
  ensureLink('hbw-rainbow-favicon', null);
  ensureLink('hbw-rainbow-favicon-dark', '(prefers-color-scheme: dark)');
  ensureLink('hbw-rainbow-favicon-light', '(prefers-color-scheme: light)');

  var links = [
    document.getElementById('hbw-rainbow-favicon-light'),
    document.getElementById('hbw-rainbow-favicon-dark'),
    document.getElementById('hbw-rainbow-favicon')
  ];

  const colors=['#FF0000','#FF8C00','#FFFF00','#008000','#0000FF','#8B00FF'];
  let i=0;

  function changeFavicon(){
    const url = createFavicon(colors[i]);
    if (!url) return;
    i = (i + 1) % colors.length;
    links.forEach(function (link) {
      if (!link) return;
      link.removeAttribute('href');
      link.href = url;
    });
  }

  changeFavicon();
  setInterval(changeFavicon, 250);
})();