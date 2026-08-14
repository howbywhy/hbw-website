(function () {
    try {
      var p = (window.location && window.location.pathname) || '/';
      p = p.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
      if (p === '/') {
        document.documentElement.classList.add('hbw-route-home');
      }
      if (p === '/projects' || p === '/project' || p.indexOf('/projects/') === 0 || p.indexOf('/project/') === 0) {
        document.documentElement.classList.add('hbw-route-projects');
      }
      document.documentElement.classList.toggle('hbw-route-intake-start', p === '/intake/start');
      /*
        If we land directly on a project detail route, ensure the "loading" gate is
        applied before first paint. This prevents the gallery from rendering, then
        immediately being hidden/re-shown by footer scripts (perceived as flashing).
      */
      if ((p.indexOf('/projects/') === 0 && p !== '/projects') || (p.indexOf('/project/') === 0 && p !== '/project')) {
        document.documentElement.classList.add('hbw-project-page-loading');
      }
    } catch (e) {}
  })();