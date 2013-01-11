# A spec-compatible, unit-tested polyfill for `<img srcset>`

See [the specification][spec] for the reference algorithm.

## Usage

Use the `srcset` attribute of `<img>` elements. For example:

```html
<img alt="The Breakfast Combo"
     src="banner.jpeg"
     srcset="banner-HD.jpeg 2x, banner-phone.jpeg 100w,
             banner-phone-HD.jpeg 100w 2x"/>
```

To programatically update the `src` attribute of dynamically
inserted elements, there is a declarative API:

```javascript
var image = document.getElementsByTagName('img')[0];
setBestImageFor(image);
```

Include `build/srcset.min.js` in your page.

## Open questions

- How to reliably check for srcset support in the browser (so as to not
  attempt to polyfill if it's not necessary?)
- Is it safe to use `-webkit-transform` to scale things?
- Is it worth falling back to `-webkit-image-set` if available?

[spec]: http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content-1.html#processing-the-image-candidates
