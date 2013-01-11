(function(exports) {
  var INT_REGEXP = /^[0-9]+$/;

  function SrcsetInfo(options) {
    this.imageCandidates = [];
    this.srcValue = options.src;
    this.srcsetValue = options.srcset;
    this.isValid = true;
    this.error = '';

    this._parse(this.srcsetValue);
    if (!this.isValid) {
      console.error('Error: ' + this.error);
    }
  }

  /**
   * Parses the string that goes srcset="here".
   *
   * @returns [{url: _, x: _, w: _, h:_}, ...]
   */
  SrcsetInfo.prototype._parse = function() {
    // 1. Let input be the value of the img element's srcset attribute.
    // 2. Let position be a pointer into input,
    //    initially pointing at the start of the string.
    // 3. Let raw candidates be an initially empty ordered
    //    list of URLs with associated unparsed descriptors.
    //    The order of entries in the list is the order in which entries
    //    are added to the list.
    var input = this.srcsetValue,
        position = 0,
        rawCandidates = [],
        url,
        descriptors;

    while (input !== '') {
      // 4. Splitting loop: Skip whitespace.
      while (input.charAt(0) === ' ') {
        input = input.slice(1);
      }

      position = input.indexOf(' ');

      if (position !== -1) {
        // 5. Collect a sequence of characters that are not space characters,
        //    and let that be url.
        url = input.slice(0, position);

        // 6. If url is empty, then jump to the step labeled descriptor parse;
        if (url === '') {
          break;
        }
        input = input.slice(position + 1);

        // 7. Collect a sequence of characters that are not U+002C COMMA
        //    characters (,), and let that be descriptors
        position = input.indexOf(',');
        if (position === -1) {
          descriptors = input;
          input = '';
        } else {
          descriptors =  input.slice(0, position);
          input = input.slice(position + 1);
        }

        // 8. Add url to raw candidates, associated with descriptors
        rawCandidates.push({
          url: url,
          descriptors: descriptors
        });

      // Break on invalid srcset descriptors
      } else {
        // 8. Add url to raw candidates, associated with descriptors
        rawCandidates.push({
          url: input,
          descriptors: ''
        });
        input = '';
      }
    }

    for (var i = 0, len = rawCandidates.length; i < len; i++) {
      var candidate = rawCandidates[i],
          desc = this._parseDescriptors(candidate.descriptors);
      this._addCandidate(new ImageInfo({
        src: candidate.url,
        x: desc.x,
        w: desc.w,
        h: desc.h
      }));
    }

    // If there's a srcValue, add it to the candidates too.
    if (this.srcValue) {
      this._addCandidate(new ImageInfo({src: this.srcValue}));
    }
  };

  /**
   * Add an image candidate, unless it's a dupe of something that exists already.
   */
  SrcsetInfo.prototype._addCandidate = function(imageInfo) {
    for (var j = 0; j < this.imageCandidates.length; j++) {
      var existingCandidate = this.imageCandidates[j];
      if (existingCandidate.x == imageInfo.x &&
          existingCandidate.w == imageInfo.w &&
          existingCandidate.h == imageInfo.h) {
        // It's a dupe, so return early without adding the image candidate.
        return;
      }
    }
    this.imageCandidates.push(imageInfo);
  };

  SrcsetInfo.prototype._parseDescriptors = function(descString) {
    var descriptors = descString.split(/\s/);
    var out = {};
    for (var i = 0; i < descriptors.length; i++) {
      var desc = descriptors[i];
      if (desc.length > 0) {
        var lastChar = desc[desc.length-1];
        var value = desc.substring(0, desc.length-1);
        var intVal = parseInt(value, 10);
        var floatVal = parseFloat(value);
        if (value.match(INT_REGEXP) && lastChar === 'w') {
          out[lastChar] = intVal;
        } else if (value.match(INT_REGEXP) && lastChar =='h') {
          out[lastChar] = intVal;
        } else if (!isNaN(floatVal) && lastChar == 'x') {
          out[lastChar] = floatVal;
        } else {
          this.error = 'Invalid srcset descriptor found in "' + desc + '".';
          this.isValid = false;
        }
      }
    }
    return out;
  };

  function ImageInfo(options) {
    this.src = options.src;
    this.w = options.w || Infinity;
    this.h = options.h || Infinity;
    this.x = options.x || 1;
  }

  exports.SrcsetInfo = SrcsetInfo;

})(window);

