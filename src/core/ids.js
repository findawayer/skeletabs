// Id map
const ids = {};

// Create unique id of same `type` and return it `prefix`-ed.
function nextId({ type, prefix = '' }) {
  ids[type] = (ids[type] || 0) + 1;
  return prefix + ids[type];
}

// Use UNIX timestamp as id
function getTimeId() {
  return Date.now();
}

// Make sure all tabs/panels have an id;
// if one of them is missing id, assign a newly created one
function setIds($elements, options) {
  return $elements
    .map((_, element) => {
      if (!element.id) {
        element.id = nextId(options);
        // Use `originalId` attribute to detect the id was made up.
        // Needed for destroy() process.
        element.dynamicId = true;
      }
      return element.id;
    })
    .get();
}

// Clean up generated ids
function unsetIds($elements) {
  $elements.each(function (_, element) {
    if (element.dynamicId) {
      element.removeAttribute('id');
      delete element.dynamicId;
    }
  });
}

export { nextId, getTimeId, setIds, unsetIds };
