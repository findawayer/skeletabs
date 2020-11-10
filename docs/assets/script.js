(function ($, history, location) {
  // navigation
  $('#page')
    .on('skeletabs:moved', function (_, info) {
      // reload all skeletabs on section change
      if (info.$container.is('#page')) {
        $('#page').find('.skltbs-init').skeletabs('reload');
      }
    })
    .skeletabs(
      {
        breakpoint: 800,
        breakpointLayout: 'none',
        history: 'push',
        keyboardTabs: 'vertical',
        transitionDuration: 300
      },
      {
        tabGroup: 'nav-group',
        tabItem: 'nav-item',
        tab: 'nav-link',
        panelGroup: 'content',
        panel: 'section',
        init: 'page-init',
        tabsMode: 'page-tabs',
        accordionMode: 'page-accordion'
      }
    );

  // internal links: move to the section
  $(document).on('click', 'a[href^="#"]', function (event) {
    var hash = $(this).attr('href');
    pushState(hash);
    $('#page').skeletabs('goTo', hash);
    event.preventDefault();
  });

  // dropdown
  (function () {
    var expectedKeys = {
      // Desktop keyboard
      13: 'enter',
      38: 'up',
      40: 'down',
      // Home/End
      36: 'home',
      35: 'end',
      // WSAD keys
      87: 'up',
      83: 'down'
    };
    var cache = {};

    $(document).on('click', '.has-dropdown', function (event) {
      event.preventDefault();
      // console.log('click', this);
      cache.$trigger = $(this);
      cache.$dropdown = cache.$trigger.next('.dropdown');
      cache.$options = cache.$dropdown.find('[role="option"]');
      cache.selectedIndex = cache.$options.index(
        cache.$options.filter('[aria-selected="true"]')
      );
      this.blur(); // prevent duplicate call on enter
      if (cache.$trigger.attr('aria-expanded')) {
        close();
      } else {
        open();
      }
    });

    function close() {
      if (!cache.$trigger) {
        return;
      }
      console.log('close');
      cache.$trigger.removeAttr('aria-expanded');
      cache.$dropdown
        .removeClass('dropdown-expanded')
        .off('click', '[role="option"]', handleOptionClick);
      $(document).off('click', handleBlur).off('keydown', handleKeydown);
      // flush
      cache = {};
    }

    function open() {
      if (!cache.$trigger) {
        return;
      }
      console.log('open');
      cache.$trigger.attr('aria-expanded', 'true');
      cache.$dropdown
        .addClass('dropdown-expanded')
        .on('click', '[role="option"]', handleOptionClick);
      $(document).on('click', handleBlur).on('keydown', handleKeydown);
    }

    function select(index) {
      var $selectedOption;
      if (!cache.$options) {
        return;
      }
      if (index < 0 || cache.$options.length <= index) {
        return;
      }
      $selectedOption = cache.$options.eq(index);
      cache.$options.removeAttr('aria-selected');
      cache.$dropdown.attr('aria-activedescendant', $selectedOption.attr('id'));
      cache.$trigger.find('.button-text').text($selectedOption.text());
      $selectedOption.attr('aria-selected', 'true');
      cache.selectedIndex = index;
    }

    function selectBy(step) {
      if (!cache.$options) {
        return;
      }
      select(cache.selectedIndex + step);
    }

    function handleBlur(event) {
      var exception;
      if (!cache.$trigger) {
        return;
      }
      exception = cache.$trigger.parent().get(0);
      if (event.target === exception || exception.contains(event.target)) {
        return;
      }
      close();
    }

    function handleKeydown(event) {
      var keycode = event.which || event.keyCode;
      var key = expectedKeys[keycode];
      if (!key) {
        return;
      }
      switch (key) {
        case 'up':
          selectBy(-1);
          break;
        case 'down':
          selectBy(1);
          break;
        case 'home':
          select(0);
          break;
        case 'end':
          select(cache.$options.length - 1);
          break;
        case 'enter':
          cache.$options.eq(cache.selectedIndex).trigger('click');
          break;
        default:
          break;
      }
    }

    function handleOptionClick() {
      close();
      // return true;
    }
  })();

  function pushState(hash) {
    if (history && history.pushState) {
      history.pushState({ hash: hash }, null, hash);
    } else {
      location.hash = hash;
    }
  }
})(window.jQuery, window.history, window.location);
