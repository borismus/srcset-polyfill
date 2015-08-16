# A spec-compatible, unit-tested polyfill for `<img srcset>`

See [the specification][spec] for the reference algorithm.

## Usage

Use the `data-srcset` attribute of `<img>` elements. For example:

```html
<img alt="The Breakfast Combo"
  src="160x120.png"
  data-srcset="320x240.png 320w,640x480 320w 2x, 768x576.png 768w,1536x1152.png 768w 2x, 1024x768.png 1024w,2048x1536.png 1024w 2x, 2048x1536.png 5000w">
```

Include `build/srcset.min.js` in your page.



## Open questions

- How to reliably check for srcset support in the browser (so as to not
  attempt to polyfill if it's not necessary?)
- Is it safe to use `-webkit-transform` to scale things?
- Is it worth falling back to `-webkit-image-set` if available?

## Using srcset-polyfill to reduce bandwidth for mobile devices

If you are wanting to serve smaller images to mobile devices **to reduce
bandwidth** it is important to set your syntax correctly to [avoid downloading
the mobile optimised image and the original (larger) image][issue11]. The
correct syntax to use is:

> `<img src="small.jpg" srcset="small.jpg 320w, medium.jpg 960w, large.jpg" />`

#### Notes

* Include the smallest image in the `src` attribute (in the above example:
`small.jpg`).
* Include the smallest image and its associated **max** viewport width in the
`srcset` attribute (in the above example: `small.jpg 320w`).
* Include any other, wider viewport widths in the `srcset` attribute (in the
above example: `medium.jpg 960w`).
* Include the full size image in the `srcset` attribute, without any viewport
width restriction (in the above example; `large.jpg`).

[spec]: http://www.whatwg.org/specs/web-apps/current-work/multipage/embedded-content-1.html#processing-the-image-candidates
[issue11]: https://github.com/borismus/srcset-polyfill/issues/11
