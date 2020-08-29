import debounce from 'lodash.debounce';
import { includes } from '../helpers/array';
import { findHiddenInTree, showInstantly, hideBack } from '../helpers/dom';
import { modulo, notInRange } from '../helpers/math';
import { capitalize } from '../helpers/string';
import { getClassNames } from './classNames';
import { pushHistory, replaceHistory, getHashFromHistory } from './history';
import { nextId, getTimeId, setIds, unsetIds } from './ids';
import { parseKeyAction } from './keyboard';
import { processOptions } from './options';
import { getViewportWidth } from './viewport';

class Skeletabs {
  constructor(container, userOptions, userClassNames) {
    this.id = getTimeId();
    this.container = container;
    this.options = processOptions(userOptions);
    this.classNames = getClassNames(userClassNames);
    this.disabledList = [];
    this.boundEvents = [];
    this.isInit = false;
    this.rotationId = undefined;
  }

  // Initialize
  init() {
    if (this.isInit) {
      return;
    }
    // Find DOM elements, make up extra necessary elements
    this.prepareElements();
    // Set accessibility DOM attributes
    this.setupAccessibility();
    // Disable items according to user options
    this.disableByOptions();
    // Calculate starting index
    this.defineStartIndex();
    // Update display related stuff (layout, panelHeight)
    this.reload();
    // Add event listeners
    this.addEvents();
    // Show current panel;
    // { passive: true } prevents side effects (like hash change)
    this.show(this.currentIndex, { passive: true });
    // Start rotation (on demand)
    this.options.autoplay && this.play();
    // Add init className to the container
    this.toggleInitState(true);
    // Trigger init event
    this.emit('skeletabs:init');
    // debug
    // console.log(this);
  }

  // Remove all side effects & remove reference to the current instance
  // so it can be garbadge collected. Unsetting should be in reverse order of `init()`.
  destroy() {
    if (!this.isInit) {
      return;
    }
    // Stop stream if any
    this.pause();
    // Remove event listeners
    this.removeEvents();
    // Reset all layout modifications
    this.resetLayout();
    // Reset equalized panel heights
    this.resetPanelHeight();
    // Reset element attributes
    this.resetElementAttributes();
    // Remove init className from the container
    this.toggleInitState();
  }

  // Cache DOM elements and frequently accessed data
  prepareElements() {
    const { container, classNames, options } = this;
    // Use `:first` selector to prevent selecting nested skeletabs
    const $container = $(container);
    const $tabGroup = $container.find(`.${classNames.tabGroup}:first`);
    const $tabItems = $tabGroup.find(`> .${classNames.tabItem}`);
    const $tabs = $tabItems.find(`> .${classNames.tab}`);
    const $panelGroup = $container.find(`.${classNames.panelGroup}:first`);
    // Panels could NOT be direct children of panelGroup
    let $panels = $panelGroup.find(`.${classNames.panel}:first`);
    // (Can't .addBack() or .andSelf() because we are unsure of which ver. of jquery user shall use)
    $panels = $panels.add($panels.siblings(`.${classNames.panel}`));
    // Find elements inside the container using `classNames` data
    this.$container = $container;
    this.$tabGroup = $tabGroup;
    this.$tabItems = $tabItems;
    this.$tabs = $tabs;
    this.$panelGroup = $panelGroup;
    this.$panels = $panels;
    // [error] Number of tabs/panels don't match
    if ($tabs.length !== $panels.length) {
      throw new Error(
        `Number of tabs and panels don't match: ${$container.selector}`
      );
    }
    // hide all elements first
    $panels.css('display', 'none');
    // Cache tab indices inside the element for easier `handleSelect`
    $tabs.each((i, tab) => {
      $(tab).data('skeletabsIndex', i);
    });
    // Number of panels is useful for various calculations
    this.size = $panels.length;
    // Make accordion headings ahead of time (don't insert to DOM yet)
    if (options.breakpoint) {
      this.$panelHeadings = $tabs.map(() => {
        const div = document.createElement('div');
        div.className = classNames.panelHeading;
        return div;
      });
    }
  }

