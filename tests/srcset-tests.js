module('srcset validation');

test('valid image candidate strings validate', function() {
  var s1 = new SrcsetInfo('pear-mobile.jpeg');
  var s2 = new SrcsetInfo('pear-mobile.jpeg 720w');
  var s3 = new SrcsetInfo('pear-mobile.jpeg 1.1x');
  var s4 = new SrcsetInfo('pear-mobile.jpeg 720w, pear-tablet.jpeg 1280w');
  var s5 = new SrcsetInfo('pear-mobile.jpeg 720w, pear-tablet.jpeg 1280w, pear-desktop.jpeg 1x');
  ok(false, 'parser works fine!');
});

test('invalid image candidate strings do not validate', function() {
  var s1 = new SrcsetInfo('pear-mobile.jpeg 720k, pear-tablet.jpeg 1280w');
});

module('srcset parsing');

test('single image declarations parse correctly', function() {
  ok(false, 'parser works fine!');
});

test('multiple image candidates parse correctly', function() {
  ok(false, 'parser works fine!');
});

test('optional w/h/x values work correctly', function() {
  ok(false, 'parser works fine!');
});

test('repeated values for image candidates are ignored', function() {
  ok(false, 'parser works fine!');
});


module('image candidate selection');

test('unambiguous srcset picks correct image candidate', function() {
  ok(false, 'parser works fine!');
});

test('ambiguous srcset picks best image candidate', function() {
  ok(false, 'parser works fine!');
});

test('complex srcset picks best image candidate', function() {
  ok(false, 'parser works fine!');
});
