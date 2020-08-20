// Call jQuery.fn.each backwards on jQuery wrapped elements
export function reverseEach($elements, callback) {
  $elements.pushStack($elements.get().reverse()).each(callback);
}
