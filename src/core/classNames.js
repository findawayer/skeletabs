const defaults = {
  tabGroup: 'skltbs-tab-group',
  tabItem: 'skltbs-tab-item',
  tab: 'skltbs-tab',
  panelGroup: 'skltbs-panel-group',
  panel: 'skltbs-panel',
  panelHeading: 'skltbs-panel-heading',
  init: 'skltbs-init',
  tabsMode: 'skltbs-mode-tabs',
  accordionMode: 'skltbs-mode-accordion',
  active: 'skltbs-active',
  disabled: 'skltbs-disabled',
  enter: 'skltbs-enter',
  enterActive: 'skltbs-enter-active',
  enterDone: 'skltbs-enter-done',
  leave: 'skltbs-leave',
  leaveActive: 'skltbs-leave-active',
  leaveDone: 'skltbs-leave-done',
};

// Copy default classNames
let classNames = $.extend({}, defaults);

// Get a copy of defaults with each value prefixed by `userPrefix`
function getPrefixedClassNames(userPrefix) {
  return Object.keys(defaults).reduce((prefixed, key, index, array) => {
    prefixed[key] = defaults[key].replace('skltbs', userPrefix);
    return prefixed;
  }, {});
}

// Get classNames object
function getClassNames(arg) {
  switch (typeof arg) {
    case 'object':
      return $.extend({}, classNames, arg);
    case 'string':
      return getPrefixedClassNames(arg);
    default:
      return classNames;
  }
}

// Config custom classnames
function setClassNames(arg) {
  if (typeof arg === 'object') {
    $.extend(classNames, arg);
  }
  if (typeof arg === 'string') {
    classNames = getPrefixedClassNames(arg);
  }
  throw new Error('setClassNames requires an object or a string as argument.');
}

export { getClassNames, setClassNames };