  // Add a new set of tab/panel
  add({ tab, panel }) {
    const { $tabGroup, $panelGroup, classNames, size } = this;
    // Pause existing stream for security
    this.pause();
    // Generate new ids
    const tabId = nextId({ type: 'tab', prefix: 'skeletabsTab' });
    const panelId = nextId({ type: 'panel', prefix: 'skeletabsPanel' });
    // Create elements
    const $tabItem = $('<li />', {
      class: classNames.tabItem,
      role: 'presentation',
    });
    const $tab = $('<button />', {
      class: classNames.tab,
      id: tabId,
      'aria-controls': panelId,
      'aria-selected': false,
      role: 'tab',
      tabindex: -1,
    })
      .html(tab)
      .data('skeletabsIndex', size);
    const $panel = $(`<div />`, {
      class: classNames.panel,
      id: panelId,
      'aria-labelledby': tabId,
      role: 'tabpanel',
      tabindex: 0,
    })
      .html(panel)
      .css('display', 'none');
    const $panelHeading = $('<div />', {
      class: classNames.panelHeading,
    });
    // Insert elements
    $tabItem.append($tab);
    $tabGroup.append($tabItem);
    $panelGroup.append($panel);
    // Update cache data
    this.$tabItems = this.$tabItems.add($tabItem);
    this.$tabs = this.$tabs.add($tab);
    this.$panels = this.$panels.add($panel);
    this.$panelHeadings = this.$panelHeadings.add($panelHeading);
    this.tabIds.push(tabId);
    this.panelIds.push(panelId);
    this.size += 1;
    // Rearrange disabled index
    this.disabledList.forEach(disabledIndex =>
      this.undisable(disabledIndex, {})
    );
    this.disableByOptions();
    // If there was no item, activate this new one
    if (size === 0) {
      this.show(0);
    }
    // Reload layout if panelHeight has special value
    if (this.options.panelHeight !== 'auto') {
      this.reload();
    }
    // Resume stream
    this.resume();
  }

  // Remove the set of tab/panel matching passed index
  remove(index) {
    const { $tabItems, $panels, $tabs, currentIndex, size } = this;
    // Skip if no item left
    if (size === 0) {
      return;
    }
    const targetIndex = modulo(index, size);
    const filterOut = (_, i) => i !== targetIndex;
    const jQueryFilterOut = function (i) {
      return i !== targetIndex;
    };
    // Pause stream if any
    this.pause();
    // Remove elements from DOM
    $tabItems.eq(targetIndex).remove();
    $panels.eq(targetIndex).remove();
    // Update cache data
    this.$tabItems = this.$tabItems.filter(jQueryFilterOut);
    this.$tabs = this.$tabs.filter(jQueryFilterOut);
    this.$panels = this.$panels.filter(jQueryFilterOut);
    this.$panelHeadings = this.$panelHeadings.filter(jQueryFilterOut);
    this.tabIds = this.tabIds.filter(filterOut);
    this.panelIds = this.panelIds.filter(filterOut);
    this.size -= 1;
    $tabs.each((i, tab) => {
      $(tab).data('skeletabsIndex', i);
    });
    // Rearrange disabled index
    this.disabledList.forEach(disabledIndex => this.undisable(disabledIndex));
    this.disableByOptions();
    // If we removed currently active item, find previous available one and activate it
    if (size > 1 && targetIndex === currentIndex) {
      const nextIndex = this.getNextIndex({ currentIndex, step: -1 });
      this.show(nextIndex);
    }
    // Reload layout if panelHeight has special value
    if (this.options.panelHeight !== 'auto') {
      this.reload();
    }
    // Resume stream
    this.resume();
  }

