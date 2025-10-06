const gulp = require('gulp');
const { watch } = require('gulp');
const sass = require('gulp-dart-sass');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const minify = require('gulp-minify');
const cleanCSS = require('gulp-clean-css');
const CSSurlAdjuster = require('gulp-css-url-adjuster');
const wrap = require('gulp-wrap');

let babel = require('gulp-babel');



const SourceFolder = '../react/public/assets';
const coreSource = '../backend/plugins/core-tools/static';


const css = [
    // './node_modules/@wolf-table/table/dist/table.min.css',

    `./libs/videojs/video-js.css`,

    `${SourceFolder}/libs/prism.css`,
    `node_modules/@yaireo/tagify/dist/tagify.css`,
    `node_modules/@selectize/selectize/dist/css/selectize.css`,
    `node_modules/pdfjs-dist/web/pdf_viewer.css`,
    `${SourceFolder}/css/wui.css`,
    `${SourceFolder}/css/widgets.css`,
    `${SourceFolder}/css/sections.css`,
    `${coreSource}/ui-v2.css`,
    './components/*.scss',
    `./css/index.scss`,
]

const libs = [
    //todo: @wolf-table
     './node_modules/signature_pad/dist/signature_pad.umd.js',
/*    './node_modules/@wolf-table/table/dist/table.min.js',
    './node_modules/@wolf-table/table-renderer/dist/table-renderer.js',*/
    `./libs/html-fragment.min.js`,
    `./libs/jquery-3.6.0.min.js`,


    `./libs/videojs/video.min.js`,
    `./libs/md5.min.js`,

    `./libs/jquery.csv.js`,
    './libs/xlsxspread.min.js',

];



const vanilla = [

    './js/vanilla.js',
    './js/components.js',
  './js/view.js',
  './js/xhr.js',
  './js/router.js',
  './js/app.js',
  './js/core.js',
  './components/*.js',
    `./js/create-button.js`,
    `./js/search-bar.js`,

];

const jsConfig = [ // initialized before other scripts
    `${SourceFolder}/js/config.js`,
]

const js = [
    /// ...libs,

    

    `${SourceFolder}/js/polyfills.js`,
    `${SourceFolder}/js/app.js`,
    `${SourceFolder}/js/globals.js`,
    `${SourceFolder}/js/uiperms.js`,
    `${SourceFolder}/js/user.js`,
    `${SourceFolder}/js/modal.js`,
    `${SourceFolder}/js/multipart-uploader.js`,
    `${SourceFolder}/js/s3-multipart-upload.js`,
    `${SourceFolder}/js/widgets.js`,
    `${SourceFolder}/js/xhr.js`,
    `${SourceFolder}/js/project.js`,
    `${SourceFolder}/js/objects.js`,
    `${SourceFolder}/js/uploadbox.js`,
    `${SourceFolder}/js/events.js`,
    `${SourceFolder}/js/tooltip.js`,
    `${SourceFolder}/libs/prism.js`,
    `${SourceFolder}/js/tree.js`,



    `${SourceFolder}/js/path.js`,
    `${SourceFolder}/js/view.js`,
    `${SourceFolder}/js/view.files.js`,
    `${SourceFolder}/js/roles.js`,
    `${SourceFolder}/js/access-groups.js`,
    `${SourceFolder}/js/admin-users.js`,
    `${SourceFolder}/js/comments.js`,
    ...vanilla
];


gulp.task('ilcss', function() {
    return gulp.src([
        ...css
    ]).pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS())

        .pipe(concat('style.css', {newLine: '\r\n'}))
        .pipe(gulp.dest('./dist/'));
});


arrayParam = function(p){
    return  (gulp.series ? gulp.series(...p) : p);
}

 

gulp.task('iljsconfig', function() {
    return gulp.src([
        ...jsConfig
    ])

        //.pipe(minify({noSource: true }))
        .pipe(babel({

        }))
        .pipe(concat(  'config.js', {newLine: ';\r\n'}))

        .pipe(wrap(`(function(){<%= contents %>})();`, {}, { parse: false }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('iljsLibsg', function() {
    return gulp.src([
        ...libs
    ])

        //.pipe(minify({noSource: true }))
        .pipe(babel({

        }))
        .pipe(concat(  'libs.js', {newLine: ';\r\n'}))

        .pipe(wrap(`(function(){<%= contents %>})();`, {}, { parse: false }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('iljs', function() {
    return gulp.src([
        ...js
    ])

        //.pipe(minify({noSource: true }))
        .pipe(babel({

        }))
        .pipe(concat(  'index.js', {newLine: ';\r\n'}))

        .pipe(wrap(`(function(){<%= contents %>})();`, {}, { parse: false }))
        .pipe(gulp.dest('./dist/'));
});



gulp.task('il', arrayParam(['iljs', 'iljsconfig', 'iljsLibsg', 'ilcss']));
gulp.task('default', arrayParam(['il']));
gulp.task('devNew', function(){
    const watcher = watch(['input/*.js']);

    watcher.on('change', function(path, stats) {
        arrayParam(['il']) 
    });

    watcher.on('add', function(path, stats) {
        arrayParam(['il']);
    });

    watcher.on('unlink', function(path, stats) {
        arrayParam(['il']) 
    });
})

gulp.task('dev', function() {
    gulp.watch('js/**/*.js', arrayParam(['il']));
    gulp.watch('components/**/*', arrayParam(['il']));
    gulp.watch('css/**/*.css', arrayParam(['il']));
    gulp.watch('css/**/*.scss', arrayParam(['il']));
 
    gulp.watch('libs/**/*', arrayParam(['il']));
    gulp.watch('assets/**/*', arrayParam(['il']));
    gulp.watch('../react/public/**/*', arrayParam(['il']));
});

 
gulp.task('documenteditor', function() {
    const editors = [
        // `node_modules/@syncfusion/ej2-documenteditor/dist/global/ej2-documenteditor.min.js`,
        `node_modules/@syncfusion/ej2-documenteditor/dist/ej2-documenteditor.umd.min.js`,
    ]
    return gulp.src(editors)
    .pipe(concat(  'documenteditor.js', {newLine: ''}))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('spreadsheetditor', function() {
    const editors = [
        `node_modules/@syncfusion/ej2-spreadsheet/dist/ej2-spreadsheet.min.js`,
    ]
    return gulp.src(editors)
    .pipe(concat(  'spreadsheetditor.js', {newLine: ''}))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('editors', arrayParam(['spreadsheetditor', 'documenteditor']));



gulp.task('reg2dev', function() {
    gulp.watch('../il/js/**/*.js', arrayParam(['iljs']));
    gulp.watch('../il/scss/**/*.scss', arrayParam(['ilcss']));
    gulp.watch('../il/scss/**/*.css', arrayParam(['ilcss']));

});
