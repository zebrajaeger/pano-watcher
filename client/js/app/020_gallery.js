let gallery = {};

gallery.$gallery = $('.gallery');
gallery.$filterTag = $('.gallery__control__filter-tag');
gallery.$filterDate = $('.gallery__control__filter-date');
gallery.$sortDate = $('.gallery__control__sort-date');
gallery.filters = {};

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
        let panoTags = [];
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
                    panoTags.push(slugifiedTag);
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
            + ' class="gallery__item__data"'
            + ' data-name="' + pano.name + '"'
            + ' data-id="' + pano.id + '"'
            + ' data-pano-xml="/static/panos/' + pano.path + "/" + pano.panoFile + '"';
        if (date) {
            dataElement += ' data-created-timestamp="' + date.valueOf() + '"';
            dataElement += ' data-created-date="' + date.toISOString() + '"';
            dataElement += ' data-created-year="' + date.getFullYear() + '"';
            dataElement += ' data-created-month="' + date.getMonth() + '"';
            dataElement += ' data-created-day="' + date.getDay() + '"';
        } else {
            dataElement += ' data-created-year="-666"'
        }
        if (pano.meta.tags) {
            dataElement += ' data-tags="' + panoTags.join(',') + '"';
        }
        dataElement += '></div>';

        let divElement
            = '<div id="pano-' + index + '"'
            + ' class="gallery__item"'
            + '>'
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

    $('.gallery-button--sort-date').each(function (i, sortButton) {
        let $sortButton = $(sortButton);
        $sortButton.on('click', function () {
            $s.find('.is-active').removeClass('is-active');
            $(this).addClass('is-active');
            let sortValue = $(this).attr('data-sort-by');
                console.log("SORT-DATE", sortValue)
                if (sortValue === '*') {
                    gallery.$gallery.isotope({sortBy: 'original-order'});
                } else {
                    gallery.$gallery.isotope({sortBy: sortValue});
                }
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

    // TODO sort items
    for (let tag in tags) {
        $f.append(createDiv(tag, tag, false));
    }

    // 'togglebutton'
    $('.gallery-button--filter-tag').each(function (i, filterButton) {
        let $filterButton = $(filterButton);
        $filterButton.on('click', function (event) {
            let $target = $(event.currentTarget);
            $target.toggleClass('is-active');
            let isChecked = $target.hasClass('is-active');
            let filter = $target.attr('data-filter');
            if (isChecked) {
                gallery.addFilter('tags', filter);
            } else {
                gallery.removeFilter('tags', filter);
            }
            gallery.updateFilters();
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

    $f.append(createDiv('-666', 'Without Date', false));

    // TODO sort items
    for (let year in created.years) {
        $f.append(createDiv(year, year, false));
    }

    // 'togglebutton'
    $('.gallery-button--filter-date').each(function (i, filterButton) {
        let $filterButton = $(filterButton);
        $filterButton.on('click', function (event) {
            let $target = $(event.currentTarget);
            $target.toggleClass('is-active');
            let isChecked = $target.hasClass('is-active');
            let filter = $target.attr('data-filter');
            if (isChecked) {
                gallery.addFilter('year', filter);
            } else {
                gallery.removeFilter('year', filter);
            }
            gallery.updateFilters();
        });
    });
};

gallery.addFilter = function (category, filter) {
    let f = gallery.filters[category];
    if (f) {
        if (f.indexOf(filter) == -1) {
            f.push(filter);
        }
    } else {
        gallery.filters[category] = [filter];
    }
};

gallery.removeFilter = function (category, filter) {
    let f = gallery.filters[category];
    if (f) {
        let index = f.indexOf(filter);
        if (index != -1) {
            f.splice(index, 1);
        }
    }
};

gallery.updateFilters = function () {
    let $g = gallery.$gallery;
    $g.isotope({
        filter: function () {
            let $i = $(this);
            let $data = $i.find('.gallery__item__data');
            let year = $data.data('created-year');
            let yearMatch = true;
            if (year) {
                year = year.toString();
                yearMatch = gallery.filters.year && gallery.filters.year.indexOf(year) != -1;
            }

            let tagsMatch = false;
            let tags = $data.data('tags');
            if (tags && gallery.filters.tags) {
                tags = tags.split(',');
                tags.forEach(function (tag) {
                    if (gallery.filters.tags.indexOf(tag) != -1) {
                        tagsMatch = true;
                    }
                })
            }

            return yearMatch && tagsMatch;
        }
    });
};

gallery.initIsotope = function () {
    let $g = gallery.$gallery;

    $g.isotope({
        itemSelector: '.gallery__item',
        layoutMode: 'fitRows',
        getSortData: {
            panoName: function (itemElem) {
                return $(itemElem).find('.gallery__item__data').data('pano-name');
            },
            created: function (itemElem) {
                let value = $(itemElem).find('.gallery__item__data').data('created-date');
                return value ? Date.parse(value) : 99999999999999;
            },
            createdI: function (itemElem) {
                let value = $(itemElem).find('.gallery__item__data').data('created-date');
                console.log(value)
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