  // Modify DOM elements to comply with accessibility standards
  // @see: https://www.w3.org/TR/wai-aria-practices-1.1/examples/tabs/tabs-1/tabs.html
  setupAccessibility() {
    const { $tabGroup, $tabItems, $tabs, $panels } = this;
    const tabIds = setIds($tabs, { type: 'tab', prefix: 'skeletabsTab' });
    const panelIds = setIds($panels, {
      type: 'panel',
      prefix: 'skeletabsPanel',
    });
    // Add accessibilty attributes
    $tabGroup.attr('role', 'tablist');
    $tabItems.attr('role', 'presentation');
    $tabs
      .attr({
        'aria-selected': false,
        role: 'tab',
        tabindex: -1,
      })
      .attr('aria-controls', i => panelIds[i]);
    $panels
      .attr({
        role: 'tabpanel',
        tabindex: 0,
      })
      .attr('aria-labelledby', i => tabIds[i]);
    // leave references
    this.tabIds = tabIds;
    this.panelIds = panelIds;
  }

  // Reset added attributes from DOM elements
  resetElementAttributes() {
    const {
      $container,
      $tabGroup,
      $tabItems,
      $tabs,
      $panels,
      classNames,
    } = this;
    // Clean up generated ids
    unsetIds($tabs);
    unsetIds($panels);
    // Reset accessibilty attributes / disabled state
    const stateFlags = [
      'active',
      'disabled',
      'enter',
      'enterActive',
      'enterDone',
      'leave',
      'leaveActive',
      'leaveDone',
    ]
      .map(key => classNames[key])
      .join(' ');
    $container.removeClass(
      `${classNames.tabsMode} ${classNames.accordionMode}`
    );
    $tabGroup.removeAttr('role');
    $tabItems
      .removeClass(`${classNames.active} ${classNames.disabled}`)
      .removeAttr('role');
    $tabs
      .removeClass(`${classNames.active} ${classNames.disabled}`)
      .removeAttr(
        'aria-controls aria-disabled disabled aria-selected role tabindex'
      );
    $panels
      .removeClass(stateFlags)
      .removeAttr('aria-hidden aria-labelledby role tabindex');
    // Remove jQuery data
    $tabs.removeData('skeletabsIndex');
  }

  // Add event listeners
  addEvents() {
    const { $container, $panelGroup, options, classNames } = this;
    const $window = $(window);
    // Fix context in event handlers
    const pause = this.pause.bind(this);
    const resume = this.resume.bind(this);
    const handleKeydown = this.handleKeydown.bind(this);
    const handlePopState = this.handlePopState.bind(this);
    const handleSelect = this.handleSelect.bind(this);
    const reload = options.resizeTimeout
      ? debounce(this.reload.bind(this), options.resizeTimeout)
      : this.reload.bind(this);
    // Toggle panels on tab select
    // Pause rotation while focused
    this.addSingleEvent({
      $target: $container,
      delegate: `.${classNames.tab}`,
      name: options.selectEvent === 'hover' ? 'mouseenter' : 'click',
      handler: handleSelect,
    });
    // Enable keyboard navigation
    this.addSingleEvent({
      $target: $container,
      name: 'keydown',
      handler: handleKeydown,
      test: !!options.keyboard,
    });
    // Pause autoplaying while focus/hover
    this.addSingleEvent({
      $target: $container,
      name: 'focusin',
      handler: pause,
      test: !!options.pauseOnFocus,
    });
    this.addSingleEvent({
      $target: $container,
      name: 'focusout',
      handler: resume,
      test: !!options.pauseOnFocus,
    });
    this.addSingleEvent({
      $target: $container,
      name: 'mouseenter',
      handler: pause,
      test: !!options.pauseOnHover,
    });
    this.addSingleEvent({
      $target: $container,
      name: 'mouseout',
      handler: resume,
      test: !!options.pauseOnHover,
    });
    // [Fix] listen to height change of possible nested instances (use event bubbling)
    this.addSingleEvent({
      $target: $panelGroup,
      name: 'skeletabs:moved',
      handler: reload,
      test: options.panelHeight !== 'auto',
    });
    // Update on viewport size change
    this.addSingleEvent({
      $target: $window,
      name: 'resize orientationchange',
      handler: reload,
    });
    // Watch history change from user interactions (e.g. back button)
    this.addSingleEvent({
      $target: $window,
      name: 'popstate',
      handler: handlePopState,
      test: options.history === 'push',
    });
  }

