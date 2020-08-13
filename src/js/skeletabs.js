/*! Skeletabs | MIT License | Requires jQuery v1 or higher */

import styles from '../scss/skeletabs.scss';

(function (window, document, $, undefined) {
  'use strict';

  // DEFAULT SETTINGS ----------------------------------------------------------------------

  var defaults = {
    animation: null,
    autoplay: false,
    autoplayInterval: 3000,
    classes: {
      container: 'skltbs',
      tabGroup: 'skltbs-tab-group',
      tabItem: 'skltbs-tab-item',
      tab: 'skltbs-tab',
      panelGroup: 'skltbs-panel-group',
      panel: 'skltbs-panel',
      accordionHeading: 'skltbs-panel-heading',
      isActive: 'is-active',
      isDisabled: 'is-disabled',
      isGettingIn: 'is-getting-in',
      isGettingOut: 'is-getting-out',
      hasAnimation: 'has-animation',
    },
    defaultTab: 1,
    disableTab: null,
    equalHeights: false, // force enabled on `animation` request / disabled in accordion layout
    extendedKeyboard: true,
    responsive: {
      breakpoint: 640,
      headingTagName: 'div',
    },
    triggerEvent: 'click',
    updateUrl: true,
  };

  var animationEndEvent =
    'webkitAnimationEnd oanimationend MSAnimationEnd animationend';

  // `Skeletabs` class ----------------------------------------------------------------------

  var Skeletabs =
    Skeletabs ||
    function (container, config) {
      var _ = this;

      // merge default settings and user config
      _.options = {};
      $.extend(_.options, defaults, config);

      _.layout = 0; // 0 as `tabs`, 1 as `accordion`
      _.rotationQueue = undefined; // preventing typeerror

      // if eventType is `hover` or `mouse~` use `mouseenter`, otherwise use `click`
      _.eventType = /^hover$/.test(_.options.triggerEvent)
        ? 'mouseenter focus'
        : 'click focus';

      // map DOM structure
      _._getDomReferences(container);

      // index of the tab which should be activated
      _.currentIndex =
        _._getIndexByHash(window.location.hash) || // if a tab matches URL hash, target that tab
        toZeroBased(_.options.defaultTab); // convert `defaultTab` value to 0-based index

      // prevent jumping on clicking tabs in IE8-
      if (document.documentMode < 9) {
        _.options.updateUrl = false;
        console.info(
          "Skeletabs URL hash update has been disabled due to the browser's spec."
        );
      }

      // set attributes and bind events
      _._setDomAttributes();
      _._initializeEvents();

      // create accordion
      if (_.options.responsive) _._setAccordion();

      // disable tabs
      _.disabledCount = 0;

      if (typeof _.options.disableTab === 'number') {
        _._disableTab(toZeroBased(_.options.disableTab));
      } else if (_.options.disableTab instanceof Array) {
        var i = _.options.disableTab.length;

        while (i--) {
          _._disableTab(toZeroBased(_.options.disableTab[i]));
        }
      }

      // activate the target tab & panel
      _._showTab(_.currentIndex);

      // autoply if requested
      if (_.options.autoplay) _.startRotation();

      // serves as a flag to detect the first load
      _.animation = _.options.animation;
    };

  // PRIVATE METHODS ----------------------------------------------------------------------

  var proto = Skeletabs.prototype;

  /**
   * get DOM references and store them in the global object
   *
   * @param {HTMLElement} container
   */
  proto._getDomReferences = function (container) {
    var _ = this;

    // set DOM references
    _.$container = $(container);

    _.$tabGroup = _.$container.find('.' + _.options.classes.tabGroup);
    _.$tabItems = _.$tabGroup.find('.' + _.options.classes.tabItem);
    _.$tabs = []; // [0] for tabs, [1] for cloned tabs for accordion
    _.$tabs[0] = _.$tabGroup.find('.' + _.options.classes.tab);

    _.$panelGroup = _.$container.find('.' + _.options.classes.panelGroup);
    _.$panels = _.$panelGroup.find('.' + _.options.classes.panel);

    // master list containing additional references
    // - ID references facilitate toggling attributes
    // - disabled state
    // length of the array will also be useful
    _.master = [];

    iterate(_.$panels, function (i, panel) {
      _.master[i] = {};
      // if tabs do not have an id, give an id composed of (panel's Id) + "Tab"
      _.master[i].tabId = _.$tabs[0][i].id || panel.id + 'Tab';
      _.master[i].panelId = panel.id;
      _.master[i].disabled = false;
    });
  };

  /**
   * set up classes & accessibility
   */
  proto._setDomAttributes = function () {
    var _ = this;

    _.$container
      .addClass(_.options.classes.container)
      .attr('aria-live', 'polite');

    _.$tabs[0]
      .attr('tabindex', '0')
      .attr('aria-controls', function () {
        return this.hash.slice(1);
      })
      .attr('aria-selected', 'false')
      .each(function (i, tab) {
        tab.id = _.master[i].tabId;
        tab.setAttribute('data-skeletabs-index', i); // to facilitate navigation
      });

    _.$panels
      .attr('tabindex', '-1')
      .attr('aria-hidden', 'true')
      .each(function (i, panel) {
        panel.setAttribute('aria-labelledby', _.master[i].tabId);
        panel.setAttribute('data-skeletabs-index', i); // to facilitate navigation
      });

    // equalize panel heights if requested
    if (_.options.equalHeights) {
      _._equalHeights();

      $(window).on('resize', function () {
        _._equalHeights();
      });
    }

    // prepare animation if requested
    if (!_.options.animation) {
      _.$panels.css('display', 'none');
    } else if (_.layout === 0) {
      _._prepareAnimation();
    }
  };

  /**
   * Prepare animation
   */
  proto._prepareAnimation = function () {
    var _ = this;

    // do NOT trigger animation on first load
    if (_.animation) {
      _.$container.addClass(_.options.classes.hasAnimation);
    }
    _.$container.addClass(_.options.animation);
    _.$panelGroup.css('position', 'relative');
    _.$panels.css({ position: 'absolute', width: '100%' });

    // flag to control events
    // 2: hide/show transtion is running
    // 1: one of hide/show animation ended
    // 0: both animations ended (default)
    _.animationPhase = 0;
  };

  /**
   * Reset animation setup
   */
  proto._unprepareAnimation = function () {
    var _ = this;

    _.$container.removeClass(
      _.options.classes.hasAnimation + ' ' + _.options.animation
    );

    _.$panelGroup.css({
      position: 'static',
      height: 'auto',
    });

    _.$panels
      .css('position', 'static')
      .removeClass(_.options.classes.isGettingIn);
  };

  /**
   * initialize switch events
   */
  proto._initializeEvents = function () {
    var _ = this;

    // both tabs & accordion headings
    var targetSelector = '.' + _.options.classes.tab;

    var onFocus = function (tab) {
      // stop auto-rotation if running
      if (_.rotationQueue) _.stopRotation();

      // get index from the tab & switch to the matching panel
      _._goTo(getSkeletabsIndex(tab));

      if (_.options.updateUrl) {
        // update history or URL hash
        if (window.history && window.history.replaceState) {
          history.replaceState(null, null, tab.hash);
        } else {
          window.location.hash = tab.hash;
        }
      }
    };

    // click or hover events
    _.$container.on(_.eventType, targetSelector, function (event) {
      event.preventDefault();
      onFocus(event.target);
    });

    if (_.options.extendedKeyboard) {
      _.$container.on('keydown', function (event) {
        if (_._onKeydown(event) === false) {
          event.preventDefault();
        }
      });
    }
  };

  /**
   * generate accordion headings
   */
  proto._setAccordion = function () {
    var _ = this;

    var headingTag = '<' + _.options.responsive.headingTagName + ' />';

    _.$accordionHeadings = [];
    _.$tabs[1] = [];

    // make accordion headings and insert them before each tab
    iterate(_.$tabs[0], function (i, tab) {
      var $tabClone = $(tab).clone().removeAttr('id');
      var $heading = $(headingTag, {
        class: _.options.classes.accordionHeading,
        'aria-hidden': 'true',
      })
        .css('display', 'none') // hide as default
        .append($tabClone)
        .insertBefore(_.$panels.eq(i));

      // save headings and nested tabs reference in the global object
      _.$accordionHeadings[i] = $heading[0];
      _.$tabs[1][i] = $tabClone[0];
    });

    // convert array of nodes to jQuery object form
    _.$accordionHeadings = $(_.$accordionHeadings);
    _.$tabs[1] = $(_.$tabs[1]);

    // change layout by the viewport
    $(window).on('load', function () {
      _._toggleLayout();
    });

    $(window).on('resize', function () {
      _._toggleLayout();
    });
  };

  /**
   * determine the layout by window height
   */
  proto._toggleLayout = function () {
    var _ = this;

    if ($(window).width() > _.options.responsive.breakpoint) {
      _._toTabs();
    } else {
      _._toAccordion();
    }
  };

  /**
   * swap display to accordion view
   */
  proto._toAccordion = function () {
    var _ = this;

    // exit if already accordion
    if (_.layout === 1) return;

    // reset equalized heights
    if (_.options.equalHeights) {
      _.$panelGroup.css('height', '');
      _.$panels.css('height', '');
    }

    _.layout = 1;

    // toggle attributes
    _.$tabGroup.css('display', 'none').attr('aria-hidden', 'true');

    _.$tabItems
      .eq(_.currentIndex)
      .removeClass(_.options.classes.isActive)
      .trigger('blur');

    _.$tabs[0].removeAttr('id');

    _.$tabs[1].each(function (i, accordionTab) {
      accordionTab.id = _.master[i].tabId;
    });

    _.$accordionHeadings
      .css('display', 'block')
      .attr('aria-hidden', 'false')
      .eq(_.currentIndex)
      .addClass(_.options.classes.isActive)
      .trigger('focus');

    if (_.animation) {
      _.$container.removeClass(_.options.classes.hasAnimation);

      _.$panelGroup.css('height', '');

      _.$panels
        .css('position', 'static')
        .not(':eq(' + _.currentIndex + ')')
        .css('display', 'none');
    }
  };

  /**
   * swap display to tabs view
   */
  proto._toTabs = function () {
    var _ = this;

    // continously update height (_totabs method is triggered by resize event)
    if (_.options.equalHeights) {
      _._equalHeights();
    } else if (_.options.animation) {
      _.$panelGroup.css('height', _._getCurrentPanelHeight() + 'px');
    }

    // exit if the layout is "tabs"
    if (_.layout === 0) return;

    _.layout = 0;

    // toggle attributes
    _.$tabGroup.css('display', 'block').attr('aria-hidden', 'false');

    _.$tabItems
      .eq(_.currentIndex)
      .addClass(_.options.classes.isActive)
      .trigger('focus');

    _.$tabs[0].each(function (i, tab) {
      tab.id = _.master[i].tabId;
    });

    _.$tabs[1].removeAttr('id');

    _.$accordionHeadings
      .css('display', 'none')
      .attr('aria-hidden', 'true')
      .eq(_.currentIndex)
      .removeClass(_.options.classes.isActive)
      .trigger('blur');

    if (_.animation) {
      _.$container.addClass(_.options.classes.hasAnimation);

      _.$panels.css({
        display: 'block',
        position: 'absolute',
      });
    }
  };

  /**
   * navigate by keyboard input
   * hotkeys are pre-defined in `keycodes` variable at the top of the script
   *
   * @param {Object} event -- triggered keydown event object
   */
  proto._onKeydown = function (event) {
    var _ = this;
    var pressedKey = event.which || event.keycode;

    // do nothing if there is an ongoing animation
    if (_.animation && _.animationPhase > 0) return false;

    // navigate
    switch (pressedKey) {
      case 35: // end
        var lastIndex = _._getLastIndex();
        _.$tabs[_.layout].eq(lastIndex).trigger('focus');
        break;

      case 36: // home
        var firstIndex = _._getFirstIndex();
        _.$tabs[_.layout].eq(firstIndex).trigger('focus');
        break;

      case 37: // left
        _._moveFocusLeftRight(-1);
        break;

      case 38: // up
        _._moveFocusUpDown(-1, event.target);
        break;

      case 39: // right
        _._moveFocusLeftRight(1);
        break;

      case 40: // down
        _._moveFocusUpDown(1, event.target);
        break;

      default:
        return;
    }

    // prevent default action (normally arrow key moves the scroll)
    return false;
  };

  /**
   * move focus to the previous or next tab
   *
   * @param {Number} modifier -- -1 for left, +1 for right
   */
  proto._moveFocusLeftRight = function (modifier) {
    var _ = this;

    // do nothing in accordion mode
    if (_.layout === 1) return;

    var index = _._getClosestIndex(modifier);

    if (index !== null) {
      _.$tabs[_.layout].eq(index).trigger('focus');
    }
  };

  /**
   * move focus to the previous or next section
   *
   * [Up]
   * tabs mode: panel -> tab
   * accordion mode: panel -> tab -> prev panel -> prev tab...
   *
   * [Down]
   * tabs mode: tab -> panel
   * accordion mode: tab -> panel -> next tab -> next panel...
   *
   * @param {Number} modifier -- -1 for up, +1 for down
   * @param {HTMLelement} activeEl
   */
  proto._moveFocusUpDown = function (modifier, el) {
    var _ = this;
    var isTab = el.className.indexOf(_.options.classes.tab) > -1;

    // focused element is a tab
    if (isTab) {
      // down key pressed
      if (modifier === 1) {
        _.$panels.eq(_.currentIndex).trigger('focus');
      }
    }
    // is a panel && up key pressed
    else if (modifier === -1) {
      _.$tabs[_.layout].eq(_.currentIndex).trigger('focus');
    }
    // is a tab && is in accordion mode
    else if (_.layout === 1) {
      var index = _._getClosestIndex(modifier);

      if (index !== null) {
        _._goTo(index);
        _.$panels.eq(index).trigger('focus');
      }
    }
  };

  /**
   * deactivate the tab of given index and hide the related panel
   *
   * @param {Number} index -- index of the target tab to hide
   */
  proto._hideTab = function (index) {
    var _ = this;

    // if the target is disabled
    if (_.master[index].disabled) return;

    if (_.layout === 0) {
      _.$tabItems.eq(index).removeClass(_.options.classes.isActive);
    } else {
      _.$accordionHeadings.eq(index).removeClass(_.options.classes.isActive);
    }

    _.$tabs[_.layout].eq(index).attr('aria-selected', 'false');

    var $currentPanel = _.$panels.eq(index);

    $currentPanel.attr('tabindex', '-1').attr('aria-hidden', 'true');
    _.$panels.eq(index);

    // animation requested
    if (_.animation) {
      // tabs mode
      if (_.layout === 0) {
        _.animationPhase = 2;

        var activateTransFlag = function () {
          $currentPanel
            .removeClass(
              _.options.classes.isGettingOut + ' ' + _.options.classes.isActive
            )
            .off(animationEndEvent, activateTransFlag);
          _.animationPhase--;
        };

        $currentPanel
          .addClass(_.options.classes.isGettingOut)
          .on(animationEndEvent, activateTransFlag);
      }
      // accordion mode
      else {
        _.animationPhase = 2;

        $currentPanel.slideUp(300, function () {
          $currentPanel.removeClass(_.options.classes.isActive);
          _.animationPhase = 0;
        });
      }
    }
    // animation NOT requested
    else {
      $currentPanel
        .removeClass(_.options.classes.isActive)
        .css('display', 'none');
    }
  };

  /**
   * activate the tab of given index and reveal the related panel
   *
   * @param {Number} index -- index of the target tab to show
   */
  proto._showTab = function (index) {
    var _ = this;

    // if the target is disabled
    if (_.master[index].disabled) return;

    _.currentIndex = index; // update active index

    if (_.layout === 0) {
      _.$tabItems.eq(index).addClass(_.options.classes.isActive);
    } else {
      _.$accordionHeadings.eq(index).addClass(_.options.classes.isActive);
    }

    _.$tabs[_.layout].eq(index).attr('aria-selected', 'true');

    var $currentPanel = _.$panels.eq(index);

    $currentPanel.attr('tabindex', '0').attr('aria-hidden', 'false');

    // animation requested
    if (_.options.animation) {
      // if equalHeights is NOT requested,
      // sync the panel holder's height with the current panel's
      if (!_.options.equalHeights && _.layout === 0) {
        _.$panelGroup.css('height', _._getCurrentPanelHeight() + 'px');
      }

      // NOT first load
      if (_.animation) {
        // tabs mode
        if (_.layout === 0) {
          _.animationPhase = 2;

          var activateTransFlag = function () {
            $currentPanel
              .removeClass(_.options.classes.isGettingIn)
              .addClass(_.options.classes.isActive)
              .off(animationEndEvent, activateTransFlag);
            _.animationPhase--;
          };

          $currentPanel
            .addClass(_.options.classes.isGettingIn)
            .on(animationEndEvent, activateTransFlag);
        }
        // accordion mode
        else {
          _.animationPhase = 2;

          $currentPanel.slideDown(300, function () {
            $currentPanel.addClass(_.options.classes.isActive);
            _.animationPhase = 0;
          });
        }
      }
      // first load
      else {
        _.$container.addClass(_.options.classes.hasAnimation);

        $currentPanel.addClass(_.options.classes.isActive);
      }
    }
    // animation NOT requsted
    else {
      $currentPanel
        .css('display', 'block')
        .addClass(_.options.classes.isActive);
    }

    // trigger callback if declared
    _.$container.trigger('tabswitch');
  };

  /**
   * disable specific tab
   *
   * @param {Number} index -- index of the tab to disable
   */
  proto._disableTab = function (index) {
    var _ = this;

    _.master[index].disabled = true;

    _.$tabItems
      .eq(index)
      .removeClass(_.options.classes.isActive)
      .addClass(_.options.classes.isDisabled);

    _.$tabs[0]
      .eq(index)
      .attr('tabindex', '-1')
      .attr('aria-disabled', 'true')
      .attr('aria-selected', 'false')
      .attr('focusable', 'false');

    _.$tabs[1]
      .eq(index)
      .attr('tabindex', '-1')
      .attr('aria-disabled', 'true')
      .attr('aria-selected', 'false')
      .attr('focusable', 'false');

    _.$accordionHeadings.eq(index).addClass(_.options.classes.isDisabled);

    _.$panels
      .eq(index)
      .removeClass(_.options.classes.isActive)
      .addClass(_.options.classes.isDisabled)
      .attr('tabindex', '-1')
      .attr('aria-hidden', 'true');

    _.disabledCount++;
  };

  /**
   * switch to the panels of given index
   *
   * @param {Number} index -- index of the tab to move to
   */
  proto._goTo = function (index) {
    var _ = this;

    // clicking on the active button won't do anything
    if (_.currentIndex === index) return;

    // disabled tabs either
    if (_.master[index].disabled) return;

    // hide previous active tab
    _._hideTab(_.currentIndex);

    // show next active tab
    _._showTab(index);
  };

  /**
   * set all panels height to the tallest one's
   */
  proto._equalHeights = function () {
    var _ = this;

    if (
      _.options.responsive &&
      $(window).width() < _.options.responsive.breakpoint
    )
      return;

    var maxHeight = 0;
    var initial = {};

    // dynamically read actual heights of every panel
    _.$panels.each(function (i, panel) {
      // save initial state
      initial.display = panel.style.display;
      initial.visibility = panel.style.visibility;

      // instantly show the panel to get hidden panel's height
      panel.style.display = 'block';
      panel.style.height = 'auto';
      panel.style.visibility = 'hidden';

      // get the tallest panel's height
      maxHeight = Math.max(maxHeight, $(panel).outerHeight());

      // and reset the panel to initial state
      panel.style.display = initial.display;
      panel.style.visibility = initial.visibility;
    });

    _.$panelGroup.css('height', maxHeight + 'px');
    _.$panels.css('height', maxHeight + 'px');
  };

  /**
   * get the next or previous available tab's index
   *
   * @param {Number} modifier -- integer 1 or -1 (used in loop)
   * @param {Boolean} startover -- wrap index at the end
   *
   * @returns {Number}
   */
  proto._getClosestIndex = function (modifier, startover) {
    var _ = this;
    var stop = _.currentIndex + modifier;

    // if requested, wrap around the index at the end
    if (startover && stop === _.master.length) {
      stop = 0;
    }

    // if reached the end, return null
    if (!_.master[stop]) {
      return null;
    }
    // if next index is available, return the index
    else if (!_.master[stop].disabled) {
      return stop;
    }

    // otherwise return the nearest not-disabled tab index
    while (0 < stop && stop < _.master.length) {
      stop = stop + modifier;

      if (!_.master[stop].disabled) {
        return stop;
      }
    }
  };

  /**
   * get the first available tab's index
   *
   * @returns {Number}
   */
  proto._getFirstIndex = function () {
    var _ = this;
    var i = 0;

    // pick first not-disabled tab index
    for (; i < _.master.length; i++) {
      if (!_.master[i].disabled) {
        return i;
      }
    }

    return null;
  };

  /**
   * get the last available tab's index
   *
   * @returns {Number}
   */
  proto._getLastIndex = function () {
    var _ = this;
    var i = _.master.length;

    // pick last not-disabled tab index
    while (i--) {
      if (!_.master[i].disabled) {
        return i;
      }
    }

    return null;
  };

  /**
   * seek for a tab matching URL hash
   *
   * @param {String} hash
   *
   * @returns {Number} index of the tab matching URL hash
   */
  proto._getIndexByHash = function (hash) {
    if (!hash) return;

    var _ = this;
    var matchingIndex;

    iterate(_.$tabs[_.layout], function (i, tab) {
      // if a matching tab exists, update current index
      if (tab.hash == hash) {
        matchingIndex = i;
      }
    });

    return matchingIndex;
  };

  /**
   * get the current panel's height
   *
   * @returns {Number}
   */
  proto._getCurrentPanelHeight = function () {
    var _ = this;

    return _.$panels.eq(_.currentIndex).outerHeight();
  };

  // PUBLIC METHODS ----------------------------------------------------------------------

  /**
   * get the active tab element as jQuery object
   *
   * @returns {jQuery object}
   */
  proto.getCurrentTab = function () {
    var _ = this;
    return _.$tabs[_.layout].eq(_.currentIndex);
  };

  /**
   * get the active panel element as jQuery object
   *
   * @returns {jQuery object}
   */
  proto.getCurrentPanel = function () {
    var _ = this;
    return _.$panels.eq(_.currentIndex);
  };

  /**
   * automatically keep moving to the next panel
   */
  proto.startRotation = function () {
    var _ = this;

    // check if there are more than 2 available tabs
    if (_.master.length - _.disableCount < 2) return;

    _.rotationQueue = setInterval(function () {
      _._goTo(_._getClosestIndex(+1, true));
    }, _.options.autoplayInterval);
  };

  /**
   * stop automatically moving
   */
  proto.stopRotation = function () {
    var _ = this;

    clearInterval(_.rotationQueue);
    _.rotationQueue = undefined;
  };

  // UTILITY METHODS ----------------------------------------------------------------------

  /**
   * Loop over an iteratable object
   *
   * @param {Array} arr -- array, iteratable object or HTMLcollection
   * @param {Function} callback -- function to execute on items in the array
   */
  function iterate(arr, callback) {
    var i = 0,
      len = arr.length;

    for (; i < len; i++) {
      callback(i, arr[i]);
    }
  }

  /**
   * Convert 1-based index value to 0-based
   * Used to support syntax like `defaultTab: 1` (first tab) in user config
   *
   * @param {Number} value -- input index
   *
   * @returns {Number} positive integer +1, negative integer remains the same
   */
  function toZeroBased(value) {
    return value >= 0 ? value - 1 : value;
  }

  /**
   * get `data-skeletabs-index` value from the given element
   * and parse to number
   *
   * @param {HTMLelement} el -- element node in question
   *
   * @returns {Number} skeletabs index value
   */
  function getSkeletabsIndex(el) {
    return Number(el.getAttribute('data-skeletabs-index'));
  }

  // jQuery .skeletabs() METHOD ----------------------------------------------------------------------

  $.fn.skeletabs = function () {
    var _ = this;
    var arg = arguments[0];
    var i;
    var length = this.length;
    var ret;

    iterate(_, function (i, obj) {
      // .skeletabs() or .skeletabs(config)
      if (typeof arg === 'object' || !arg) {
        obj.skeletabs = new Skeletabs(obj, arg);
      }
      // .skeletabs("string")
      else if (
        typeof arg === 'string' &&
        obj.skeletabs &&
        arg in obj.skeletabs &&
        arg.indexOf('_') !== 0
      ) {
        ret = obj.skeletabs[arg]();
      }
    });

    return ret || _;
  };
})(window, document, jQuery);
