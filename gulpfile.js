var gulp = require('gulp');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var del = require('del');

// gulp plumber error handler
var onError = function(err){
  console.log(err);
}

// identify Shopify assets
var assets = './assets/'
var jsScripts = [assets + '*.js', '!' + assets + '*.min.js'];

// uglify custom scripts
gulp.task('scripts', function(){
  return gulp.src(jsScripts)
  .pipe(plumber({
    errorHandler:onError
  }))
  .pipe(rename(function(script) {
    script.extname = '.min.js';
    return script;
  }))
  .pipe(stripDebug())
  .pipe(uglify())
  .pipe(gulp.dest(assets))
  .pipe(concat('tricky3.klaviyo.pack.min.js'))
  .pipe(gulp.dest(assets));
});

// Watch
gulp.task('watch', function(){
	var tasks = ['scripts'];
	gulp.watch([assets,jsScripts], tasks);
});

gulp.task('default', ['watch']);