  // Bind a single event handler.
  addSingleEvent({ $target, delegate, name, handler, test }) {
    if (test === false) {
      return;
    }
    if (delegate) {
      $target.on(name, delegate, handler);
    } else {
      $target.on(name, handler);
    }
    this.boundEvents.push({ $target, name, handler });
  }

  // Remove event listeners
  removeEvents() {
    // Make use of previously cached event handler data
    this.boundEvents.forEach(({ $target, name, handler }) => {
      $target.off(name, handler);
    });
    // No need to clear `boundEvents` because the instance will garbadge collected soon
  }

  // Disable panel by `index`
  disable(index) {
    const { classNames } = this;
    // Skip if already disabled
    if (includes(this.disabledList, index)) {
      return;
    }
    // Add to disabled list
    this.disabledList.push(index);
    // Modify element attributes
    this.$tabItems.eq(index).addClass(classNames.disabled);
    this.$tabs.eq(index).addClass(classNames.disabled).attr({
      'aria-disabled': true,
      disabled: true,
      tabindex: -1,
    });
    this.$panels.eq(index).addClass(classNames.disabled).attr({
      'aria-hidden': true,
      tabindex: -1,
    });
  }

  // Reset disabled state of tab and panel matching passed index
  undisable(index) {
    const { classNames } = this;
    // Add to disabled list
    this.disabledList = this.disabledList.filter(x => x !== index);
    // Modify element attributes
    this.$tabItems.eq(index).removeClass(classNames.disabled);
    this.$tabs.eq(index).removeClass(classNames.disabled).attr({
      'aria-disabled': '',
      disabled: '',
      // tabindex: 0, // assume that previously disabled tab wasn't an active tab
    });
    this.$panels.eq(index).removeClass(classNames.disabled).attr({
      'aria-hidden': '',
      tabindex: 0,
    });
  }

  // Disable items using `disabledIndex` option.
  disableByOptions() {
    if (this.options.disabledIndex === null) {
      return;
    }
    // translate negative indices and run disable() on them
    []
      .concat(this.options.disabledIndex)
      .map(x => modulo(x, this.size))
      .forEach(this.disable.bind(this));
  }

  // Figure out starting index
  defineStartIndex() {
    const { size, options } = this;
    let startIndex;
    // If URL contains a hash, try to find matching panel's index
    if (window.location.hash) {
      startIndex = this.getIndexByHash(window.location.hash);
    }
    // If still not found, use `startIndex` option
    if (typeof startIndex !== 'number') {
      // Parse any negative/out-range index
      startIndex = modulo(options.startIndex, size);
      // If startIndex is disabled, find next available index
      if (includes(this.disabledList, startIndex)) {
        startIndex = this.getNextIndex({ currentIndex: startIndex });
        console.warn(
          `startIndex has been moved to ${startIndex} due to conflict with disabledIndex.`
        );
      }
    }
    // startIndex is used as fallback to the last state of history.back()
    // @see: https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate#The_popstate_event
    this.startIndex = startIndex;
    // Assign it as currentIndex
    this.currentIndex = startIndex;
  }

