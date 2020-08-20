// Modulo operation
export function modulo(x, max) {
  return ((x % max) + max) % max;
}

// Test if number `x` is out of `min` ~ `max` range
export function notInRange(x, min, max) {
  return x < min || max < x;
}
