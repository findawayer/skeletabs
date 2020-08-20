import Skeletabs from './Skeletabs';

const registered = {};

// Test if passed element has created a Skeletabs instance
function hasInstance(container) {
  return typeof container.skeletabsId !== 'undefined';
}

// Create Skeletabs instance
function createInstance(container, options, classNames) {
  if (hasInstance(container)) {
    throw new Error('Skeletabs has already been initialized.');
  }
  return new Skeletabs(container, options, classNames);
}

// Get Skeletabs instance using the reference stored inside the `container`.
function getInstance(container) {
  const id = container.skeletabsId;
  return id ? registered[id] || null : null;
}

// Create reference to the `instance` and store it inside the `element`.
// This allows us to retrieve the instance later, while keeping it private from the client.
function register(container, instance) {
  registered[instance.id] = instance;
  container.skeletabsId = instance.id;
}

// Remove references to the instance
function unregister(instance) {
  const { id, container } = instance;
  if (id in registered) {
    delete container.skeletabsId;
    delete registered[id];
  }
}

export { createInstance, getInstance, hasInstance, register, unregister };
