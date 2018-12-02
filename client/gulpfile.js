//<editor-fold desc="GULP + PLUGINS">
let g = require('gulp');
let p = {};
p.bs = require('browser-sync');
p.clean = require('gulp-clean');
p.cleanCss = require('gulp-clean-css');
p.concat = require('gulp-concat');
p.mode = require('gulp-mode')({
    modes: ["prod", "dev"],
    default: "dev",
    verbose: false
});
p.rename = require('gulp-rename');
p.runSequence = require('run-sequence');
p.sass = require('gulp-sass');
p.plumber = require('gulp-plumber');
p.sequence = require('gulp-sequence');
p.sourcemaps = require('gulp-sourcemaps');
p.uglify = require('gulp-uglify-es').default;
//</editor-fold>

//<editor-fold desc="CONFIG">
let c = {
    embedSourceMaps: false
};
//</editor-fold>

//<editor-fold desc="TASKS-COLLECTIONS)">
let t = {
    cleanAll: ['clean'],
    buildAll: ['html', 'app-css', 'vendor-css', 'app-js', 'vendor-js'],
    buildHtml: ['app-css', 'vendor-css'],
    buildCss: ['app-css', 'vendor-css'],
    buildJs: ['app-js', 'vendor-js'],
    develop: ['watch']
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

//<editor-fold desc="TASKs(HTML)">
g.task('html', function () {
    return g
        .src('html/*.html')
        .pipe(p.mode.dev(p.plumber()))
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
        .pipe(p.mode.prod(p.rename('app.min.js')))
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
g.task('watch', function () {
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

    p.bs.watch('html/**/*', function () {
        p.runSequence('html', 'bs-reload')
    });

    p.bs.watch('css/app/**/*', function () {
        p.runSequence('app-css') // is this enough?
        //p.runSequence('app-css', 'bs-reload')
    });
    p.bs.watch('css/vendor/**/*', function () {
        p.runSequence('vendor-css') // is this enough?
        //p.runSequence('app-css', 'bs-reload')
    });

    p.bs.watch('js/app/**/*', function () {
        p.runSequence('app-js', 'bs-reload')
    });
    p.bs.watch('js/vendor/**/*', function () {
        p.runSequence('vendor-js', 'bs-reload')
    })
});
//</editor-fold>

//<editor-fold desc="STANDARD-TASKs">
g.task('develop', p.sequence(t.cleanAll, t.buildAll, t.develop));
g.task('default', p.sequence(t.cleanAll, t.buildAll));
//</editor-fold>
//</editor-fold>
