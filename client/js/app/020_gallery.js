let gallery = {};

gallery.$gallery = $('.gallery');
gallery.$filterTag = $('.gallery__control__filter-tag');
gallery.$filterDate = $('.gallery__control__filter-date');
gallery.$sortDate = $('.gallery__control__sort-date');

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
                date = new Date(created);
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
            = '<img'
            + ' class="preview"'
            + ' src="/api/panos/' + pano.id + '/preview"'
            + ' alt="' + pano.name + '"'
            + '>';

        let linkElement
            = '<a href="#">'
            + imgElement
            + '</a>';

        let dataElement
            = '<div'
            + ' class="gallery__item__data"';
        if (date) {
            dataElement += ' data-created-date="' + date.toISOString() + '"'
            dataElement += ' data-created-year="' + date.getFullYear() + '"'
        }
        dataElement += '></div>';

        let divElement
            = '<div id="pano-' + index + '"'
            + ' class="gallery__item' + additionalClasses + '"'
            + ' data-pano-id="' + pano.id + '"'
            + ' data-pano-name="' + pano.name + '"'
            + ' data-pano-xml="/static/panos/' + pano.path + "/" + pano.panoFile + '">'
            + dataElement
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

gallery.addSortButtonsForDate = function () {
    let $s = gallery.$sortDate;

    function createDiv(sortBy, label, active) {
        return '<div '
            + ' class="gallery-button gallery-button--sort-date' + (active ? ' is-active' : '') + '"'
            + ' data-sort-by="' + sortBy + '"'
            + '>'
            + label
            + '</div>';
    }

    $s.append(createDiv('*', 'Natural', true));
    $s.append(createDiv('panoName', 'Name', false));
    $s.append(createDiv('created', 'New first', false));
    $s.append(createDiv('createdI', 'Old first', false));

    // 'togglebutton'
    $('.gallery-button--sort-date').each(function (i, sortButton) {
        let $sortButton = $(sortButton);
        $sortButton.on('click', function () {
            $s.find('.is-active').removeClass('is-active');
            $(this).addClass('is-active');
        });
    });
};

/**
 *
 * @param tags map[<tagname> -> count]
 */
gallery.addFilterButtonsForTags = function (tags) {
    let $f = gallery.$filterTag;

    function createDiv(filter, label, active) {
        return '<div '
            + ' class="gallery-button gallery-button--filter-tag' + (active ? ' is-active' : '') + '"'
            + ' data-filter="' + filter + '"'
            + '>'
            + label
            + '</div>';
    }

    $f.append(createDiv('*', 'All', true));

    // TODO sort items
    for (let tag in tags) {
        $f.append(createDiv(tag, tag, false));
    }

    // 'togglebutton'
    $('.gallery-button--filter-tag').each(function (i, filterButton) {
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
gallery.addFilterButtonsForDate = function (created) {
    let $f = gallery.$filterDate;

    function createDiv(filter, label, active) {
        return '<div '
            + ' class="gallery-button gallery-button--filter-date' + (active ? ' is-active' : '') + '"'
            + ' data-filter="' + filter + '"'
            + '>'
            + label
            + '</div>';
    }

    $f.append(createDiv('*', 'All', true));

    // TODO sort items
    for (let year in created.years) {
        $f.append(createDiv(year, year, false));
    }

    // 'togglebutton'
    $('.gallery-button--filter-date').each(function (i, filterButton) {
        let $filterButton = $(filterButton);
        $filterButton.on('click', function () {
            $f.find('.is-active').removeClass('is-active');
            $(this).addClass('is-active');
        });
    });
};

gallery.initIsotope = function () {
    let $g = gallery.$gallery;

    gallery.$sortDate.on('click', '.gallery-button--sort-date', function () {
        let sortValue = $(this).attr('data-sort-by');
        console.log("SORT-DATE", sortValue)
        if (sortValue === '*') {
            $g.isotope({sortBy: 'original-order'});
        } else {
            $g.isotope({sortBy: sortValue});
        }
    });

    gallery.$filterTag.on('click', '.gallery-button--filter-tag', function () {
        let filterValue = $(this).attr('data-filter');
        console.log("TAG", filterValue)
        if (filterValue === '*') {
            $g.isotope({filter: '*'});
        } else {
            $g.isotope({filter: '.tag--' + filterValue});
        }
    });

    gallery.$filterDate.on('click', '.gallery-button--filter-date', function () {
        let filterValue = $(this).attr('data-filter');
        console.log("DATE", filterValue)
        if (filterValue === '*') {
            $g.isotope({filter: '*'});
        } else {
            $g.isotope({filter: '.created__year--' + filterValue});
        }
    });

    $g.isotope({
        itemSelector: '.gallery__item',
        layoutMode: 'fitRows',
        getSortData: {
            panoName: function (itemElem ) {
                return  $( itemElem ).data('pano-name');
            },
            created: function (itemElem ) {
                let value =  $( itemElem ).find('.gallery__item__data').data('created-date');
                return value ? Date.parse(value) : 99999999999999;
            },
            createdI: function (itemElem ) {
                let value =  $( itemElem ).find('.gallery__item__data').data('created-date');
                return value ? -Date.parse(value) : 99999999999999;
            }
        },
        masonry: {}
    });
};

gallery.init = function () {
    gallery.requestPanosFromServer(function (data) {
        let result = gallery.addPanos(data);
        gallery.addSortButtonsForDate();
        gallery.addFilterButtonsForTags(result.tags);
        gallery.addFilterButtonsForDate(result.created);
        gallery.initIsotope();
    });
};
