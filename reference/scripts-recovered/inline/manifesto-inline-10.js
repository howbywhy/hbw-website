document.addEventListener('DOMContentLoaded', function () {
    var videos = document.getElementsByTagName('video');
    for (var i = 0; i < videos.length; i++) {
      videos[i].setAttribute('playsinline', '');
      videos[i].setAttribute('muted', '');
    }

    var mediaElements = document.querySelectorAll('img, video');
    mediaElements.forEach(function (media) {
      media.addEventListener('load', function () {
        media.classList.add('loaded');
      });
      if (media.tagName === 'IMG' && media.complete) {
        media.classList.add('loaded');
      }
      media.addEventListener('loadeddata', function () {
        media.classList.add('loaded');
      });
    });
  });