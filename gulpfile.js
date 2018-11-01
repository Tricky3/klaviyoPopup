var gulp = require('gulp');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var del = require('del');

// identify shopify assets
const ASSETS = './assets/';
const JS_SCRIPTS = [`${ASSETS}*.js`, `!${ASSETS}*.min.js`];

// gulp plumber error handler
const onError = (err) => {
  console.log(err);
}

const scripts = () => {
  return gulp.src(JS_SCRIPTS)
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(rename(function(script){
      script.extname = '.min.js';
      console.log(script);
      return script;
    }))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest(ASSETS))
    .pipe(concat('tricky3.klaviyo.pack.min.js'))
    .pipe(gulp.dest(ASSETS));
}

const watcher = () => {
  const tasks = ['scripts'];
  gulp.watch([ASSETS, JS_SCRIPTS], gulp.parallel(tasks));
}

exports.scripts = scripts;
exports.default = gulp.parallel(watcher);

