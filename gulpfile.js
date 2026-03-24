const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const browserSync = require('browser-sync').create();
const { deleteAsync } = require('del'); // Импортируем deleteAsync


// Очистка папки dist перед сборкой
function clean() {
    return deleteAsync(['dist/**']); // Используем deleteAsync вместо del
}

// Компиляция и оптимизация JS‑файлов по модулям
function compileJS() {
    const moduleConfigs = [
        {
            src: 'src/engine/ui/**/*.js',
            dest: 'dist/engine',
            filename: 'ui.min.js'
        },
        {
            src: 'src/engine/core/**/*.js',
            dest: 'dist/engine',
            filename: 'core.min.js'
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

// Запуск веб‑сервера с BrowserSync
function serve(done) {
    browserSync.init({
        server: {
            baseDir: './'
        },
        port: 3000,
        open: true,
        notify: false
    });
    done();
}

// Наблюдение за изменениями в JS‑файлах
function watchFiles() {
    gulp.watch('src/engine/**/*.js', gulp.series(compileJS, reload));
}

// Перезагрузка страницы в браузере
function reload(done) {
    browserSync.reload();
    done();
}

// Задача по умолчанию — полная сборка проекта
const build = gulp.series(clean, compileJS);

// Задача для разработки — запуск сервера и наблюдение за файлами
const develop = gulp.series(clean, compileJS, serve, watchFiles);

// Экспорт задач
exports.clean = clean;
exports.compileJS = compileJS;
exports.serve = serve;
exports.watchFiles = watchFiles;
exports.build = build;
exports.develop = develop;
exports.default = build;
