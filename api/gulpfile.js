var gulp = require("gulp");

var concat = require("gulp-concat");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify");
var cleanCSS = require("gulp-clean-css");
var CSSurlAdjuster = require("gulp-css-url-adjuster");
var watch = require("gulp-watch");
//const print = require('gulp-print').default;

const exec = require("child_process").exec;

function runCommand(command) {
  return function (cb) {
    var process = exec(command, function (err, stdout, stderr) {
      cb(err);
    });
    function exitHandler(options, exitCode) {
      if (options.cleanup) console.log("clean");
      if (exitCode || exitCode === 0) console.log(exitCode);
      if (options.exit) process.exit();
    }

    //do something when app is closing
    process.on("exit", exitHandler.bind(null, { cleanup: true }));

    //catches ctrl+c event
    process.on("SIGINT", exitHandler.bind(null, { exit: true }));

    // catches "kill pid" (for example: nodemon restart)
    process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
    process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

    //catches uncaught exceptions
    process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
    __count = 1;
    process.stdout.on("data", function (data) {
      console.log(
        __count++ + "-----------------------------------------------"
      );
      console.log(data.toString());
    });
  };
}

const css = () => {
  let p = gulp.src(["./static/css/wui.css"]);

  p = p
    .pipe(concat("main.css", { newLine: ";\r\n" }))
    .pipe(rename({ suffix: ".min" }))
    //.pipe(uglify({mangle: false}))
    .pipe(gulp.dest("./static/dist/"));
  return p;
};

const js = () => {
  let p = gulp.src([
    "./static/js/polyfills.js",
    "./static/moment.min.js",
    "./static/js/jquery.min.js",
    "./static/js/tagify.min.js",
    "./static/js/globals.js",
    "./static/js/user.js",
    "./static/js/modal.js",
    "./static/js/widgets.js",
    "./static/js/xhr.js",
    "./static/js/project.js",
    "./static/js/objects.js",
    "./static/js/uploadbox.js",
    "./static/js/view.files.js",
    "./static/js/events.js",
    "./static/js/tooltip.js",
    "./static/libs/prism.js",
    "./static/js/tree.js",
    "./static/js/path.js",
    "./static/js/view.js",
    "./static/js/app.js",
    "./static/js/comments.js",
    "./static/js/files_router.js",
    "./static/js/files_common.js",
    "./static/js/exports.js",
  ]);

  p = p
    .pipe(concat("main.js", { newLine: ";\r\n" }))
    .pipe(rename({ suffix: ".min" }))
    //.pipe(uglify({mangle: false}))
    .pipe(gulp.dest("./static/dist/"));
  return p;
};

gulp.task(
  "start-mongo",
  runCommand(
    '"C:/Program Files/MongoDB/Server/6.0/bin/mongod.exe" --dbpath C:/ilmongo'
  )
);
gulp.task(
  "start-mongo-users",
  runCommand(
    '"C:/Program Files/MongoDB/Server/6.0/bin/mongod.exe" --dbpath C:/ilmongousers'
  )
);
gulp.task("start-app", runCommand("nodemon app"));

gulp.task("jsaandcss", function () {
  watch("static/**/*.css", { ignoreInitial: false }, function () {
    css();
  });

  watch("static/**/*.js", { ignoreInitial: false }, function () {
    js();
  });
});

var defaultTaskSeries = [
  "start-mongo",
  "start-mongo-users" /*, 'start-app'/*, 'jsaandcss'*/,
];

// gulp.task('default', defaultTaskSeries);

gulp.task("default", gulp.series(...defaultTaskSeries));
gulp.task("build", function () {
  css();
  js();
});
