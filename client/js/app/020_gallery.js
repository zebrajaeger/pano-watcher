let gallery = {};

gallery.$gallery = $('.gallery');
gallery.$filter = $('.filter');

gallery.requestPanosFromServer = function (cb) {
    $.getJSON('/api/panos/', function (data) {
        cb(data);
    });
};

/**
 * json -> tags map[<tagname> -> count]
 * @param data panos (json)
 */
gallery.addPanos = function (data) {
    let $g = gallery.$gallery;
    let tags = {};

    data.forEach((pano, index) => {
        let additionalClasses = '';
        if (pano.meta && pano.meta.tags) {
            pano.meta.tags.forEach(tag => {
                let slugifiedTag = utils.slugify(tag);
                if (tags[slugifiedTag]) {
                    ++tags[slugifiedTag];
                } else {
                    tags[slugifiedTag] = 1;
                }
                additionalClasses += ' tag--' + slugifiedTag;
            })
        }

        let imgElement
            = '<img '
            + ' class="preview"'
            + ' src="/api/panos/' + pano.id + '/preview"'
            + ' alt="' + pano.name + '"'
            + '>';

        let linkElement
            = '<a href="#">'
            + imgElement
            + '</a>';

        let divElement
            = '<div id="pano-' + index + '"'
            + ' class="grid__item' + additionalClasses + '"'
            + ' data-pano-id="' + pano.id + '"'
            + ' data-pano-name="' + pano.name + '"'
            + ' data-pano-xml="/static/panos/' + pano.path + "/" + pano.panoFile + '">'
            + linkElement
            + '</div>';

        $g.append(divElement);
    });

    return tags;
};

/**
 *
 * @param tags map[<tagname> -> count]
 */
gallery.addFilterButtons = function (tags) {
    let $f = gallery.$filter;

    function createA(css, filter, label, active) {
        let a = '<a'
            + ' class="filter__button ' + css + '"'
            + ' data-filter="' + filter + '">'
            + label
            + '</a>';

        let div = '<div class="filter__wrapper' + (active ? ' is-active' : '') + '">'
            + a
            + '</div>';

        return div;
    }

    $f.append(createA('filter__button--all', '*', 'All',true));

    // TODO sort items
    for (let tag in tags) {
        $f.append(createA('filter__button--tag', tag, tag,false));
    }

    $('.filter__button').each(function (i, filterButton) {
        let $filterButton = $(filterButton);
        $filterButton.on('click', function () {
            console.log(this)
            $f.find('.is-active').removeClass('is-active');
            $(this).parent().addClass('is-active');
        });
    });
};

gallery.initIsotope = function () {
    let $g = gallery.$gallery;
    let $f = gallery.$filter;

    $f.on('click', '.filter__button', function () {
        let filterValue = $(this).attr('data-filter');
        if (filterValue === '*') {
            $g.isotope({filter: '*'});
        } else {
            $g.isotope({filter: '.tag--' + filterValue});
        }
    });

    $g.isotope({
        itemSelector: '.grid__item',
        layoutMode: 'fitRows',
        masonry: {}
    });
};

gallery.init = function () {
    gallery.requestPanosFromServer(function (data) {
        let tags = gallery.addPanos(data);
        gallery.addFilterButtons(tags);
        gallery.initIsotope();
    });
};