  // Hide panel
  hide(index) {
    // Skip if disabled index
    if (includes(this.disabledList, index)) {
      return;
    }
    const { $tabItems, $tabs, $panels, options, classNames } = this;
    const $currentTabItem = $tabItems.eq(index);
    const $currentTab = $tabs.eq(index);
    const $currentPanel = $panels.eq(index);
    // Start updating element properties
    $currentTabItem.removeClass(classNames.active);
    $currentTab
      .removeClass(classNames.active)
      .attr({ 'aria-selected': false, tabindex: -1 });
    $currentPanel.removeClass(classNames.active);
    // [Accordion] use jQuery methods to hide the panel
    if (this.currentLayout === 'accordion' && options.slidingAccordion) {
      $currentPanel.slideUp(options.transitionDuration);
    } else {
      // .width() causes reflow & forces CSS transition to fire on next tick
      $currentPanel.css('display', 'none').addClass(classNames.leave).width();
      $currentPanel.addClass(classNames.leaveActive);
      // `leave leaveActive` -> `leaveDone`
      setTimeout(() => {
        $currentPanel
          .addClass(classNames.leaveDone)
          .removeClass(`${classNames.leave} ${classNames.leaveActive}`);
      }, options.transitionDuration);
    }
  }

  // Show panel
  // `passive` option is used to prevent side effects during init() process
  show(index, { focus, passive, updateHistory } = {}) {
    // Skip if disabled index
    if (includes(this.disabledList, index)) {
      return;
    }
    const {
      $tabItems,
      $tabs,
      $panelGroup,
      $panels,
      classNames,
      options,
    } = this;
    const previousIndex = this.currentIndex;
    const $currentTabItem = $tabItems.eq(index);
    const $currentTab = $tabs.eq(index);
    const $currentPanel = $panels.eq(index);
    const emitMovedEvent = () => {
      this.emit('skeletabs:moved', {
        previousIndex,
        $previousPanel: $panels.eq(previousIndex),
        $previousTab: $tabs.eq(previousIndex),
      });
    };
    // Update current index
    this.currentIndex = index;
    this.focusedIndex = index;
    // Start updating element properties
    $currentTabItem.addClass(classNames.active);
    $currentTab
      .addClass(classNames.active)
      .attr({ 'aria-selected': true, tabindex: 0 });
    $currentPanel.addClass(classNames.active);
    // Prevent side effect on passive calls (used in `init`)
    if (passive) {
      $currentPanel.css('display', 'block');
      return;
    }
    // Move focus to active tab (used in `handleKeydown`)
    focus && $currentTab.focus();
    // Show panel
    if (this.currentLayout === 'accordion' && options.slidingAccordion) {
      $currentPanel.slideDown({ complete: emitMovedEvent });
    } else {
      $currentPanel.css('display', 'block').addClass(classNames.enter);
      // .height() causes reflow;
      const currentPanelHeight = $currentPanel.outerHeight();
      if (options.panelHeight === 'adaptive') {
        $panelGroup.height(currentPanelHeight);
      }
      // fire CSS transition on next tick
      $currentPanel.addClass(classNames.enterActive);
      // `enter enterActive` -> `enterDone`
      setTimeout(() => {
        $currentPanel
          .addClass(classNames.enterDone)
          .removeClass(`${classNames.enter} ${classNames.enterActive}`);
        // Fire changed event when transition is complete
        emitMovedEvent();
      }, options.transitionDuration);
    }
    // Update history
    if (options.history && updateHistory && !this.isPlaying()) {
      const currentHash = `#${this.panelIds[index]}`;
      if (options.history === 'push') {
        pushHistory(currentHash);
      } else {
        replaceHistory(currentHash);
      }
    }
  }

