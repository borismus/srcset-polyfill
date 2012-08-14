(function(exports) {

  // Directly from http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url:
  var urlRegex = '[-a-zA-Z0-9@:%_+.~#?&//=]*';
  var imageFragmentRegex = '\\s*(' + urlRegex + ')\\s*([0-9xwh.\\s]*)';
  var srcsetRegex = '(' + imageFragmentRegex + ',?)+';

  var IMAGE_FRAGMENT_REGEXP = new RegExp(imageFragmentRegex);
  var SRCSET_REGEXP = new RegExp(srcsetRegex);

  function SrcsetInfo(srcsetValue) {
    this.imageCandidates = [];
    this.srcsetValue = srcsetValue;

    this._parse(srcsetValue);
  }

  /**
   * Parses the string that goes srcset="here".
   *
   * @returns [{url: _, x: _, w: _, h:_}, ...]
   */
  SrcsetInfo.prototype._parse = function() {
    var validity = this._validate(this.srcsetValue);
    if (!validity.isValid) {
      // Report validation error.
      console.error('srcset validation error: ' + validity.error);
      return;
    }

    // Get image candidate fragments from srcset string.
    var candidateStrings = this.srcsetValue.split(',');
    // Iterate through the candidates.
    for (var i = 0; i < candidateStrings.length; i++) {
      var candidate = candidateStrings[i];
      // Get all details for the candidate.
      var match = candidate.match(IMAGE_FRAGMENT_REGEXP);
      var src = match[1];
      var desc = this._parseDescriptors(match[2]);
      var imageInfo = new ImageInfo({
        src: match[1],
        x: desc.x,
        w: desc.w,
        h: desc.h
      });
      // Only add this candidate if this desc doesn't duplicate an existing
      // image candidate.
      var isUnique = true;
      for (i = 0; i < this.imageCandidates.length; i++) {
        var existingCandidate = this.imageCandidates[i];
        if (existingCandidate.x == imageInfo.x &&
            existingCandidate.w == imageInfo.w &&
            existingCandidate.h == imageInfo.h) {
          isUnique = false;
          break;
        }
      }
      if (isUnique) {
        this.imageCandidates.push(imageInfo);
      }
    }
  };

  SrcsetInfo.prototype._parseDescriptors = function(descString) {
    var descriptors = descString.split(/\s/);
    var out = {};
    for (var i = 0; i < descriptors.length; i++) {
      var desc = descriptors[i];
      var lastChar = desc[desc.length-1];
      var value = desc.substring(0, desc.length-1);
      out[lastChar] = value;
    }
    return out;
  };

  /**
   * Does validation as per the spec (http://goo.gl/KWYzD).
   *
   * @returns {isValid: _, (error): _}
   */
  SrcsetInfo.prototype._validate = function() {
    // Check against a rough regex:
    var match = this.srcsetValue.match(SRCSET_REGEXP);
    var isValid = false;
    // Go through matches. If any are true, return true. Otherwise, false.
    for (var i = 0; i < match.length; i++) {
      if (match[i] !== '') {
        isValid = true;
        break;
      }
    }
    var out = {isValid: isValid};
    if (!isValid) {
      out.error = 'Invalid srcset syntax for image';
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
