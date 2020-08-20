import { call } from './methods';
import { createInstance, register } from '../core/instances';
import { reverseEach } from '../helpers/jquery';

/**
 * jQuery.fn.skeletabs
 *
 * Invoke skeletabs based on the syntax:
 * .skeletabs(string) -> call the public method
 * .skeletabs() or .skeletabs(options) -> create new Skeletabs instance
 *
 * There are 2 reasons why this should be done in reverse order:
 * - To support nested Skeletabs instances.
 *   There are times we need to calculate the final size of a panel (e.g. { panelHeight: 'equal' })
 *   which is possible only after the inner instance completes its initialization.
 * - To return the first value after calling a getter method.
 *   `returnValue` is overwritten in each iteration and returns the last value in the end;
 *   however, it would be more consistent to represent the result from the first match.
 */
export default function skeletabs(firstArg, ...restArgs) {
  let returnValue;

  // [production] Wrap in try catch block so internal `throw` statements
  // do not break the whole script execution
  // [development] Don't try/catch because we need to track down the error source
  // @dev-only try {
  reverseEach(this, function (_, container) {
    // .skeletabs(method) => call(method)
    // .skeletabs() or .skeletabs(options) => new Skeletabs(options)
    if (typeof firstArg === 'string') {
      returnValue = call(firstArg, container, restArgs);
    } else {
      // firstArg -> options, secondArg -> classNames
      const instance = createInstance(container, firstArg, restArgs[0]);
      register(container, instance);
      instance.init();
    }
  });
  // @dev-only } catch (error) {
  // Thrown errors will be logged in the console
  // @dev-only console.error(error.message);
  // @dev-only }

  // Return the initial jQuery object to support chaining
  // unless user wants to get data from an skeletabs instance.
  return returnValue || this;
}
