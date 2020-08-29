// Make string start with an uppercase letter and the rest be lowercase
export function capitalize(string) {
  return string[0].toUpperCase() + string.slice(1).toLowerCase();
}
