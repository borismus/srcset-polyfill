(function(exports) {

  var supportsSrcset,
      viewportInfo;
  function computeWhetherSrcsetImplemented() {
    var img = new Image();
    supportsSrcset = 'srcset' in img;
  }

  function main() {
    // If the browser supports @srcset natively, don't do any polyfill.
    computeWhetherSrcsetImplemented();
    if (supportsSrcset) {
      return;
    }

    // Get the user agent's capabilities (viewport width, viewport height, dPR).
    viewportInfo = new ViewportInfo();
    viewportInfo.compute();

    // Go through all images on the page.
    var images = document.querySelectorAll('img');
    // If they have srcset attributes, apply JS to handle that correctly.
    for (var i = 0; i < images.length; i++) {
      setBestImageFor(images[i]);
    }
  }

  function setBestImageFor(img) {
    if (supportsSrcset) {
      return;
    }

    // Parse the srcset from the image element.
    var srcset = img.attributes.srcset;

    // Pick the best candidate
    if (srcset) {
      var srcsetInfo = new SrcsetInfo({ src: img.src,
                                        srcset: srcset.textContent }),
          candidate = viewportInfo.getBestImage(srcsetInfo);

      // TODO: consider using -webkit-image-set instead (if available).
      // Replace the <img src> with this image.
      img.src = imageInfo.src;

      // Scale the image iff it's not already constrained by maxWidth / maxHeight
      if (!(img.style.maxWidth || img.style.maxHeight || imageInfo.x === 1)) {
        img.style.webkitTransform = 'scale(' + (1/imageInfo.x) + ')';
        img.style.webkitTransformOrigin = '0 0';
      }
    }
  }

  exports.setBestImageFor = setBestImageFor;

  window.addEventListener('DOMContentLoaded', main);

})(window);
