// fix warning issue, see https://github.com/sun-zheng-an/gulp-shell/issues/23
require('events').EventEmitter.prototype._maxListeners = 100;

//<editor-fold desc="GULP + PLUGINS">
let g = require('gulp');
let p = {};

// node
const path = require('path');

// common
p.bs = require('browser-sync');
p.clean = require('gulp-clean');
p.concat = require('gulp-concat');
p.extReplace = require('gulp-ext-replace');
p.flatMap = require('flat-map').default
p.frontMatter = require('gulp-front-matter');
p.mode = require('gulp-mode')({
    modes: ["prod", "dev"],
    default: "dev",
    verbose: false
});
p.rename = require('gulp-rename');
p.plumber = require('gulp-plumber');
p.runSequence = require('run-sequence');
p.sourcemaps = require('gulp-sourcemaps');

// image
p.scaleImages = require('gulp-scale-images')

// css
p.cleanCss = require('gulp-clean-css');
p.sass = require('gulp-sass');

// js
p.uglify = require('gulp-uglify-es').default;

// html
p.hb = require('gulp-hb');
p.handlebars = require('handlebars');
p.gulpHbHelpers = [
    require('handlebars-helpers'),
    require('handlebars-layouts')
];
p.hbHelpers = {
    repeat: require('handlebars-helper-repeat')
};
//</editor-fold>

//<editor-fold desc="CONFIG">
let c = {
    embedSourceMaps: false,
    html: {
        debug: false
    },
    image: {
        widths: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000]
    }
};
//</editor-fold>

//<editor-fold desc="TASKs">
//<editor-fold desc="TASKs(CLEAN)">
g.task('clean', function () {
    return g
        .src('build', {read: false})
        .pipe(p.mode.dev(p.plumber()))
        .pipe(p.clean({force: true}))
});
//</editor-fold>

//<editor-fold desc="TASKs(ASSTS)">
g.task('asset', function () {
    return g.src('asset/**/*')
        .pipe(g.dest('build'));
});
//</editor-fold>

//<editor-fold desc="TASKs(IMAGE)">
const multibleVariantsPerFile = (file, cb) => {
    let result = [];
    let widths = c.image.widths;
    for (let width of widths) {
        let newFile = file.clone();
        newFile.scale = {maxWidth: width, format: 'jpeg'};
        result.push(newFile);
    }
    cb(null, result)
};

const computeFileName = (output, scale, cb) => {
    let parsedPath = path.parse(output.path);
    cb(null, parsedPath.name + '(' + scale.maxWidth + ').' + scale.format)
};

g.task('image', function () {
    return g
        .src('image/*.{jpeg,jpg,png,gif}')
        .pipe(p.flatMap(multibleVariantsPerFile))
        .pipe(p.scaleImages(computeFileName))
        .pipe(g.dest('build/img'));
});
//</editor-fold>

//<editor-fold desc="TASKs(HTML)">
g.task('html', function () {
    // handlebars helper
    for (helper in p.hbHelpers) {
        p.handlebars.registerHelper(helper, p.hbHelpers[helper]);
    }

    let hb = p.hb({debug: c.html.debug})
        .data('html/data/**/*.json')
        .partials('html/partials/**/*.hbs');

    // gulp-hb helpers
    p.gulpHbHelpers.forEach(helper => hb.helpers(helper));

    return g
        .src('html/*.hbs')

        .pipe(p.mode.dev(p.plumber()))
        .pipe(p.frontMatter({property: 'data.page'}))

        .pipe(hb)
        .pipe(p.extReplace('.html'))
        .pipe(g.dest('build'));
});
//</editor-fold>

//<editor-fold desc="TASKs(CSS)">
g.task('app-css', function () {
    return g
        .src('css/app.scss')

        .pipe(p.mode.dev(p.plumber()))
        .pipe(p.mode.prod(p.sourcemaps.init()))

        .pipe(p.sass())
        .pipe(g.dest('build'))
        .pipe(p.bs.stream())

        .pipe(p.mode.prod(p.cleanCss()))
        .pipe(p.mode.prod(p.rename('app.min.css')))
        .pipe(p.mode.prod(c.embedSourceMaps
            ? p.sourcemaps.write()
            : p.sourcemaps.write('.')))
        .pipe(p.mode.prod(g.dest('build')))
});