  // Navigate to panel of passed index
  goTo(index, { focus, updateHistory = true } = {}) {
    // No index provided
    if (index === null || index === undefined) {
      return;
    }
    const { $panels, $tabs, classNames } = this;
    const previousIndex = this.currentIndex;
    const nextIndex = modulo(index, this.size);
    // Skip if the index matches previous index, or is a disabled index
    if (nextIndex === previousIndex || includes(this.disabledList, nextIndex)) {
      return;
    }
    // Fire change event
    this.emit('skeletabs:move', {
      currentIndex: previousIndex,
      $currentPanel: $panels.eq(previousIndex),
      $currentTab: $tabs.eq(previousIndex),
      nextIndex,
      $nextPanel: $panels.eq(nextIndex),
      $nextTab: $tabs.eq(nextIndex),
    });
    // Reset previous transition flags
    const transitionFlags = [
      'enter',
      'enterActive',
      'enterDone',
      'leave',
      'leaveActive',
      'leaveDone',
    ]
      .map(key => classNames[key])
      .join(' ');
    $panels.removeClass(transitionFlags);
    // Hide previous active panel
    this.hide(previousIndex);
    // Show next active panel
    this.show(nextIndex, { focus, updateHistory });
  }

  // Navigate by step
  go(step, { loop, focus, updateHistory = true } = {}) {
    if (!step) {
      return;
    }
    const nextIndex = this.getNextIndex({ step, loop });
    // If there is an available next panel, move to that index
    nextIndex !== null && this.goTo(nextIndex, { focus, updateHistory });
  }

  // Move focus from a tab to another
  moveFocusTo(index) {
    const nextIndex = modulo(index, this.size);
    const previousIndex = this.focusedIndex;
    // Skip if the index matches previous index, or is a disabled index
    if (previousIndex === nextIndex || includes(this.disabledList, nextIndex)) {
      return;
    }
    // Move focus to next tab & set previous tab unfocasable
    this.$tabs
      .eq(nextIndex)
      .attr('tabindex', 0)
      .focus()
      .end()
      .eq(previousIndex)
      .attr('tabindex', -1);
    // Update `focusedIndex`
    this.focusedIndex = nextIndex;
  }

  moveFocus(step, { loop } = {}) {
    if (!step) {
      return;
    }
    const nextIndex = this.getNextIndex({
      currentIndex: this.focusedIndex,
      step,
      loop,
    });
    // If there is an available next panel, move focus to that index
    nextIndex !== null && this.moveFocusTo(nextIndex);
  }

  reload() {
    // Decide which layout to display
    this.toggleLayout();
    // Adjust panel heights (on demand)
    if (this.currentLayout === 'accordion') {
      this.resetPanelHeight();
    } else if (this.options.panelHeight === 'equal') {
      this.equalizePanelHeight();
    } else if (this.options.panelHeight === 'adaptive') {
      this.adaptPanelHeight();
    }
  }

  // Change layout to tabs
  transformToTabs() {
    if (this.currentLayout === 'tabs') {
      return;
    }
    const { classNames, options } = this;
    const previousLayout = this.currentLayout;
    // Update layout flag
    this.currentLayout = 'tabs';
    // Set layout className to the container
    this.$container
      .addClass(classNames.tabsMode)
      .removeClass(classNames.accordionMode);
    // Put tab elements back to initial position,
    // (only if we are moving from accordion to tabs)
    if (previousLayout === 'accordion') {
      const { $panelGroup, $tabItems } = this;
      this.$tabGroup.insertBefore($panelGroup);
      this.$tabs.each((i, tab) => {
        $tabItems.eq(i).append($(tab).detach());
      });
      this.$panelHeadings.detach();
    }
    // Give transition effect to ones with adaptive panel height
    if (options.panelHeight === 'adaptive') {
      this.$panelGroup.css(
        'transition',
        `height ${options.transitionDuration}ms ease 0s`
      );
    }
    // Fire layoutchange event
    this.emit('skeletabs:layoutchange');
  }

