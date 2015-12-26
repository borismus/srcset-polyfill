(function() {
  var ViewportInfo = this.ViewportInfo || require('./viewport-info');
  var SrcsetInfo = this.SrcsetInfo || require('./srcset-info');
  var WeakMap = require('es6-weak-map');

  var srcset = {};

  var viewportInfo = new ViewportInfo();
  srcset.viewportInfo = viewportInfo;
  viewportInfo.compute();

  var windowResizedAt = (new Date).getTime();
  srcset.windowResizedAt = windowResizedAt;

  // https://gist.github.com/abernier/6461914#imgloaded
  function imgloaded(src, cb) {
    var img = document.createElement('img');
    img.onload = function () {
      cb(null);
    }
    img.src = src;
  }

  // Picked from underscore.js
  function debounce(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = new Date().getTime() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = new Date().getTime();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
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

        //
        // 'srcchanging' event
        //

        var srcchanging = new CustomEvent('srcchanging', {
          previous: this.el.src,
          actual: bestImageInfo.src,
          bubbles: true
        });
        this.el.dispatchEvent(srcchanging);

        //
        // 'srcchanged' event
        //
        
        var srcchanged = new CustomEvent('srcchanged', {
          previous: this.el.src,
          actual: bestImageInfo.src,
          bubbles: true
        });
        // Wait the new image is loaded
        imgloaded(bestImageInfo.src, function () {
          // Change src
          this.el.src = bestImageInfo.src;

          // Dispatch 'srcchanged'
          setTimeout(function () {
            this.el.dispatchEvent(srcchanged);
          }.bind(this), 0);
        }.bind(this));
      }

      // Remember when updated to compare with window's resizeAt timestamp
      this.srcupdatedat = (new Date).getTime();
    }
  };

  var srcsetViews = new WeakMap();
  srcset.imgs = srcsetViews;
  function update() {
    // update timestamp
    windowResizedAt = (new Date).getTime();
    viewportInfo.compute();

    // Update every images
    [].forEach.call(document.querySelectorAll('img[data-srcset]'), function (el) {
      var srcsetview = srcsetViews.get(el);
      if (!srcsetview) {
        srcsetview = new SrcsetView(el);
        srcsetViews.set(el, srcsetview);
      }

      srcsetview.update();
    });
  }
  window.onresize = debounce(update, 200);
  update();
  srcset.update = update;

  // Exports
  this.srcset = srcset;
  if (typeof module !== "undefined" && module !== null) {
    module.exports = this.srcset;
  }
})(this);
