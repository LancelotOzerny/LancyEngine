const gulp = require('gulp');
const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');
const browserSync = require('browser-sync').create();
const fs = require('fs');

const paths = {
    less: {
        entry: 'less/compile/*.less',
        watch: 'less/**/*.less',
        dest: 'css',
    },
};

function compileLess() {
    fs.mkdirSync('less/compile', { recursive: true });
    fs.mkdirSync(paths.less.dest, { recursive: true });

    return gulp.src(paths.less.entry, { allowEmpty: true })
        .pipe(less())
        .pipe(cleanCSS())
        .pipe(gulp.dest(paths.less.dest))
        .pipe(browserSync.stream());
}

function serve(done) {
    browserSync.init({
        server: {
            baseDir: './',
        },
        port: 3000,
        open: true,
        notify: false,
    });

    done();
}

function watchFiles() {
    gulp.watch(paths.less.watch, compileLess);
}

const build = compileLess;
const develop = gulp.series(build, serve, watchFiles);

exports.compileLess = compileLess;
exports.build = build;
exports.serve = serve;
exports.watch = watchFiles;
exports.develop = develop;
exports.default = develop;
