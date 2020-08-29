// Default options
const defaults = {
  autoplay: false,
  autoplayInterval: 3000,
  breakpoint: 640,
  disabledIndex: null,
  history: 'replace', // 'replace' | 'push' | false
  keyboard: 'select', // 'select' | 'focus' | false
  keyboardAccordion: 'vertical',
  keyboardTabs: 'horizontal',
  panelHeight: 'auto', // 'auto' | 'equal' | 'adaptive'
  pauseOnFocus: true,
  pauseOnHover: false,
  resizeTimeout: 100,
  selectEvent: 'click', // 'click' | 'hover'
  slidingAccordion: false,
  startIndex: 0,
  transitionDuration: 500,
};

let options = defaults;

// Custom processor for merging values
// - undefined, null: ignore
// - true: override only if the default type is boolean
// - false or other types: override
function mergeOptions(targetObject, sourceObject) {
  if (!sourceObject) {
    return targetObject;
  }
  if (typeof sourceObject !== 'object') {
    throw new Error('Options should be an object type.');
  }
  let target;
  let source;
  return Object.keys(targetObject).reduce((merged, key) => {
    target = targetObject[key];
    source = sourceObject[key];
    if (source === undefined || source === null) {
      merged[key] = target;
    } else if (source === true) {
      merged[key] = typeof target === 'boolean' ? source : target;
    } else {
      merged[key] = source;
    }
    return merged;
  }, {});
}

// Config custom classnames
function setDefaults(userOptions) {
  options = mergeOptions(defaults, userOptions);
}

// Merge user options with defaults
function processOptions(userOptions) {
  return mergeOptions(options, userOptions);
}

export { setDefaults, processOptions };
