let popup = {};

popup.init = function () {
    // popup open
    $("body").on("click", ".gallery__item", function () {
        $("body").addClass("popup-open").fadeIn(2000);
        $('.overlay-popup').addClass("popup-open").fadeIn(400);

        $('#pano-wrapper').append('<div id="pano"></div>')
        embedpano({
                xml: $(this).find('.gallery__item__data').data('pano-xml'),
                target: 'pano'
            }
        )
    });

    $('html').on("click", "body.popup-open", function (e) {
        if (e.target.nodeName == 'BODY') {
            removepano('pano');
            $("body").removeClass("popup-open")
            $(".overlay-popup").removeClass("popup-open");
        }
    });
};
