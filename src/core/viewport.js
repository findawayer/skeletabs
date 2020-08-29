// Cached viewport size
let viewportWidth;

// Update viewport width
function updateViewportWidth() {
  viewportWidth = $(window).width();
}

// Keep tracking viewport size changes.
// (Doesn't seem to need `debounce` because the callback function is not costly.)
function watchViewportWidth() {
  $(window).on('resize orientationchange', updateViewportWidth);
}

// Get viewport width
function getViewportWidth() {
  // Lazy watch viewport when first Skeletabs instance is created
  if (typeof viewportWidth === 'undefined') {
    updateViewportWidth();
    watchViewportWidth();
  }
  return viewportWidth;
}

export { getViewportWidth, watchViewportWidth };
