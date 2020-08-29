// Check if passed element occupies at least 1x1 px.
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
  // The element is explicetely set hidden by CSS declarations.
  if (isExplicitelyHidden(element)) {
    return element;
  }
  // We consider the element visible if it takes up space.
  if (isOccupyingSpace(element)) {
    return null;
  }
  // We can't search further as the currnet element is the top level element.
  if (element.parentElement === document.documentElement) {
    return null;
  }
  // Recursively look up to the element tree and find hidden ancestor.
  return findHiddenInTree(element.parentElement);
}

// Force passed element to be visible.
// (for a short while to be able to measure its actual dimension)
export function showInstantly(element) {
  // Cache initial style
  element.initialDisplay = element.style.display;
  element.initialWidth = element.style.width;
  element.initialHeight = element.style.height;
  element.initialVisibility = element.style.visibility;
  // Show it
  element.style.display = 'block';
  element.style.width = 'auto';
  element.style.height = 'auto';
  element.style.visibility = 'hidden';
}

// Hide element back that has been revealed with `showInstantly` above.
export function hideBack(element) {
  element.style.display = element.initialDisplay;
  element.style.width = element.initialWidth;
  element.style.height = element.initialHeight;
  element.style.visibility = element.initialVisibility;
}
