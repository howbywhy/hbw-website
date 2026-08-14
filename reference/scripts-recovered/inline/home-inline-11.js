document.addEventListener('contextmenu', function (event) {
    var t = event.target;
    if (!t || !t.closest) return;
    if (t.closest('img, video, picture')) {
      event.preventDefault();
    }
  });

  document.addEventListener('dragstart', function (event) {
    var t = event.target;
    if (!t || !t.closest) return;
    if (t.closest('img, video, picture')) {
      event.preventDefault();
    }
  });