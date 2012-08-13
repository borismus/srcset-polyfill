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
   * Get the best image from the set of image candidates, based on the viewport
   * information.
   *
   * The best image should fit within the devicePixelRatio (x), and be as close
   * to fitting the viewport width and height as possible.
   *
   * @returns {ImageInfo} The best image of the possible candidates.
   */
  ViewportInfo.prototype.getBestImage = function(srcsetInfo) {
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
