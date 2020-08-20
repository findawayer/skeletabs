import { getInstance, unregister } from '../core/instances';

// List of supported queries inside .skeletabs() calls
// (The context is the skeletabs instance matching passed container element)
const api = {
  destroy() {
    this.destroy();
    unregister(this);
  },
  reload() {
    this.reload();
  },
  goTo(query) {
    switch (typeof query) {
      case 'number':
        this.goTo(query, { updateHistory: true });
        break;

      case 'string':
        if (query[0] === '#') {
          this.goTo(this.getIndexByHash(query), { updateHistory: false });
        }
        break;

      default:
        throw Error(`Invalid parameter: ${JSON.stringify(query)}`);
    }
  },
  next() {
    this.go(1, { updateHistory: true });
  },
  prev() {
    this.go(-1, { updateHistory: true });
  },
  play() {
    this.play();
  },
  pause() {
    this.pause();
  },
  add(data) {
    this.add(data);
  },
  remove(index) {
    this.remove(index);
  },
  getCurrentInfo() {
    return this.getCurrentInfo();
  },
};

// Process user queries and execute relevant method
function call(command, container, params) {
  const instance = getInstance(container);
  // Method doesn't exist
  if (!Object.prototype.hasOwnProperty.call(api, command)) {
    throw new Error(`Invalid method name: ${command}`);
  }
  // Skeletabs has not been initialized
  if (!instance) {
    throw new Error(
      `Skeletabs is not initialized on element: ${
        container.id ? `#${container.id}` : container.className
      }`
    );
  }
  return api[command].apply(instance, params);
}

export { call };
export default api;
