# vueify-simple

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

This is a super simple [browserify](http://browserify.org/) transform for
[Vue components](https://vuejs.org/). There is no support for styles yet but
it's planned for a future version.

## Why?

Browserify transforms should be simple and only do one task. Other transforms
assume you use Babel and already do a lot more than only transform your
components.

It's cool to use Babel but you probably want to do that in an additional
browserify transform.

## Usage

It's simple:

```bash
npm install vueify-simple --save-dev
browserify -t vueify-simple app.js -o app.bundle.js
```

## Example

There are various examples (more coming soon!) in the folder `examples/` on how
`vueify-simple` can be used.

## Limitations

For now, the functionality of this module is heavily limited. It only works on
plain HTML `<template>`s and normal JavaScript. `<style>` tags are
supported but for now they have to be in CSS. Support for SASS etc. will come
soon!

If you want to contribute to this module, feel free to open an issue or submit
a pull request. Any help is appreciated.
