const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');
const { deleteAsync } = require('del');
const browserSync = require('browser-sync').create();

// Очистка папки engine перед сборкой
function clean() {
    return deleteAsync(['engine/**']);
}

// Компиляция и оптимизация JS‑файлов по модулям
function compileJS() {
    const moduleConfigs = [
        {
            src: 'src/scripts/math/**/*.js',
            dest: 'engine',
            filename: 'math.min.js'
        },
        {
            src: 'src/scripts/components/**/*.js',
            dest: 'engine',
            filename: 'components.min.js'
        },
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

// Запуск локального сервера и инициализация BrowserSync
function serve(done) {
    browserSync.init({
        server: {
            baseDir: './' // Корневая директория проекта
        },
        port: 3000, // Порт для сервера (можно изменить)
        open: true, // Автоматически открывать браузер
        notify: false // Отключить всплывающие уведомления
    });
    done();
}

// Перезагрузка браузера после компиляции JS
function reloadJS(done) {
    compileJS()
        .then(() => {
            browserSync.reload();
            done();
        })
        .catch(done);
}

// Перезагрузка браузера после компиляции LESS
function reloadLess(done) {
    compileLess()
        .then(() => {
            browserSync.reload();
            done();
        })
        .catch(done);
}

// Задача watch для отслеживания изменений и перезагрузки
function watchFiles() {
    // Отслеживание изменений JS‑файлов и перезагрузка
    gulp.watch('src/scripts/**/*.js', reloadJS);

    // Отслеживание изменений LESS‑файлов и перезагрузка
    gulp.watch('src/less/compile/**/*.less', reloadLess);

    // Отслеживание изменений HTML/других файлов для прямой перезагрузки
    gulp.watch(['*.html', 'engine/**/*']).on('change', browserSync.reload);
}

// Полная сборка проекта
const build = gulp.series(clean, compileJS, compileLess);

// Запуск сервера и наблюдение за файлами
const dev = gulp.series(build, serve, watchFiles);

// Экспорт задач
exports.clean = clean;
exports.compileJS = compileJS;
exports.compileLess = compileLess;
exports.build = build;
exports.serve = serve;
exports.watch = watchFiles;
exports.default = dev;