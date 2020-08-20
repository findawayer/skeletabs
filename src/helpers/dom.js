// (https://github.com/jquery/jquery/blob/d0ce00cdfa680f1f0c38460bc51ea14079ae8b07/src/css/hiddenVisibleSelectors.js)
function isOccupyingSpace(element) {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  );
}

// Check if
// 1. They have a CSS display value of none.
// 2. Their width and height are explicitly set to 0.
function isExplicitelyHidden(element) {
  const { display, width, height } = element.style;
  return display === 'none' || (width === '0' && height === '0');
}

// Find out which element in the DOM tree is hiding the passed element.
export function findHiddenInTree(element) {
  // If current element is explicitely set hidden by CSS declarations
  if (isExplicitelyHidden(element)) {
    return element;
  }
  // If the passed element is occupying some space, it is visible
  if (isOccupyingSpace(element)) {
    return null;
  }
  // The element is the top level element
  if (element.parentElement === document.documentElement) {
    return null;
  }
  // Recursively look up to the element tree and find hidden ancestor
  return findHiddenInTree(element.parentElement);
}

// Reveal the element for a short while to be able to measure its dimension
export function showInstantly(element) {
  // cache initial style attribute values
  element.initialDisplay = element.style.display;
  element.initialWidth = element.style.width;
  element.initialHeight = element.style.height;
  element.initialVisibility = element.style.visibility;
  // show it
  element.style.display = 'block';
  element.style.width = 'auto';
  element.style.height = 'auto';
  element.style.visibility = 'hidden';
}

// Hide revealed element by `showInstantly()`
export function hideBack(element) {
  element.style.display = element.initialDisplay;
  element.style.width = element.initialWidth;
  element.style.height = element.initialHeight;
  element.style.visibility = element.initialVisibility;
}
