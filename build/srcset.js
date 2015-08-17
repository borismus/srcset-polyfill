(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
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


  // Exports
  this.SrcsetInfo = SrcsetInfo;
  if (typeof module !== "undefined" && module !== null) {
    module.exports = this.SrcsetInfo;
  }

})(this);

},{}],2:[function(require,module,exports){
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
  function update() {
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
  window.onresize = debounce(update, 200);
  update();
  srcset.update = update;

  // Exports
  this.srcset = srcset;
  if (typeof module !== "undefined" && module !== null) {
    module.exports = this.srcset;
  }
})(this);

},{"./srcset-info":1,"./viewport-info.js":3,"es6-weak-map":4}],3:[function(require,module,exports){
(function() {
  var SrcsetInfo = this.SrcsetInfo || require('./srcset-info');

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
    this.w = window.innerWidth || document.documentElement.clientWidth;
    this.h = window.innerHeight || document.documentElement.clientHeight;
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
    this._removeCandidatesIf(images, (function(scope) { return function(a) { return a.w < scope.w; }; })(this));
    // If none are left, keep the one with largest width.
    if (images.length === 0) { images = [largestWidth]; }

    // Get the largest height.
    var largestHeight = this._getBestCandidateIf(images, function(a, b) { return a.h > b.h; });
    // Remove all candidates with heights less than client height.
    this._removeCandidatesIf(images, (function(scope) { return function(a) { return a.h < scope.h; }; })(this));
    // If none are left, keep one with largest height.
    if (images.length === 0) { images = [largestHeight]; }

    // Get the largest pixel density.
    var largestPxDensity = this._getBestCandidateIf(images, function(a, b) { return a.x > b.x; });
    // Remove all candidates with pxdensity less than client pxdensity.
    this._removeCandidatesIf(images, (function(scope) { return function(a) { return a.x < scope.x; }; })(this));
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

  // Exports
  this.ViewportInfo = ViewportInfo;
  if (typeof module !== "undefined" && module !== null) {
    module.exports = this.ViewportInfo;
  }

})(this);

},{"./srcset-info":1}],4:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? WeakMap : require('./polyfill');

},{"./is-implemented":5,"./polyfill":47}],5:[function(require,module,exports){
'use strict';

module.exports = function () {
	var weakMap, x;
	if (typeof WeakMap !== 'function') return false;
	if (String(WeakMap.prototype) !== '[object WeakMap]') return false;
	try {
		// WebKit doesn't support arguments and crashes
		weakMap = new WeakMap([[x = {}, 'one'], [{}, 'two'], [{}, 'three']]);
	} catch (e) {
		return false;
	}
	if (typeof weakMap.set !== 'function') return false;
	if (weakMap.set({}, 1) !== weakMap) return false;
	if (typeof weakMap.delete !== 'function') return false;
	if (typeof weakMap.has !== 'function') return false;
	if (weakMap.get(x) !== 'one') return false;

	return true;
};

},{}],6:[function(require,module,exports){
// Exports true if environment provides native `WeakMap` implementation, whatever that is.

'use strict';

module.exports = (function () {
	if (typeof WeakMap !== 'function') return false;
	return (Object.prototype.toString.call(new WeakMap()) === '[object WeakMap]');
}());

},{}],7:[function(require,module,exports){
'use strict';

var copy       = require('es5-ext/object/copy')
  , map        = require('es5-ext/object/map')
  , callable   = require('es5-ext/object/valid-callable')
  , validValue = require('es5-ext/object/valid-value')

  , bind = Function.prototype.bind, defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , define;

define = function (name, desc, bindTo) {
	var value = validValue(desc) && callable(desc.value), dgs;
	dgs = copy(desc);
	delete dgs.writable;
	delete dgs.value;
	dgs.get = function () {
		if (hasOwnProperty.call(this, name)) return value;
		desc.value = bind.call(value, (bindTo == null) ? this : this[bindTo]);
		defineProperty(this, name, desc);
		return this[name];
	};
	return dgs;
};

module.exports = function (props/*, bindTo*/) {
	var bindTo = arguments[1];
	return map(props, function (desc, name) {
		return define(name, desc, bindTo);
	});
};

},{"es5-ext/object/copy":14,"es5-ext/object/map":22,"es5-ext/object/valid-callable":27,"es5-ext/object/valid-value":29}],8:[function(require,module,exports){
'use strict';

var assign        = require('es5-ext/object/assign')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , isCallable    = require('es5-ext/object/is-callable')
  , contains      = require('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":11,"es5-ext/object/is-callable":17,"es5-ext/object/normalize-options":23,"es5-ext/string/#/contains":30}],9:[function(require,module,exports){
// Inspired by Google Closure:
// http://closure-library.googlecode.com/svn/docs/
// closure_goog_array_array.js.html#goog.array.clear

'use strict';

var value = require('../../object/valid-value');

module.exports = function () {
	value(this).length = 0;
	return this;
};

},{"../../object/valid-value":29}],10:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

'use strict';

var isCallable = require('./is-callable')
  , callable   = require('./valid-callable')
  , value      = require('./valid-value')

  , call = Function.prototype.call, keys = Object.keys
  , propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb/*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort(isCallable(compareFn) ? compareFn.bind(obj) : undefined);
		}
		return list[method](function (key, index) {
			if (!propertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./is-callable":17,"./valid-callable":27,"./valid-value":29}],11:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.assign
	: require('./shim');

},{"./is-implemented":12,"./shim":13}],12:[function(require,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],13:[function(require,module,exports){
'use strict';

var keys  = require('../keys')
  , value = require('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":19,"../valid-value":29}],14:[function(require,module,exports){
'use strict';

var assign = require('./assign')
  , value  = require('./valid-value');

module.exports = function (obj) {
	var copy = Object(value(obj));
	if (copy !== obj) return copy;
	return assign({}, obj);
};

},{"./assign":11,"./valid-value":29}],15:[function(require,module,exports){
// Workaround for http://code.google.com/p/v8/issues/detail?id=2804

'use strict';

var create = Object.create, shim;

if (!require('./set-prototype-of/is-implemented')()) {
	shim = require('./set-prototype-of/shim');
}

module.exports = (function () {
	var nullObject, props, desc;
	if (!shim) return create;
	if (shim.level !== 1) return create;

	nullObject = {};
	props = {};
	desc = { configurable: false, enumerable: false, writable: true,
		value: undefined };
	Object.getOwnPropertyNames(Object.prototype).forEach(function (name) {
		if (name === '__proto__') {
			props[name] = { configurable: true, enumerable: false, writable: true,
				value: undefined };
			return;
		}
		props[name] = desc;
	});
	Object.defineProperties(nullObject, props);

	Object.defineProperty(shim, 'nullPolyfill', { configurable: false,
		enumerable: false, writable: false, value: nullObject });

	return function (prototype, props) {
		return create((prototype === null) ? nullObject : prototype, props);
	};
}());

},{"./set-prototype-of/is-implemented":25,"./set-prototype-of/shim":26}],16:[function(require,module,exports){
'use strict';

module.exports = require('./_iterate')('forEach');

},{"./_iterate":10}],17:[function(require,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],18:[function(require,module,exports){
'use strict';

var map = { function: true, object: true };

module.exports = function (x) {
	return ((x != null) && map[typeof x]) || false;
};

},{}],19:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.keys
	: require('./shim');

},{"./is-implemented":20,"./shim":21}],20:[function(require,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],21:[function(require,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],22:[function(require,module,exports){
'use strict';

var callable = require('./valid-callable')
  , forEach  = require('./for-each')

  , call = Function.prototype.call;

module.exports = function (obj, cb/*, thisArg*/) {
	var o = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key, obj, index) {
		o[key] = call.call(cb, thisArg, value, key, obj, index);
	});
	return o;
};

},{"./for-each":16,"./valid-callable":27}],23:[function(require,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{}],24:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.setPrototypeOf
	: require('./shim');

},{"./is-implemented":25,"./shim":26}],25:[function(require,module,exports){
'use strict';

var create = Object.create, getPrototypeOf = Object.getPrototypeOf
  , x = {};

module.exports = function (/*customCreate*/) {
	var setPrototypeOf = Object.setPrototypeOf
	  , customCreate = arguments[0] || create;
	if (typeof setPrototypeOf !== 'function') return false;
	return getPrototypeOf(setPrototypeOf(customCreate(null), x)) === x;
};

},{}],26:[function(require,module,exports){
// Big thanks to @WebReflection for sorting this out
// https://gist.github.com/WebReflection/5593554

'use strict';

var isObject      = require('../is-object')
  , value         = require('../valid-value')

  , isPrototypeOf = Object.prototype.isPrototypeOf
  , defineProperty = Object.defineProperty
  , nullDesc = { configurable: true, enumerable: false, writable: true,
		value: undefined }
  , validate;

validate = function (obj, prototype) {
	value(obj);
	if ((prototype === null) || isObject(prototype)) return obj;
	throw new TypeError('Prototype must be null or an object');
};

module.exports = (function (status) {
	var fn, set;
	if (!status) return null;
	if (status.level === 2) {
		if (status.set) {
			set = status.set;
			fn = function (obj, prototype) {
				set.call(validate(obj, prototype), prototype);
				return obj;
			};
		} else {
			fn = function (obj, prototype) {
				validate(obj, prototype).__proto__ = prototype;
				return obj;
			};
		}
	} else {
		fn = function self(obj, prototype) {
			var isNullBase;
			validate(obj, prototype);
			isNullBase = isPrototypeOf.call(self.nullPolyfill, obj);
			if (isNullBase) delete self.nullPolyfill.__proto__;
			if (prototype === null) prototype = self.nullPolyfill;
			obj.__proto__ = prototype;
			if (isNullBase) defineProperty(self.nullPolyfill, '__proto__', nullDesc);
			return obj;
		};
	}
	return Object.defineProperty(fn, 'level', { configurable: false,
		enumerable: false, writable: false, value: status.level });
}((function () {
	var x = Object.create(null), y = {}, set
	  , desc = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__');

	if (desc) {
		try {
			set = desc.set; // Opera crashes at this point
			set.call(x, y);
		} catch (ignore) { }
		if (Object.getPrototypeOf(x) === y) return { set: set, level: 2 };
	}

	x.__proto__ = y;
	if (Object.getPrototypeOf(x) === y) return { level: 2 };

	x = {};
	x.__proto__ = y;
	if (Object.getPrototypeOf(x) === y) return { level: 1 };

	return false;
}())));

require('../create');

},{"../create":15,"../is-object":18,"../valid-value":29}],27:[function(require,module,exports){
'use strict';

module.exports = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],28:[function(require,module,exports){
'use strict';

var isObject = require('./is-object');

module.exports = function (value) {
	if (!isObject(value)) throw new TypeError(value + " is not an Object");
	return value;
};

},{"./is-object":18}],29:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],30:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? String.prototype.contains
	: require('./shim');

},{"./is-implemented":31,"./shim":32}],31:[function(require,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],32:[function(require,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],33:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call('');

module.exports = function (x) {
	return (typeof x === 'string') || (x && (typeof x === 'object') &&
		((x instanceof String) || (toString.call(x) === id))) || false;
};

},{}],34:[function(require,module,exports){
'use strict';

var generated = Object.create(null)

  , random = Math.random;

module.exports = function () {
	var str;
	do { str = random().toString(36).slice(2); } while (generated[str]);
	return str;
};

},{}],35:[function(require,module,exports){
'use strict';

var setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , contains       = require('es5-ext/string/#/contains')
  , d              = require('d')
  , Iterator       = require('./')

  , defineProperty = Object.defineProperty
  , ArrayIterator;

ArrayIterator = module.exports = function (arr, kind) {
	if (!(this instanceof ArrayIterator)) return new ArrayIterator(arr, kind);
	Iterator.call(this, arr);
	if (!kind) kind = 'value';
	else if (contains.call(kind, 'key+value')) kind = 'key+value';
	else if (contains.call(kind, 'key')) kind = 'key';
	else kind = 'value';
	defineProperty(this, '__kind__', d('', kind));
};
if (setPrototypeOf) setPrototypeOf(ArrayIterator, Iterator);

ArrayIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(ArrayIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__list__[i];
		if (this.__kind__ === 'key+value') return [i, this.__list__[i]];
		return i;
	}),
	toString: d(function () { return '[object Array Iterator]'; })
});

},{"./":38,"d":8,"es5-ext/object/set-prototype-of":24,"es5-ext/string/#/contains":30}],36:[function(require,module,exports){
'use strict';

var callable = require('es5-ext/object/valid-callable')
  , isString = require('es5-ext/string/is-string')
  , get      = require('./get')

  , isArray = Array.isArray, call = Function.prototype.call;

module.exports = function (iterable, cb/*, thisArg*/) {
	var mode, thisArg = arguments[2], result, doBreak, broken, i, l, char, code;
	if (isArray(iterable)) mode = 'array';
	else if (isString(iterable)) mode = 'string';
	else iterable = get(iterable);

	callable(cb);
	doBreak = function () { broken = true; };
	if (mode === 'array') {
		iterable.some(function (value) {
			call.call(cb, thisArg, value, doBreak);
			if (broken) return true;
		});
		return;
	}
	if (mode === 'string') {
		l = iterable.length;
		for (i = 0; i < l; ++i) {
			char = iterable[i];
			if ((i + 1) < l) {
				code = char.charCodeAt(0);
				if ((code >= 0xD800) && (code <= 0xDBFF)) char += iterable[++i];
			}
			call.call(cb, thisArg, char, doBreak);
			if (broken) break;
		}
		return;
	}
	result = iterable.next();

	while (!result.done) {
		call.call(cb, thisArg, result.value, doBreak);
		if (broken) return;
		result = iterable.next();
	}
};

},{"./get":37,"es5-ext/object/valid-callable":27,"es5-ext/string/is-string":33}],37:[function(require,module,exports){
'use strict';

var isString = require('es5-ext/string/is-string')
  , ArrayIterator  = require('./array')
  , StringIterator = require('./string')
  , iterable       = require('./valid-iterable')
  , iteratorSymbol = require('es6-symbol').iterator;

module.exports = function (obj) {
	if (typeof iterable(obj)[iteratorSymbol] === 'function') return obj[iteratorSymbol]();
	if (isString(obj)) return new StringIterator(obj);
	return new ArrayIterator(obj);
};

},{"./array":35,"./string":40,"./valid-iterable":41,"es5-ext/string/is-string":33,"es6-symbol":42}],38:[function(require,module,exports){
'use strict';

var clear    = require('es5-ext/array/#/clear')
  , assign   = require('es5-ext/object/assign')
  , callable = require('es5-ext/object/valid-callable')
  , value    = require('es5-ext/object/valid-value')
  , d        = require('d')
  , autoBind = require('d/auto-bind')
  , Symbol   = require('es6-symbol')

  , defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , Iterator;

module.exports = Iterator = function (list, context) {
	if (!(this instanceof Iterator)) return new Iterator(list, context);
	defineProperties(this, {
		__list__: d('w', value(list)),
		__context__: d('w', context),
		__nextIndex__: d('w', 0)
	});
	if (!context) return;
	callable(context.on);
	context.on('_add', this._onAdd);
	context.on('_delete', this._onDelete);
	context.on('_clear', this._onClear);
};

defineProperties(Iterator.prototype, assign({
	constructor: d(Iterator),
	_next: d(function () {
		var i;
		if (!this.__list__) return;
		if (this.__redo__) {
			i = this.__redo__.shift();
			if (i !== undefined) return i;
		}
		if (this.__nextIndex__ < this.__list__.length) return this.__nextIndex__++;
		this._unBind();
	}),
	next: d(function () { return this._createResult(this._next()); }),
	_createResult: d(function (i) {
		if (i === undefined) return { done: true, value: undefined };
		return { done: false, value: this._resolve(i) };
	}),
	_resolve: d(function (i) { return this.__list__[i]; }),
	_unBind: d(function () {
		this.__list__ = null;
		delete this.__redo__;
		if (!this.__context__) return;
		this.__context__.off('_add', this._onAdd);
		this.__context__.off('_delete', this._onDelete);
		this.__context__.off('_clear', this._onClear);
		this.__context__ = null;
	}),
	toString: d(function () { return '[object Iterator]'; })
}, autoBind({
	_onAdd: d(function (index) {
		if (index >= this.__nextIndex__) return;
		++this.__nextIndex__;
		if (!this.__redo__) {
			defineProperty(this, '__redo__', d('c', [index]));
			return;
		}
		this.__redo__.forEach(function (redo, i) {
			if (redo >= index) this.__redo__[i] = ++redo;
		}, this);
		this.__redo__.push(index);
	}),
	_onDelete: d(function (index) {
		var i;
		if (index >= this.__nextIndex__) return;
		--this.__nextIndex__;
		if (!this.__redo__) return;
		i = this.__redo__.indexOf(index);
		if (i !== -1) this.__redo__.splice(i, 1);
		this.__redo__.forEach(function (redo, i) {
			if (redo > index) this.__redo__[i] = --redo;
		}, this);
	}),
	_onClear: d(function () {
		if (this.__redo__) clear.call(this.__redo__);
		this.__nextIndex__ = 0;
	})
})));

defineProperty(Iterator.prototype, Symbol.iterator, d(function () {
	return this;
}));
defineProperty(Iterator.prototype, Symbol.toStringTag, d('', 'Iterator'));

},{"d":8,"d/auto-bind":7,"es5-ext/array/#/clear":9,"es5-ext/object/assign":11,"es5-ext/object/valid-callable":27,"es5-ext/object/valid-value":29,"es6-symbol":42}],39:[function(require,module,exports){
'use strict';

var isString       = require('es5-ext/string/is-string')
  , iteratorSymbol = require('es6-symbol').iterator

  , isArray = Array.isArray;

module.exports = function (value) {
	if (value == null) return false;
	if (isArray(value)) return true;
	if (isString(value)) return true;
	return (typeof value[iteratorSymbol] === 'function');
};

},{"es5-ext/string/is-string":33,"es6-symbol":42}],40:[function(require,module,exports){
// Thanks @mathiasbynens
// http://mathiasbynens.be/notes/javascript-unicode#iterating-over-symbols

'use strict';

var setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , d              = require('d')
  , Iterator       = require('./')

  , defineProperty = Object.defineProperty
  , StringIterator;

StringIterator = module.exports = function (str) {
	if (!(this instanceof StringIterator)) return new StringIterator(str);
	str = String(str);
	Iterator.call(this, str);
	defineProperty(this, '__length__', d('', str.length));

};
if (setPrototypeOf) setPrototypeOf(StringIterator, Iterator);

StringIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(StringIterator),
	_next: d(function () {
		if (!this.__list__) return;
		if (this.__nextIndex__ < this.__length__) return this.__nextIndex__++;
		this._unBind();
	}),
	_resolve: d(function (i) {
		var char = this.__list__[i], code;
		if (this.__nextIndex__ === this.__length__) return char;
		code = char.charCodeAt(0);
		if ((code >= 0xD800) && (code <= 0xDBFF)) return char + this.__list__[this.__nextIndex__++];
		return char;
	}),
	toString: d(function () { return '[object String Iterator]'; })
});

},{"./":38,"d":8,"es5-ext/object/set-prototype-of":24}],41:[function(require,module,exports){
'use strict';

var isIterable = require('./is-iterable');

module.exports = function (value) {
	if (!isIterable(value)) throw new TypeError(value + " is not iterable");
	return value;
};

},{"./is-iterable":39}],42:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Symbol : require('./polyfill');

},{"./is-implemented":43,"./polyfill":45}],43:[function(require,module,exports){
'use strict';

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }
	if (typeof Symbol.iterator === 'symbol') return true;

	// Return 'true' for polyfills
	if (typeof Symbol.isConcatSpreadable !== 'object') return false;
	if (typeof Symbol.iterator !== 'object') return false;
	if (typeof Symbol.toPrimitive !== 'object') return false;
	if (typeof Symbol.toStringTag !== 'object') return false;
	if (typeof Symbol.unscopables !== 'object') return false;

	return true;
};

},{}],44:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	return (x && ((typeof x === 'symbol') || (x['@@toStringTag'] === 'Symbol'))) || false;
};

},{}],45:[function(require,module,exports){
'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , Symbol, HiddenSymbol, globalSymbols = create(null);

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			defineProperty(this, name, d(value));
		}));
		return name;
	};
}());

HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('TypeError: Symbol is not a constructor');
	return Symbol(description);
};
module.exports = Symbol = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('TypeError: Symbol is not a constructor');
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(Symbol, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = Symbol(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),
	hasInstance: d('', Symbol('hasInstance')),
	isConcatSpreadable: d('', Symbol('isConcatSpreadable')),
	iterator: d('', Symbol('iterator')),
	match: d('', Symbol('match')),
	replace: d('', Symbol('replace')),
	search: d('', Symbol('search')),
	species: d('', Symbol('species')),
	split: d('', Symbol('split')),
	toPrimitive: d('', Symbol('toPrimitive')),
	toStringTag: d('', Symbol('toStringTag')),
	unscopables: d('', Symbol('unscopables'))
});
defineProperties(HiddenSymbol.prototype, {
	constructor: d(Symbol),
	toString: d('', function () { return this.__name__; })
});

defineProperties(Symbol.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(Symbol.prototype, Symbol.toPrimitive, d('',
	function () { return validateSymbol(this); }));
defineProperty(Symbol.prototype, Symbol.toStringTag, d('c', 'Symbol'));

defineProperty(HiddenSymbol.prototype, Symbol.toPrimitive,
	d('c', Symbol.prototype[Symbol.toPrimitive]));
defineProperty(HiddenSymbol.prototype, Symbol.toStringTag,
	d('c', Symbol.prototype[Symbol.toStringTag]));

},{"./validate-symbol":46,"d":8}],46:[function(require,module,exports){
'use strict';

var isSymbol = require('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":44}],47:[function(require,module,exports){
'use strict';

var setPrototypeOf    = require('es5-ext/object/set-prototype-of')
  , object            = require('es5-ext/object/valid-object')
  , value             = require('es5-ext/object/valid-value')
  , randomUniq        = require('es5-ext/string/random-uniq')
  , d                 = require('d')
  , getIterator       = require('es6-iterator/get')
  , forOf             = require('es6-iterator/for-of')
  , toStringTagSymbol = require('es6-symbol').toStringTag
  , isNative          = require('./is-native-implemented')

  , isArray = Array.isArray, defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty, getPrototypeOf = Object.getPrototypeOf
  , WeakMapPoly;

module.exports = WeakMapPoly = function (/*iterable*/) {
	var iterable = arguments[0], self;
	if (!(this instanceof WeakMapPoly)) throw new TypeError('Constructor requires \'new\'');
	if (isNative && setPrototypeOf && (WeakMap !== WeakMapPoly)) {
		self = setPrototypeOf(new WeakMap(), getPrototypeOf(this));
	} else {
		self = this;
	}
	if (iterable != null) {
		if (!isArray(iterable)) iterable = getIterator(iterable);
	}
	defineProperty(self, '__weakMapData__', d('c', '$weakMap$' + randomUniq()));
	if (!iterable) return self;
	forOf(iterable, function (val) {
		value(val);
		self.set(val[0], val[1]);
	});
	return self;
};

if (isNative) {
	if (setPrototypeOf) setPrototypeOf(WeakMapPoly, WeakMap);
	WeakMapPoly.prototype = Object.create(WeakMap.prototype, {
		constructor: d(WeakMapPoly)
	});
}

Object.defineProperties(WeakMapPoly.prototype, {
	delete: d(function (key) {
		if (hasOwnProperty.call(object(key), this.__weakMapData__)) {
			delete key[this.__weakMapData__];
			return true;
		}
		return false;
	}),
	get: d(function (key) {
		if (hasOwnProperty.call(object(key), this.__weakMapData__)) {
			return key[this.__weakMapData__];
		}
	}),
	has: d(function (key) {
		return hasOwnProperty.call(object(key), this.__weakMapData__);
	}),
	set: d(function (key, value) {
		defineProperty(object(key), this.__weakMapData__, d('c', value));
		return this;
	}),
	toString: d(function () { return '[object WeakMap]'; })
});
defineProperty(WeakMapPoly.prototype, toStringTagSymbol, d('c', 'WeakMap'));

},{"./is-native-implemented":6,"d":8,"es5-ext/object/set-prototype-of":24,"es5-ext/object/valid-object":28,"es5-ext/object/valid-value":29,"es5-ext/string/random-uniq":34,"es6-iterator/for-of":36,"es6-iterator/get":37,"es6-symbol":42}]},{},[2]);
