// List of expected key inputs
const expectedKeys = {
  // Desktop keyboard
  38: 'up',
  40: 'down',
  37: 'left',
  39: 'right',
  // Home/End
  36: 'home',
  35: 'end',
  // WSAD keys
  87: 'up',
  83: 'down',
  65: 'left',
  68: 'right',
  // Numpad
  104: 'up',
  98: 'down',
  100: 'left',
  102: 'right',
};

// Action map
const actions = {
  horizontal: {
    left: 'prev',
    right: 'next',
  },
  vertical: {
    up: 'prev',
    down: 'next',
  },
  common: {
    home: 'first',
    end: 'last',
  },
};

// Get action name from a KeyboardEvent
function parseKeyAction(event, direction) {
  const keycode = event.which || event.keyCode;
  const key = expectedKeys[keycode];
  if (!key) {
    return null;
  }
  return actions[direction][key] || actions.common[key] || null;
}

export { parseKeyAction };
