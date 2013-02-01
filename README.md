# A spec-compatible, unit-tested polyfill for `<img srcset>`

See [the specification][spec] for the reference algorithm.

## Usage

Use the `srcset` attribute of `<img>` elements. For example:

    <img alt="The Breakfast Combo"
         src="banner.jpeg"
         srcset="banner-HD.jpeg 2x, banner-phone.jpeg 100w,
                 banner-phone-HD.jpeg 100w 2x"/>


Include `build/srcset.min.js` in your page.

## Open questions

- How to reliably check for srcset support in the browser (so as to not
  attempt to polyfill if it's not necessary?)
- Is it safe to use `-webkit-transform` to scale things?
- Is it worth falling back to `-webkit-image-set` if available?

## Want to reduce bandwidth use on mobile devices?

This project is not suitable for you if you are wanting to serve smaller images
to mobile devices *to reduce bandwidth*. The device will download the original
(larger) image and the mobile optimised version. [More detail on this][issue11].

[spec]: http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content-1.html#processing-the-image-candidates
[issue11]: https://github.com/borismus/srcset-polyfill/issues/11