g.task('vendor-css', function () {
    return g
        .src('css/vendor.scss')

        .pipe(p.mode.dev(p.plumber()))
        .pipe(p.mode.prod(p.sourcemaps.init()))

        .pipe(p.sass())
        .pipe(g.dest('build'))
        .pipe(p.bs.stream())

        .pipe(p.mode.prod(p.cleanCss()))
        .pipe(p.mode.prod(p.rename('vendor.min.css')))
        .pipe(p.mode.prod(c.embedSourceMaps
            ? p.sourcemaps.write()
            : p.sourcemaps.write('.')))
        .pipe(p.mode.prod(g.dest('build')))
});
//</editor-fold>

//<editor-fold desc="TASKs(JS)">
g.task('app-js', function () {
    return g
        .src('js/app/*.js')

        .pipe(p.mode.dev(p.plumber()))
        .pipe(p.mode.prod(p.sourcemaps.init()))

        .pipe(p.concat('app.js'))
        .pipe(g.dest('build'))

        .pipe(p.mode.prod(p.uglify()))
        .pipe(p.mode.prod(p.rename('app.min.js')))
        .pipe(p.mode.prod(c.embedSourceMaps
            ? p.sourcemaps.write()
            : p.sourcemaps.write('.')))
        .pipe(p.mode.prod(g.dest('build')))
});

g.task('vendor-js', function () {
    return g
        .src('js/vendor/*.js')

        .pipe(p.mode.dev(p.plumber()))
        .pipe(p.mode.prod(p.sourcemaps.init()))

        .pipe(p.concat('vendor.js'))
        .pipe(g.dest('build'))

        .pipe(p.mode.prod(p.uglify()))
        .pipe(p.mode.prod(p.rename('vendor.min.js')))
        .pipe(p.mode.prod(c.embedSourceMaps
            ? p.sourcemaps.write()
            : p.sourcemaps.write('.')))
        .pipe(p.mode.prod(g.dest('build')))
});
//</editor-fold>

//<editor-fold desc="TASKs(DEVELOP)">
g.task('bs-reload', function (cb) {
    p.bs.reload();
    cb();
});

g.task('develop', function () {
    let options = {
        port: 3330,
        ui: {
            port: 3331
        },
        serveStatic: [{
            dir: "build"
        }],
        proxy: {
            target: "http://localhost:3000",
        }
    };

    p.bs.init(options);

    // asset
    p.bs.watch('asset/**/*', function () {
        p.runSequence('asset', 'bs-reload')
    });

    // html
    p.bs.watch('html/**/*', function () {
        p.runSequence('html', 'bs-reload')
    });

    // css
    p.bs.watch('css/app.scss', function () {
        p.runSequence('app-css', 'bs-reload')
    });
    p.bs.watch('css/app/**/*', function () {
        p.runSequence('app-css', 'bs-reload')
    });
    p.bs.watch('css/vendor.scss', function () {
        p.runSequence('vendor-css', 'bs-reload')
    });
    p.bs.watch('vendor/app/**/*', function () {
        p.runSequence('vendor-css', 'bs-reload')
    });

    // js
    p.bs.watch('js/app/**/*', function () {
        p.runSequence('app-js', 'bs-reload')
    });
    p.bs.watch('js/vendor/**/*', function () {
        p.runSequence('vendor-js', 'bs-reload')
    })
});
//</editor-fold>

//<editor-fold desc="TASKS-COLLECTIONS)">
let t = {
    cleanAll: g.parallel(['clean']),
    buildAll: g.parallel(['asset', 'image', 'html', 'app-css', 'vendor-css', 'app-js', 'vendor-js']),
    buildHtml: g.parallel(['app-css', 'vendor-css']),
    buildCss: g.parallel(['app-css', 'vendor-css']),
    buildJs: g.parallel(['app-js', 'vendor-js']),
    develop: g.parallel(['develop'])
};
//</editor-fold>

//<editor-fold desc="STANDARD-TASKs">
g.task('develop', g.series([t.cleanAll, t.buildAll, t.develop]));
g.task('default', g.series([t.cleanAll, t.buildAll]));
//</editor-fold>
//</editor-fold>