(function(exports) {

  function ViewportInfo() {
    this.w = null;
    this.h = null;
    this.x = null;
  }

  /**
   * Calculate viewport information: viewport width, height and
   * devicePixelRatio.
   */
  ViewportInfo.prototype.compute = function() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.x = window.devicePixelRatio;
  };

  /**
   * Set a fake viewport for testing purposes.
   */
  ViewportInfo.prototype.setForTesting = function(options) {
    this.w = options.w;
    this.h = options.h;
    this.x = options.x;
  };

  /**
   * Direct implementation of "processing the image candidates":
   * http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content-1.html#processing-the-image-candidates
   *
   * @returns {ImageInfo} The best image of the possible candidates.
   */
  ViewportInfo.prototype.getBestImage = function(srcsetInfo) {
    var images = srcsetInfo.imageCandidates.slice(0);
    // Get the largest width.
    var largestWidth = this._getBestCandidateIf(images, function(a, b) { return a.w > b.w; });
    // Remove all candidates with widths less than client width.
    this._removeCandidatesIf(images, function(a) { return a.w < this.w; }.bind(this));
    // If none are left, keep the one with largest width.
    if (images.length === 0) { images = [largestWidth]; }

    // Get the largest height.
    var largestHeight = this._getBestCandidateIf(images, function(a, b) { return a.h > b.h; });
    // Remove all candidates with heights less than client height.
    this._removeCandidatesIf(images, function(a) { return a.h < this.h; }.bind(this));
    // If none are left, keep one with largest height.
    if (images.length === 0) { images = [largestHeight]; }

    // Get the largest pixel density.
    var largestPxDensity = this._getBestCandidateIf(images, function(a, b) { return a.x > b.x; });
    // Remove all candidates with pxdensity less than client pxdensity.
    this._removeCandidatesIf(images, function(a) { return a.x < this.x; }.bind(this));
    // If none are left, keep one with largest pixel density.
    if (images.length === 0) { images = [largestPxDensity]; }


    // Get the smallest width.
    var smallestWidth = this._getBestCandidateIf(images, function(a, b) { return a.w < b.w; });
    // Remove all candidates with width greater than it.
    this._removeCandidatesIf(images, function(a, b) { return a.w > smallestWidth.w; });

    // Get the smallest height.
    var smallestHeight = this._getBestCandidateIf(images, function(a, b) { return a.h < b.h; });
    // Remove all candidates with height greater than it.
    this._removeCandidatesIf(images, function(a, b) { return a.h > smallestWidth.h; });

    // Get the smallest pixel density.
    var smallestPxDensity = this._getBestCandidateIf(images, function(a, b) { return a.x < b.x; });
    // Remove all candidates with pixel density less than smallest px density.
    this._removeCandidatesIf(images, function(a, b) { return a.x > smallestPxDensity.x; });

    return images[0];
  };

  ViewportInfo.prototype._getBestCandidateIf = function(images, criteriaFn) {
    var bestCandidate = images[0];
    for (var i = 0; i < images.length; i++) {
      var candidate = images[i];
      if (criteriaFn(candidate, bestCandidate)) {
        bestCandidate = candidate;
      }
    }
    return bestCandidate;
  };

  ViewportInfo.prototype._removeCandidatesIf = function(images, criteriaFn) {
    for (var i = images.length - 1; i >= 0; i--) {
      var candidate = images[i];
      if (criteriaFn(candidate)) {
        // Remove it.
        images.splice(i, 1);
      }
    }
    return images;
  };

  /**
   * Get the best image from the set of image candidates, based on the viewport
   * information.
   *
   * The best image should fit within the devicePixelRatio (x), and be as close
   * to fitting the viewport width and height as possible.
   *
   * @returns {ImageInfo} The best image of the possible candidates.
   */
  ViewportInfo.prototype.getBestImage2 = function(srcsetInfo) {
    var bestMatch = null;
    var images = srcsetInfo.imageCandidates;
    for (var i = 0; i < images.length; i++) {
      var imageCandidate = images[i];
      var bestMatchX = bestMatch ? bestMatch.x : 0;
      // If candidate DPR is at least as large as the best, and less than or
      // equal to client DPR, evaluate it further.
      if (bestMatchX <= imageCandidate.x && imageCandidate.x <= this.x) {
        // If there's no image to compare against, set it to the first one.
        if (bestMatch === null) {
          bestMatch = imageCandidate;
          continue;
        }
        // If the width or height bounds are tighter with this candidate, it's
        // a better match.
        if (this.w <= imageCandidate.w && imageCandidate.w <= bestMatch.w) {
          bestMatch = imageCandidate;
        }
        // Ignore height for now.
      }
    }
    return bestMatch;
  };

  exports.ViewportInfo = ViewportInfo;

})(window);

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
        // Scale the image if necessary (ie. x != 1).
        img.style.webkitTransform = 'scale(' + (1/imageInfo.x) + ')';
        img.style.webkitTransformOrigin = '0 0';
      }
    }
  }

  window.addEventListener('DOMContentLoaded', main);

})(window);