  // Change layout to accordion
  transformToAccordion() {
    if (this.currentLayout === 'accordion') {
      return;
    }
    const { $tabs, $panels, classNames } = this;
    // Update layout flag
    this.currentLayout = 'accordion';
    // Set layout className to the container
    this.$container
      .addClass(classNames.accordionMode)
      .removeClass(classNames.tabsMode);
    // Extract tabs and insert them in between panels (accordion layout)
    this.$panelHeadings.each((i, heading) => {
      const $tab = $tabs.eq(i);
      const $panel = $panels.eq(i);
      $(heading).append($tab.detach()).insertBefore($panel);
    });
    // Give transition effect to ones with adaptive panel height
    if (this.options.panelHeight === 'adaptive') {
      this.$panelGroup.css('transition', '');
    }
    this.$tabGroup.detach();
    // Fire layoutchange event
    this.emit('skeletabs:layoutchange');
  }

  // Decide which layout to display
  toggleLayout() {
    if (this.options.breakpoint) {
      // [responsive] Choose layout between tabs and accordion
      if (getViewportWidth() <= this.options.breakpoint) {
        this.transformToAccordion();
      } else {
        this.transformToTabs();
      }
    } else {
      // [non-responsive] Stick to tabs layout
      this.transformToTabs();
    }
  }

  // Reset all layout modifications
  resetLayout() {
    const { currentLayout, classNames } = this;

    // Reset DOM modification from accordion layout
    if (currentLayout === 'accordion') {
      // Put the tab elements back to initial position
      const { $panelGroup, $tabItems } = this;
      this.$tabGroup.insertBefore($panelGroup);
      this.$tabs.detach().each((i, tab) => {
        $tabItems.eq(i).append(tab);
      });
      // Panel headings should be removed
      this.$panelHeadings.remove();
      this.$panels.css('display', '');
    }
    // Remove layout related classNames from the container
    this.$container.removeClass(
      `${classNames.tabsMode} ${classNames.accordionMode}`
    );
    // Reset current layout data
    this.currentLayout = undefined;
  }

  // Set the current panel's height
  adaptPanelHeight() {
    const { currentIndex } = this;
    const $currentPanel = this.$panels.eq(currentIndex);
    const hiddenAncestor = findHiddenInTree(this.container);

    if (hiddenAncestor) {
      showInstantly(hiddenAncestor);
    }
    this.$panelGroup.css('height', `${$currentPanel.outerHeight()}px`);
    if (hiddenAncestor) {
      hideBack(hiddenAncestor);
    }
  }

  // Make all panels have the same height as the tallest one
  equalizePanelHeight() {
    const { disabledList } = this;
    const hiddenAncestor = findHiddenInTree(this.container);
    let maxHeight = 0;

    if (hiddenAncestor) {
      showInstantly(hiddenAncestor);
    }
    this.$panels
      .each(function (index, panel) {
        // Skip disabled indice
        if (includes(disabledList, index)) {
          return;
        }
        // Instantly show the panel to get hidden panel's height
        showInstantly(panel);
        // Find the tallest panel's height
        maxHeight = Math.max(maxHeight, $(panel).height());
        // Reset the panels style to the initial state
        hideBack(panel);
      })
      .height(maxHeight);
    if (hiddenAncestor) {
      hideBack(hiddenAncestor);
    }
  }

  // Reset modified heights
  resetPanelHeight() {
    this.$panelGroup.css({ height: '', transition: '' });
    this.$panels.css('height', '');
  }

  // Start streaming
  play() {
    if (this.isPlaying()) {
      return;
    }
    this.rotationId = setInterval(() => {
      this.go(1, { loop: true, updateHistory: false });
    }, this.options.autoplayInterval);
  }

  // Stop streaming
  pause() {
    if (!this.isPlaying()) {
      return;
    }
    this.rotationId = clearInterval(this.rotationId);
  }

  // Restart paused stream
  resume() {
    if (this.options.autoplay) {
      this.play();
    }
  }

  // Test if current instance is auto-playing
  isPlaying() {
    return typeof this.rotationId !== 'undefined';
  }

