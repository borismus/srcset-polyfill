all: build/srcset.js build/srcset.min.js

build/srcset.js: ./node_modules/.bin/browserify $(shell find -L js -name '*.js')
	./node_modules/.bin/browserify ./js/srcset.js > $@

build/srcset.min.js: build/srcset.js
	./node_modules/.bin/uglifyjs $^ -o $@ -m

node_modules ./node_modules/%:
	npm install