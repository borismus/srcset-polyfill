(function() {
  var ViewportInfo = this.ViewportInfo || require('./viewport-info.js');
  var SrcsetInfo = this.SrcsetInfo || require('./srcset-info');
  var WeakMap = require('es6-weak-map');

  var srcset = {};

  var viewportInfo = new ViewportInfo();
  srcset.viewportInfo = viewportInfo;
  viewportInfo.compute();

  var windowResizedAt = (new Date).getTime();
  srcset.windowResizedAt = windowResizedAt;

  function imgloaded(src, cb) {
    var img = document.createElement('img');
    img.onload = function () {
      cb(null);
    }
    img.src = src;
  }

  function SrcsetView(el) {
    this.el = el;

    this.srcsetInfo = new SrcsetInfo({
      src: this.el.src,
      srcset: this.el.dataset.srcset
    });
  }
  SrcsetView.prototype.update = function (options) {
    options || (options = {});
    /*options = $.extend({}, options, {
      force: false
    });*/

    var needUpdate = (!this.srcupdatedat || this.srcupdatedat < windowResizedAt);
    if (!this.el.src || needUpdate || options.force) {

      if (this.srcsetInfo) {
        var bestImageInfo = viewportInfo.getBestImage(this.srcsetInfo);

        // 'srcchanged' event
        var srcchanged = new CustomEvent('srcchanged', {
          previous: this.el.src,
          actual: bestImageInfo.src
        });

        // Wait the new image is loaded
        imgloaded(bestImageInfo.src, function () {
          // Change src
          this.el.src = bestImageInfo.src;

          // Dispatch 'srcchanged'
          setTimeout(function () {
            document.dispatchEvent(srcchanged);
          }.bind(this), 0);
        }.bind(this));
      }

      // Remember when updated to compare with window's resizeAt timestamp
      this.srcupdatedat = (new Date).getTime();
    }
  };

  var srcsetViews = new WeakMap();
  srcset.imgs = srcsetViews;
  function updateAllSrcset() {
    // update timestamp
    windowResizedAt = (new Date).getTime();
    viewportInfo.compute();

    // Update every images
    Array.prototype.forEach.call(document.querySelectorAll('img[data-srcset]'), function (el) {
      var srcsetview = srcsetViews.get(el);
      if (!srcsetview) {
        srcsetview = new SrcsetView(el);
        srcsetViews.set(el, srcsetview);
      }

      srcsetview.update();
    });
  }
  window.onresize = updateAllSrcset;
  updateAllSrcset();

  // Exports
  this.srcset = srcset;
  if (typeof module !== "undefined" && module !== null) {
    module.exports = this.srcset;
  }
})(this);
