// Modulo operation
export function modulo(x, max) {
  return ((x % max) + max) % max;
}

// Test if number `x` is out of `min` ~ `max` range
export function inRange(x, min, max) {
  return min <= x && x <= max;
}
