# Skeletabs

## Introducing Skeletabs
Skeletabs, of which the name deriving from a combination of words "skeleton" and "tabs", is a jQuery plugin that gives your contents a tabbed browsing ability including accessibility and responsivity support, along with a high customizability.

With Skeletabs, you can:
* Of course, navigate across tabbed contents.
* Choose the default active tab.
* Disable one or multiple tabs.
* Equalize all panels height.
* Assign your own class names for the entire structure.
* Swap to accordion layout at a custom breakpoint.
* Choose whether to navigate by clicking or by hovering.
* Enable keyboard navigation for keyboard users.
* Update the hash tag in the browser URL.
* Set autoplay option and use it like a carousel.
* Animate switching action(customizable).
* Bind your own function to `tabswitch` event.

### Can I use this for free?
Sure you do. This plugin is licensed under MIT license meaning you have full rights to use it, edit it, distrubte it and so on, as long as you include the copyright notice to your copy.

### Are there any dependencies for this plugin?
So far nothing else than the jQuery library. Skeletabs is being tested with versions of jQuery 1.x through 3.x(latest revision of each set) — you only have to have one of them installed. That's it.

### How far can I go with IE?
Bundled CSS and JS will work in IE8.

### I have an issue, how to report it?
[Issues on GitHub repos](https://github.com/findawayer/Skeletabs/issues) is the official channel for bug report and/or suggestion. If you are not interested in signing up to GitHub but wish to notify me something, please do so by writing to [my mail address](mailto:findawayer@gmail.com).

## How to install it?
1. Download the package:
2. Ready-to-use sources are located in `/dist` folder.
3. Insert CSS and JS into your HTML.
```html
<!DOCTYPE html>
<html>
    <head>

        <link rel="stylesheet" type="text/css" href="PATH/TO/STYLESHEET/skeletabs.css" />
    </head>
    <body>

        <script type="text/javascript" src="PATH/TO/SCRIPT/skeletabs.js"></script>
    </body>
</html>
```
4. If you have to support IE 8, please use skeletabs.core.js instead of skeletabs.js. (The webpack-bundled JS includes lines that cannot run in IE8.)

## Example usage

### HTML Syntax
```html
<div id="skltbsDefault" class="skltbs">
    <ul role="tablist" class="skltbs-tab-group">
        <li role="presentation" class="skltbs-tab-item">
            <a role="tab" class="skltbs-tab" href="#{1st panel's id}">Tab 1</a>
        </li>
        <li role="presentation" class="skltbs-tab-item">
            <a role="tab" class="skltbs-tab" href="#{2nd panel's id}">Tab 2</a>
        </li>
        <li role="presentation" class="skltbs-tab-item">
            <a role="tab" class="skltbs-tab" href="#{3rd panel's id}">Tab 3</a>
        </li>
        <li role="presentation" class="skltbs-tab-item">
            <a role="tab" class="skltbs-tab" href="#{4th panel's id}">Tab 4</a>
        </li>
    </ul>
    <div class="skltbs-panel-group">
        <div role="tabpanel" id="{1st panel's id}" class="skltbs-panel">{1st panel}</div>
        <div role="tabpanel" id="{2nd panel's id}" class="skltbs-panel">{2nd panel}</div>
        <div role="tabpanel" id="{3rd panel's id}" class="skltbs-panel">{3rd panel}</div>
        <div role="tabpanel" id="{4th panel's id}" class="skltbs-panel">{4th panel}</div>
    </div>
</div>
```
* Requirements for the markup are the panel's id. You need to give an (unique) id to every panel, and make your tab point to the matching panel.
* You are encouraged to assign an id to each of the tabs also. Otherwise, Skeletabs will generate it based on the corresponding panel's id.
* Class names starting with skltbs- are default names. You can specify your own class names using classes options.

### JavaScript
```javascript
$("#myElement").skeletabs();
```
* Above is the simplest call. Options can be passed as argument object, as described below in "API documentation" section.

## Documentation
Complete API documentation and example snippets are available at: https://findawayer.github.io/Skeletabs/