/*! Skeletabs v{{version}} | MIT License | Requires jQuery v1 or higher */
import globalMethods from './api/globalMethods';
import mainFunction from './api/mainFunction';
import autoInit from './api/autoInit';
import './styles/index.scss';

if (typeof $ === 'undefined') {
  throw new ReferenceError('Skeletabs requires jQuery to be loaded.');
}

// $(element).skeletabs();
$.fn.extend({
  skeletabs: mainFunction,
});

// $.skeletabs.globalMethod();
$.skeletabs = {
  version: '{{version}}',
  ...globalMethods,
};

// Auto init on elements matching given selector on DOM ready
$(function () {
  autoInit();
});
