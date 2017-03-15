 /*! Demo page script | Skeletabs
 ----------------------------------------------------------------------*/

(function($) {

    // Default
    $("#skltbsDefault").skeletabs();

    // Default tab change
    $("#skltbsDefaultTabChange").skeletabs({ defaultTab: 2 });

    // Disable tab
    $("#skltbsDisableTab").skeletabs({ disableTab: 4 });

    // Equalize Heights
    $("#skltbsEqualHeights").skeletabs({ equalHeights: true });

    // Responsive settings
    $("#skltbsResponsive").skeletabs({
        responsive: {
            breakpoint: 800,
            headingTagName: "h4"
        }
    });
    $("#skltbsNonResponsive").skeletabs({ responsive: false });

    // Switch on hover
    $("#skltbsOnHover").skeletabs({ triggerEvent: "hover" });

    // Disable extra keyboard support
    $("#skltbsDisableExKeyboard").skeletabs({ extendedKeyboard: false });

    // Prevent URL update
    $("#skltbsDisableHashUpdate").skeletabs({ updateUrl: false });

    // Use animation
    $("#skltbsAnimated").skeletabs({ animation: "fade-scale" });

    // Autoplay
    $("#skltbsAutoplay").skeletabs({
        autoplay: true,
        autoplayInterval: 4500
    });

    // Bind custom event
    $("#skltbsCustomEvent").skeletabs({updateUrl: false}).on("tabswitch", function() {
        alert("You are on: #" + $(this).skeletabs("getCurrentPanel").attr("id"));
    });

})(jQuery);