function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

$(document).ready(function () {
    $.getJSON('/api/panos/', function (data) {
        let $grid = $('.grid');
        let $filters = $('.filter-button-group');

        let tags = {};

        // panos
        data.forEach((pano, index) => {
            let additionalClasses = '';
            if (pano.meta && pano.meta.tags) {
                pano.meta.tags.forEach(tag => {
                    let x = slugify(tag);
                    tags[x] = true;
                    additionalClasses += ' tag--' + x;
                })
            }
            $grid.append(
                '<div id="pano-' + index + '" class="grid-item' + additionalClasses + '" data-pano-xml="/static/panos/' + pano.name + "/" + pano.panoFile + '">' +
                '    <a href="#"><img class="preview" src="/api/panos/' + pano.name + '/preview"></a>' +
                '</div>')
        });

        // gallery

        // filter buttons
        for (tag in tags) {
            // TODO sort items
            $filters.append('<button data-filter="' + tag + '">' + tag + '</button>');
        }
        $filters.on('click', 'button', function () {
            let filterValue = $(this).attr('data-filter');
            if (filterValue == '*') {
                $grid.isotope({filter: '*'});
            } else {
                $grid.isotope({filter: '.tag--' + filterValue});
            }
        });

        // gallery items
        $grid.isotope({
            itemSelector: '.grid-item',
            layoutMode: 'fitRows',
            masonry: {}
        });

    });

    // popup open
    $("body").on("click", ".grid-item", function () {
        $("body").addClass("popup-open").fadeIn(2000);
        $('.overlay-popup').addClass("popup-open").fadeIn(400);

        $('#pano-wrapper').append('<div id="pano"></div>')
        embedpano({xml: $(this).data('pano-xml'), target:'pano'})
    });

    $('html').on("click", "body.popup-open", function (e) {
        if(e.target.nodeName=='BODY'){
            removepano('pano');
            $("body").removeClass("popup-open")
            $(".overlay-popup").removeClass("popup-open");
        }
    });
});
