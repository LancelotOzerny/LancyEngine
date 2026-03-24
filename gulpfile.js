const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');
const { deleteAsync } = require('del');

// Очистка папки engine перед сборкой
function clean() {
    return deleteAsync(['engine/**']);
}

// Компиляция и оптимизация JS‑файлов по модулям
function compileJS() {
    const moduleConfigs = [
        {
            src: 'src/scripts/core/**/*.js',
            dest: 'engine',
            filename: 'core.min.js'
        },
        {
            src: 'src/scripts/ui/**/*.js',
            dest: 'engine',
            filename: 'ui.min.js'
        },
        {
            src: 'src/scripts/common/**/*.js',
            dest: 'engine',
            filename: 'common.min.js'
        }
    ];

    const tasks = moduleConfigs.map(config => {
        return gulp.src(config.src)
            .pipe(concat(config.filename))
            .pipe(uglify())
            .pipe(gulp.dest(config.dest));
    });

    return Promise.all(tasks);
}

// Компиляция и минификация LESS‑файлов
function compileLess() {
    return gulp.src('src/less/compile/**/*.less')
        .pipe(less())
        .pipe(cleanCSS())
        .pipe(concat('styles.min.css'))
        .pipe(gulp.dest('engine'));
}

// Задача по умолчанию — полная сборка проекта
const build = gulp.series(clean, compileJS, compileLess);

// Экспорт задач
exports.clean = clean;
exports.compileJS = compileJS;
exports.compileLess = compileLess;
exports.build = build;
exports.default = build;