import { createInstance, register } from '../core/instances';
import { reverseEach } from '../helpers/jquery';

export default function autoInit() {
  const $containers = $('[data-skeletabs]');
  reverseEach($containers, function (_, container) {
    // Get user options from `data-skeletabs` attribute
    const $container = $(container);
    const options = $container.data('skeletabs');
    const classNames = $container.data('skeletabs-class');
    // Create new Skeletabs instance
    const instance = createInstance(container, options, classNames);
    // Store reference to the instance
    register(container, instance);
    // Initialize
    instance.init();
  });
}
