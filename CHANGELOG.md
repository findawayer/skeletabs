## 2.1.1 (2020-11-10)

### Functionality

- Add ability to deactivate the instance below responsive breakpoint.

### API: Options

- Add `breakpointLayout`: the type of alternative layout to use.

## 2.0.1 (2020-08-29)

### Functionality

- Add numpad support.

## 2.0.0 (2020-08-20)

### Functionality

- Drop IE8 support.
- Support nested Skeletabs instances.
- Auto init with `data-skeletabs` attribute of the container element.
- Redesign keyboard functionality to meet [WAI-ARIA 1.1 standards](https://www.w3.org/TR/wai-aria-practices-1.1/examples/tabs/tabs-1/tabs.html).
  - Move only between the tabs, not across the panels.
  - Accept mobile keyboard inputs.
- Add ability to dynamically add/remove panels.
- Add ability to navigate back and forth via history API.
- Add ability to pause autoplay while being hovered.
- Add ability to destroy existing instances.
- Turn off URL hash change while autoplaying.
- Use debounce to limit the rate of layout changes for better performance.
- Move starting index to next available one if `startIndex` and `disableIndex` conflict.

### Styling

- Handle required style changes with JS.
- Add 2 new bundled themes: light, dark.
- Use CSS transition instead of animation for easier management &amp; wider browser support.
  - Bundled effects can be enabled with `use-[effect]` class on the container.

### API: Options

- Rename:
  - `responsive` to `accordion`
  - `defaultTab` to `startIndex`.
  - `extendedKeyboard` to `keyboard`.
  - `triggerEvent` to `triggerOn`.
  - `updateUrl` to `updateURL`.
- Add:
  - `resizeTimeout`: time delay for layout update while resizing viewport. (debounce)
  - `transitionDuration`: duration of the one-way transition effect.
  - `accordion.slideEffect`: use slide effect on accordion hide/show.
- Deprecate:
  - `animation`:
    - Animations now use CSS transitions instead of animations.
    - Bundled animations from v1 are kept supported.
  - `classes`: seperated as a stand-alone parameter.

### API: ClassNames

- Use classNames as a second parameter.
- Prepend `skltbs-` to all classes for consistency.
- Add ability to change the default `skltbs-` prefix.
- Add state classNames:
  - `isInit`: to the container when Skeletabs is active.
  - `tabsMode`: to the container when using tabs layout.
  - `accordionMode`: to the container when using accordion layout.
  - `active`: to both the active tab and its wrapping `li` element.
  - `disabled`: to both the disabled tab and its wrapping `li` element.
  - `enter`, `enterActive`: to the panel getting visible.
  - `enterDone`: to the panel gone visible.
  - `leave`, `leaveActive`: to the panel getting invisible.
  - `leaveDone`: to the panel gone invisible.

### API: Methods

- Add ability to configure default settings & CSS classes.
  - `$.skeletabs.setDefaults` can modify default options.
  - `$.skeletabs.setClassNames` can modify default classNames.
- Add method:
  - `destroy`: reset all modifications and remove instance.
  - `reload`: refresh layout and element sizes.
  - `goTo`: move to a panel by index.
  - `next`: move to the next panel.
  - `prev`: move to the previous panel.
  - `add`: append a new set of tab &amp; panel.
  - `remove`: remove a set of tab &amp; panel.
  - `play`: start autoplaying.
  - `pause`: pause autoplaying.
  - `getCurrentInfo`: get core data.

### API: Events

- Add event:
  - `skeletabs:init`: after initialization.
  - `skeletabs:move`: before moving to another panel.
  - `skeletabs:moved`: after moved to another panel.
  - `skeletabs:layoutchange`: after going from tabs to accordion and vice versa.
- Deprecate `tabswitch` event.

### Development

- Migrate to full ES6.
- Improved API to be more intuitive.
- Use yarn as package manager.
- Use editorconfig/prettier/eslint as formatter and linter.

## 1.0.0 (2017-03-15)

- First release
