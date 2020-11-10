(function ($) {
  var presetList = {
    Starting_at_2nd: {
      startIndex: 1
    },
    Starting_at_last: {
      startIndex: -1
    },
    Disabled_3rd: {
      disabledIndex: 2
    },
    Disabled_last_2: {
      disabledIndex: [-1, -2]
    },
    Disabled_last_2_starting_at_1: {
      startIndex: 1,
      disabledIndex: [-1, -2]
    },
    Equal_heights: {
      panelHeight: 'equal'
    },
    Adaptive_heights: {
      panelHeight: 'adaptive'
    },
    On_hover: {
      selectEvent: 'hover'
    },
    Autoplay: {
      autoplay: true
    },
    Autoplay_every_1s: {
      autoplay: true,
      autoplayInterval: 1000
    },
    Non_responsive: {
      breakpoint: 0
    },
    Destroyed_responsive: {
      breakpointLayout: 'destroy'
    },
    Accordion_under_1000px: {
      breakpoint: 1000
    },
    Accordion_slide_effect: {
      slidingAccordion: true
    },
    Transition_2s: {
      transitionDuration: 2000
    },
    Debounce_500ms: {
      resizeTimeout: 500
    },
    Manual_keyboard: {
      keyboard: 'focus'
    },
    No_keyboard: {
      keyboard: false
    },
    No_hash_change: {
      history: false
    },
    PushState: {
      history: 'push'
    }
  };

  var $outer = $('#outer');
  var $preset = $('#preset');
  var $dump = $('#dump');

  // insert preset data into <select />
  $.each(presetList, function (key) {
    $('<option />', {
      text: key.replace(/_/g, ' '),
      value: key
    }).appendTo($preset);
  });

  // show preset code in <pre /> when an option gets selected
  $preset.on('change', function () {
    var presetName = $(this).val();
    var preset = presetList[presetName];
    $dump.text(JSON.stringify(preset, null, 1));
  });

  // click on control buttons
  $('#create').click(function () {
    var preset = presetList[$preset.val()];
    if ($outer.get(0).skeletabsId) {
      $outer.skeletabs('destroy');
    }
    removeHash();
    $outer.skeletabs(preset);
  });
  $('#destroy').click(function () {
    $outer.skeletabs('destroy');
  });
  $('#add').click(function () {
    $outer.skeletabs('add', {
      tab: '💩',
      panel: '<p>Lorem ipsum</p>'
    });
  });
  $('#remove').click(function () {
    removeHash();
    $outer.skeletabs('remove', -1);
  });

  function removeHash() {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, null, ' ');
    } else {
      window.location.hash = '#';
    }
  }
})(jQuery);
