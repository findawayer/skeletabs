# [Skeletabs](https://findawayer.github.io/skeletabs/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/findawayer/skeletabs/blob/master/LICENSE)

Skeletabs is an open source **jQuery plugin** that provides tabbed browsing feature to your web contents. It is focused on **accessibility** and **scalability** above all else, and is designed to support convenience of screen readers and keyboard users, as well as to encourage developers' creative uses.

- [Documentation](https://findawayer.github.io/skeletabs/)
  - [Demo](https://findawayer.github.io/skeletabs/#Demo)
  - [Options](https://findawayer.github.io/skeletabs/#Options)
  - [Methods](https://findawayer.github.io/skeletabs/#Methods)
  - [Events](https://findawayer.github.io/skeletabs/#Events)
  - [Themes](https://findawayer.github.io/skeletabs/#Themes)
  - [Transition effects](https://findawayer.github.io/skeletabs/#Transition-effects)
  - [FAQ](https://findawayer.github.io/skeletabs/#FAQ)

> Skeletabs works on all ECMAScript 5 compliant browsers. We have no plan to support IE 8 and prior that are unable to parse compressed source codes.

> v1.7.0 and higher versions are supported. (slim versions provided with v3.x will not work.)

## Get started

Please download [the latest version of Skeletabs](https://github.com/findawayer/skeletabs/releases). Ready-to-use resources are located in `/dist` folder.

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="skeletabs.css" />
  </head>
  <body>
    <script src="jquery.js"></script>
    <script src="skeletabs.js"></script>
  </body>
</html>
```

- Embed downloaded resources like above.
- Skeletabs expects jQuery to be loaded beforehand.
- The CSS file contains opinionated themes and effects. You don't need to include it if you are going to create your own look and feel.

## HTML

Skeletabs parses the HTML structure based on class attributes. Please assign relevant classes to your elements within the tree.

```html
<div>
  <!-- container -->
  <ul class="skltbs-tab-group">
    <!-- tabGroup -->
    <li class="skltbs-tab-item">
      <!-- tabItem -->
      <button class="skltbs-tab">{{Tab 1}}</button
      ><!-- tab -->
    </li>
    <li class="skltbs-tab-item">
      <button class="skltbs-tab">{{Tab 2}}</button>
    </li>
  </ul>
  <div class="skltbs-panel-group">
    <!-- panelGroup -->
    <div class="skltbs-panel">{{Panel 1}}</div>
    <!-- panel -->
    <div class="skltbs-panel">{{Panel 2}}</div>
  </div>
</div>
```

The plugin generates an `id` for all tabs and panels to meet the accessiblity requirements. (Unless they're already given one.)

```html
<div class="skltbs-panel-group">
  <div class="wrapper">
    <div class="another-wrapper">
      <div class="skltbs-panel">{{Panel 1}}</div>
      <div class="skltbs-panel">{{Panel 2}}</div>
    </div>
  </div>
</div>
```

You can add any wrapping elements between the panelGroup and the panels. Please note that panels should stay siblings.

## CSS

The plugin comes with a couple of built-in themes: light / dark. You can enable them just by adding a CSS class with `skltbs-theme-` prefix to the container element.

```html
<!-- container -->
<div class="skltbs-theme-light">...</div>
```

Likewise, 4 different types of effect are available — fade / fade-toggle / drop / rotate — which can be applied using a `use-` prefixed class.

```html
<!-- container -->
<div class="skltbs-theme-light use-fade">...</div>
```

## JS

Once DOM is ready, you can now initialize Skeletabs like next:

```js
$('#container').skeletabs();
```

And below is the configuration syntax for custom options:

```js
$('#container').skeletabs({
  startIndex: 2,
});
```

## Autoinit without JS

You can omit the JS portion descripbed above and activate Skeletabs by using `data-skeletabs` attribute of the container element.

```html
<!-- container -->
<div data-skeletabs>...</div>
```

`data-skeletabs` attribute accepts a JSON object to configure custom options.

```html
<!-- container -->
<div data-skeletabs='{ "autoplay": true, "panelHeight": "adaptive" }'>...</div>
```

`data-skeletabs-class` attributes is used to configure custom CSS class names.

```html
<!-- container -->
<div data-skeletabs-class='{ "panelGroup": "content", "panel": "section" }'>
  ...
</div>
```

```html
<!-- container -->
<div data-skeletabs-class="myprefix">...</div>
```

- A JSON object will modify classes that match the object keys.
- A string will replace `skltbs` prefix.
