(function(exports) {

  // Directly from http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url:
  var urlRegex = '[-a-zA-Z0-9@:%_+.~#?&//=]*';
  var imageFragmentRegex = '\\s*(' + urlRegex + ')\\s*([0-9xwh.\\s]*)';
  var srcsetRegex = '(' + imageFragmentRegex + ',?)+';

  var IMAGE_FRAGMENT_REGEXP = new RegExp(imageFragmentRegex);
  var SRCSET_REGEXP = new RegExp(srcsetRegex);
  var INT_REGEXP = /^[0-9]+$/;

  function SrcsetInfo(srcsetValue) {
    this.imageCandidates = [];
    this.srcsetValue = srcsetValue;
    this.isValid = true;
    this.error = '';

    this._parse(srcsetValue);
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
      for (var j = 0; j < this.imageCandidates.length; j++) {
        var existingCandidate = this.imageCandidates[j];
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
