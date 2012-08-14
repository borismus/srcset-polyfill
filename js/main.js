(function(exports) {

  function main() {
    // Get the user agent's capabilities (viewport width, viewport height, dPR).
    var viewportInfo = new ViewportInfo();
    viewportInfo.compute();
    // Go through all images on the page.
    var images = document.querySelectorAll('img');
    // If they have srcset attributes, apply JS to handle that correctly.
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      // Parse the srcset from the image element.
      var srcset = img.attributes.srcset;
      if (srcset) {
        var srcsetInfo = new SrcsetInfo(srcset.textContent);
        // Go through all the candidates, pick the best one that matches.
        var imageInfo = viewportInfo.getBestImage(srcsetInfo);
        // Replace the <img src> with this image.
        img.src = imageInfo.src;
        // Scale the image if necessary (ie. x != 1).
      }
    }
  }

  window.addEventListener('DOMContentLoaded', main);

})(window);