  // Add/remove CSS class to the container to reflect init state
  toggleInitState(isInit) {
    const { classNames } = this;
    this.isInit = isInit;
    this.$container.toggleClass(classNames.init, isInit);
  }

  // Trigger custom jQuery event with core info about the instance
  emit(eventName, parameters) {
    const currentInfo = this.getCurrentInfo();
    this.$container.trigger(eventName, $.extend(currentInfo, parameters));
  }

  // Get next available index in `step` direction
  // [0, <current>, <disabled>, 3, 4], step(1) => 3
  // [<current>, 1, 2, 3], step(-1), loop => 3
  getNextIndex({ currentIndex = this.currentIndex, step = 1, loop = false }) {
    const { size, disabledList } = this;
    let nextIndex = currentIndex;

    do {
      nextIndex += step;
      if (loop) {
        nextIndex = modulo(nextIndex, size);
      }
    } while (includes(disabledList, nextIndex));

    if (!loop && notInRange(nextIndex, 0, size - 1)) {
      return null;
    }

    return nextIndex;
  }

  // Get the first panel's index which is not disabled, return null if nothing found
  getFirstIndex() {
    const { size, disabledList } = this;
    let index = 0;
    while (includes(disabledList, index)) {
      index += 1;
    }
    return index > size - 1 ? null : index;
  }

  // Get the last panel's index which is not disabled, return null if nothing found
  getLastIndex() {
    const { size, disabledList } = this;
    let index = size - 1;
    while (includes(disabledList, index)) {
      index -= 1;
    }
    return index < 0 ? null : index;
  }

  // Get the index of a panel that has an id matching passed `hash`, return null if nothing found
  getIndexByHash(hash) {
    if (!hash) {
      return null;
    }
    const match = this.panelIds.indexOf(hash.slice(1));
    return match !== -1 ? match : null;
  }

  // Get most useful data from the current instance.
  // Used as custom event parameters.
  getCurrentInfo() {
    const {
      $container,
      $panels,
      $tabs,
      currentIndex,
      currentLayout,
      size,
    } = this;
    return {
      $container,
      $panels,
      $tabs,
      $currentPanel: $panels.eq(currentIndex),
      $currentTab: $tabs.eq(currentIndex),
      currentIndex,
      currentLayout,
      size,
    };
  }

  // Redirect
  handlePopState(event) {
    const targetHash = getHashFromHistory(event);
    const targetIndex = targetHash
      ? this.getIndexByHash(targetHash)
      : this.startIndex;
    // Move to that index (while preventing duplicate history from being created)
    this.goTo(targetIndex, { updateHistory: false });
  }

  // Handler for `keydown` event
  handleKeydown(event) {
    // Figure out which action to take from the KeyboardEvent and `keyboard` option
    const direction = this.options[`keyboard${capitalize(this.currentLayout)}`];
    const action = parseKeyAction(event, direction);
    const autoselect = this.options.keyboard === 'select';

    switch (action) {
      case 'prev':
        this[autoselect ? 'go' : 'moveFocus'](-1, { focus: true });
        break;

      case 'next':
        this[autoselect ? 'go' : 'moveFocus'](1, { focus: true });
        break;

      case 'first':
        this[autoselect ? 'goTo' : 'moveFocusTo'](this.getFirstIndex(), {
          focus: true,
        });
        break;

      case 'last':
        this[autoselect ? 'goTo' : 'moveFocusTo'](this.getLastIndex(), {
          focus: true,
        });
        break;

      default:
        return;
    }

    // Don't move scroll
    event.preventDefault();
    // Don't mess with nested skeletabs
    event.stopPropagation();
  }

  // Handler for selecting a tab
  handleSelect(event) {
    // Find selected index and go to matching panel
    const selectedIndex = $(event.currentTarget).data('skeletabsIndex');
    this.goTo(selectedIndex);
    // Prevent default action
    event.preventDefault();
    event.stopPropagation();
  }
}

export default Skeletabs;
