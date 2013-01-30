module('srcset validation');

test('valid image candidate strings validate', function() {
  var s1 = new SrcsetInfo({src: 'pear.jpeg', srcset: 'pear-mobile.jpeg'});
  ok(s1.isValid, 'simple image candidates without descriptors understood.');
  var s2 = new SrcsetInfo({src: 'pear.jpeg', srcset: 'pear-mobile.jpeg 720w'});
  ok(s2.isValid, 'simple image candidates understood.');
  var s3 = new SrcsetInfo({srcset: 'pear-mobile.jpeg 1.1x'});
  ok(s3.isValid, 'simple image candidates understood.');
  var s4 = new SrcsetInfo({srcset: 'pear-mobile.jpeg 720w, pear-tablet.jpeg 1280w'});
  ok(s4.isValid, 'compound image candidates understood.');
  var s5 = new SrcsetInfo({srcset: 'pear-mobile.jpeg 720w, pear-tablet.jpeg 1280w, pear-desktop.jpeg 1x'});
  ok(s5.isValid, 'complex compound image candidates understood.');
});

test('invalid image candidate strings do not validate', function() {
  var s1 = new SrcsetInfo({srcset: 'pear-mobile.jpeg 720k, pear-tablet.jpeg 1280w'});
  ok(!s1.isValid, 'unknown descriptor units rejected');
  var s2 = new SrcsetInfo({srcset: 'pear-mobile.jpeg 7.2w, pear-tablet.jpeg 1280w'});
  ok(!s2.isValid, 'non-integer widths rejected.');
});

module('srcset parsing');

test('single image declarations set to the right defaults', function() {
  var s1 = new SrcsetInfo({srcset: 'pear-mobile.jpeg'});
  var img = s1.imageCandidates[0];
  equal(img.x, 1, 'default density set');
  equal(img.w, Infinity, 'default width set');
  equal(img.h, Infinity, 'default height set');
});

test('single image declarations parse correctly', function() {
  var s1 = new SrcsetInfo({srcset: 'pear-mobile.jpeg 720w'});
  var img = s1.imageCandidates[0];
  equal(img.src, 'pear-mobile.jpeg', 'image src validates');
  equal(img.w, 720, 'width set');
});

test('multiple image candidates parse correctly', function() {
  var s1 = new SrcsetInfo({srcset: 'pear-mobile.jpeg 720w, pear-tablet.jpeg 1280w, pear-desktop.jpeg 1.5x'});
  equal(s1.imageCandidates.length, 3, '3 image candidates found');
  var img = s1.imageCandidates[2];
  equal(img.x, 1.5, 'last image candidate density is 1.5');
});

test('repeated values for image candidates are ignored', function() {
  var s1 = new SrcsetInfo({srcset: 'pear-mobile.jpeg 720w, pear-tablet.jpeg 720w'});
  equal(s1.imageCandidates.length, 1, '1 image candidate found');
  var img = s1.imageCandidates[0];
  equal(img.src, 'pear-mobile.jpeg', 'last candidate ignored.');
});


module('image candidate selection');

test('simple srcset picks correct image candidate', function() {
  var old = new ViewportInfo();
  old.setForTesting({w: 2000, h: 1000, x: 1});
  var s1 = new SrcsetInfo({src: 'banner.jpeg', srcset: 'banner-HD.jpeg 2x'});
  var img = old.getBestImage(s1);
  equal(img.src, 'banner.jpeg', 'picked right image');
  var hd = new ViewportInfo();
  hd.setForTesting({w: 2000, h: 1000, x: 2});
  var img = hd.getBestImage(s1);
  equal(img.src, 'banner-HD.jpeg', 'picked right image');
});

test('ambiguous srcset picks best image candidate', function() {
  var vp = new ViewportInfo();
  vp.setForTesting({w: 500, h: 500});
  var s1 = new SrcsetInfo({src: 'banner.jpeg',
                        srcset: 'banner-wide.jpeg 300w 1000h, banner-tall.jpeg 1000w 300h, banner.jpeg'});
  var img = vp.getBestImage(s1);
  equal(img.src, 'banner.jpeg', 'makes sense.');
});

test('complex srcset picks best image candidate', function() {
  var mobile = new ViewportInfo();
  mobile.setForTesting({w: 320, h: 480, x: 2});
  var s1 = new SrcsetInfo({src: 'banner.jpeg', srcset: 'banner-HD.jpeg 2x, banner-phone.jpeg 400w, banner-phone-HD.jpeg 400w 2x'});
  var img = mobile.getBestImage(s1);
  equal(img.src, 'banner-phone-HD.jpeg', 'picked best image for phone');

  var desktop = new ViewportInfo();
  desktop.setForTesting({w: 1440, h: 1280, x: 2});
  img = desktop.getBestImage(s1);
  equal(img.src, 'banner-HD.jpeg', 'picked best image for desktop');

  var old = new ViewportInfo();
  old.setForTesting({w: 320, h: 480, x: 1});
  img = old.getBestImage(s1);
  equal(img.src, 'banner-phone.jpeg', 'picked best image for desktop');
});

test('john mellor test', function() {
  var mobile = new ViewportInfo();
  mobile.setForTesting({w: 320, h: 480, x: 2.1});
  var s1 = new SrcsetInfo({srcset: 'ipad1.jpg 1024w, iphone4.jpg 320w 2x'});
  var img = mobile.getBestImage(s1);
  equal(img.src, 'iphone4.jpg', 'picked best image for phone');
});

test('srcset values with commas in URLs', function () {
  var s1 = new SrcsetInfo({src: 'banner.jpeg', srcset: '/c_limit,w_360/banner.jpeg 2x'});
  equal(s1.imageCandidates.length, 2);
  var candidate = s1.imageCandidates[0];
  equal(candidate.src, "/c_limit,w_360/banner.jpeg");
  equal(candidate.x, 2);
});
