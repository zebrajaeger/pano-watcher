let gallery = {};

gallery.$gallery = $('.gallery');
gallery.$filter = $('.filter-tag');
gallery.$filterDate = $('.filter-date');

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

    let years = {};
    let months = {};
    let days = {};
    let dates = {};

    data.forEach((pano, index) => {
        let additionalClasses = '';

        let date;
        if (pano.meta) {
            if (pano.meta.tags) {
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

            let created = pano.meta.created;
            if (pano.meta.created) {
                date = new Date(created)
                let year = date.getFullYear();
                let month = date.getMonth();
                let day = date.getDay();

                if (years[year]) {
                    years[year]++;
                } else {
                    years[year] = 1;
                }

                if (months[month]) {
                    months[month]++;
                } else {
                    months[month] = 1;
                }

                if (days[day]) {
                    days[day]++;
                } else {
                    days[day] = 1;
                }

                if (dates[date]) {
                    dates[date]++;
                } else {
                    dates[date] = 1;
                }

                additionalClasses += ' created__year--' + year;
                additionalClasses += ' created__month--' + month;
                additionalClasses += ' created__day--' + day;
            }
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
            + (date ? ' data-pano-created="' + date.toISOString() + '"' : '')
            + ' data-pano-xml="/static/panos/' + pano.path + "/" + pano.panoFile + '">'
            + linkElement
            + '</div>';

        $g.append(divElement);
    });

    return {
        tags: tags,
        created: {
            years: years,
            months: months,
            days: days,
            dates: dates
        }
    };
};

/**
 *
 * @param tags map[<tagname> -> count]
 */
gallery.addFilterButtons = function (tags) {
    let $f = gallery.$filter;

    function createDiv(css, filter, label, active) {
        return '<div '
            + ' class="filter__button ' + css + (active ? ' is-active' : '') + '"'
            + ' data-filter="' + filter + '"'
            + '>'
            + label
            + '</div>';
    }

    $f.append(createDiv('filter__button--all', '*', 'All', true));

    // TODO sort items
    for (let tag in tags) {
        $f.append(createDiv('filter__button--tag', tag, tag, false));
    }

    // 'togglebutton'
    $('.filter__button').each(function (i, filterButton) {
        let $filterButton = $(filterButton);
        $filterButton.on('click', function () {
            $f.find('.is-active').removeClass('is-active');
            $(this).addClass('is-active');
        });
    });
};

/**
 *
 * @param tags map[<tagname> -> count]
 */
gallery.addDateFilterButtons = function (created) {
    let $f = gallery.$filterDate;

    function createDiv(css, filter, label, active) {
        return '<div '
            + ' class="filter__button ' + css + (active ? ' is-active' : '') + '"'
            + ' data-filter="' + filter + '"'
            + '>'
            + label
            + '</div>';
    }

    $f.append(createDiv('filter__button--all', '*', 'All', true));

    // TODO sort items
    for (let year in created.years) {
        console.log("SSS", created)
        $f.append(createDiv('filter__button--date', year, year, false));
    }

    // 'togglebutton'
    // $('.filter__button').each(function (i, filterButton) {
    //     let $filterButton = $(filterButton);
    //     $filterButton.on('click', function () {
    //         $f.find('.is-active').removeClass('is-active');
    //         $(this).addClass('is-active');
    //     });
    // });
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
        let result = gallery.addPanos(data);
        gallery.addFilterButtons(result.tags);
        gallery.addDateFilterButtons(result.created);
        gallery.initIsotope();
    });
};
