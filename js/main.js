(function(exports) {

  function isSrcsetImplemented() {
    var img = new Image();
    return 'srcset' in img;
  }

  function main() {
    // If the browser supports @srcset natively, don't do any polyfill.
    if (isSrcsetImplemented()) {
      return;
    }

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
        var srcsetInfo = new SrcsetInfo({src: img.src,
                                      srcset: srcset.textContent});
        // Go through all the candidates, pick the best one that matches.
        var imageInfo = viewportInfo.getBestImage(srcsetInfo);
        // TODO: consider using -webkit-image-set instead (if available).
        // Replace the <img src> with this image.
        img.src = imageInfo.src;

        // If there's no set size, then we scale the image if necessary
        // (e.g. x != 1)
        if (!(img.width || img.height || img.style.height || img.style.width)) {
          img.style.webkitTransform = 'scale(' + (1/imageInfo.x) + ')';
          img.style.webkitTransformOrigin = '0 0';
        }
      }
    }
  }

	// Run on domready (window.load as a fallback)
	if( window.addEventListener ){
    window.addEventListener( "DOMContentLoaded", function(){
			main();
			// Run once only
			window.removeEventListener( "load", main, false );
		}, false );
		window.addEventListener( "load", main, false );
	}
	else if( window.attachEvent ){
		window.attachEvent( "onload", main );
	}

})(window);
