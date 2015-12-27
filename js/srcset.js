(function () {
  var ViewportInfo = this.ViewportInfo || require('./viewport-info');
  var SrcsetInfo = this.SrcsetInfo || require('./srcset-info');
  var WeakMap = require('weak-map');

  var srcset = {};

  var viewportInfo = new ViewportInfo();
  srcset.viewportInfo = viewportInfo;
  viewportInfo.compute();

  var windowResizedAt = (new Date).getTime();
  srcset.windowResizedAt = windowResizedAt;

  // https://gist.github.com/abernier/6461914#load-with-progress
  function progress(url, tick, cb) {
    tick || (tick = function () {});
    cb || (cb = function () {});

    var xhr = new XMLHttpRequest();
    xhr.onprogress = function (e) {
      if (e.lengthComputable) {
        tick(e.loaded / e.total);
      }
    };
    xhr.onload = function () {
      cb(null);
    };
    xhr.onerror = function (er) {
      cb(er);
    };
    xhr.open("GET", url, true);
    xhr.send();
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

  // https://gist.github.com/stucox/5231211
  var hasMO = (function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];

    for (var i=0; i < prefixes.length; i++) {
      if ((prefixes[i] + 'MutationObserver') in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }

    return false;
  }());

  function SrcsetView(el) {
    this.el = el;

    this.srcsetInfo = new SrcsetInfo({
      src: this.el.src,
      srcset: this.el.dataset.srcset
    });

    //
    // Observe data-srcset attributes mutations to keep this.srcsetInfo up-to-date (if available)
    //

    if (hasMO) {
      this.mo = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          //console.log(mutation);

          if (mutation.target === this.el && mutation.type === 'attributes') {
            if (mutation.attributeName === 'src' || mutation.attributeName === 'data-srcset') {
              this.update();
            }
          }
        }.bind(this));    
      }.bind(this));
       
      this.mo.observe(this.el, {attributes: true});
    }
  }
  SrcsetView.prototype.update = function (options) {
    options || (options = {});
    /*options = $.extend({}, options, {
      force: false
    });*/
    
    if (this.srcsetInfo.srcValue !== this.el.src) {
      this.srcsetInfo.srcValue = this.el.src;
    }

    var srcsetchanged;
    if (this.srcsetInfo.srcsetValue !== this.el.dataset.srcset) {
      srcsetchanged = true;

      this.srcsetInfo.imageCandidates = []; // reset imageCandidates
      this.srcsetInfo.srcsetValue = this.el.dataset.srcset;
      this.srcsetInfo._parse(this.srcsetInfo.srcsetValue);
      if (!this.srcsetInfo.isValid) {
        console.error('Error: ' + this.srcsetInfo.error);
      }
    }

    var needUpdate = (!this.srcupdatedat || this.srcupdatedat < windowResizedAt || srcsetchanged);
    if (!this.el.src || needUpdate || options.force) {

      if (this.srcsetInfo) {
        var bestImageInfo = viewportInfo.getBestImage(this.srcsetInfo);

        var oldsrc = this.el.src;
        var newsrc = bestImageInfo.src;

        if (newsrc === oldsrc) return false; // same, no need to update

        //console.log('updating src', this.el, oldsrc, newsrc);

        var eventdata = {
          previous: oldsrc,
          actual: newsrc,
          bubbles: true
        };

        //
        // 'srcchanging' event
        //

        var srcchanging = new CustomEvent('srcchanging', eventdata);
        this.el.dispatchEvent(srcchanging);

        //
        // 'srcchanged' event
        //
        
        var srcchanged = new CustomEvent('srcchanged', eventdata);

        // Wait the new image is loaded and send 'srcprogress'
        progress(newsrc, function (percent) {
          var srcprogress = new CustomEvent('srcprogress', percent);
          this.el.dispatchEvent(srcprogress);
        }.bind(this), function (er) {
          if (er) return console.error(er);

          this.el.src = newsrc;

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