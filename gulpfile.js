const gulp      = require('gulp');
const clean     = require('gulp-clean');
const es        = require('event-stream');
const zip       = require('gulp-zip');
const gutil     = require('gulp-util');
const bump      = require('gulp-bump');
const crx3      = require('crx3');
const fs        = require('fs');

var chrome      = require('./vendor/chrome/manifest');
var firefox     = require('./vendor/firefox/manifest');

gulp.task('clean', function() {
  if (!fs.existsSync('./build')) {
    gutil.log('Build directory does not exist, creating...');
    fs.mkdirSync('./build');
  }
  return pipe('./build', [clean()]);
});

gulp.task('chrome', done => {
  if (!fs.existsSync('./build')) {
    gutil.log('Build directory does not exist, creating...');
    fs.mkdirSync('./build');
  }
  if (!fs.existsSync('./build/chrome')) {
    gutil.log('chrome directory does not exist, creating...');
    fs.mkdirSync('./build/chrome');
  }
  es.merge(
    pipe('./libs/**/*', './build/chrome/libs'),
    pipe('./img/**/*', './build/chrome/img'),
    pipe('./js/**/*', './build/chrome/js'),
    pipe('./css/**/*', './build/chrome/css'),
    pipe('./vendor/chrome/manifest.json', './build/chrome/')
  );
  done();
});

gulp.task('firefox', done => {
  if (!fs.existsSync('./build')) {
    gutil.log('Build directory does not exist, creating...');
    fs.mkdirSync('./build');
  }
  if (!fs.existsSync('./build/firefox')) {
    gutil.log('Firefox directory does not exist, creating...');
    fs.mkdirSync('./build/firefox');
  }
  es.merge(
    pipe('./libs/**/*', './build/firefox/libs'),
    pipe('./img/**/*', './build/firefox/img'),
    pipe('./js/**/*', './build/firefox/js'),
    pipe('./css/**/*', './build/firefox/css'),
    pipe('./vendor/firefox/manifest.json', './build/firefox/')
  );
  done();
});

gulp.task('build', gulp.series('clean', 'chrome', 'firefox'));

gulp.task('watch', function() {
  gulp.series('build');
  gulp.watch(['./js/**/*', './css/**/*', './vendor/**/*', './img/**/*'], gulp.series('build'));
});

gulp.task('chrome-dist', done => {
  crx3(['build/chrome/manifest.json'], {
        crxPath: 'dist/chrome/' + chrome.name + '-' + chrome.version + '.crx',
        keyPath: 'tools/key'
      });

  done();
});

gulp.task('firefox-dist', done => {
  gulp.src('./build/firefox/**/*')
    .pipe(zip(firefox.name + '-' + firefox.version + '.xpi'))
    .pipe(gulp.dest('./dist/firefox'));

  done();
});

gulp.task('bump-version', function() {
  return gulp.src(['vendor/chrome/manifest.json', 'vendor/firefox/manifest.json'])
    .pipe(bump({type:'patch'}))
    .pipe(gulp.dest(function(file) {
      return file.base;
    }));
});

gulp.task('dist', gulp.parallel('chrome-dist', 'firefox-dist', 'bump-version'));


function pipe(src, transforms, dest) {
  if (typeof transforms === 'string') {
    dest = transforms;
    transforms = null;
  }

  var stream = gulp.src(src);
  transforms && transforms.forEach(function(transform) {
    stream = stream.pipe(transform);
  });

  if (dest) {
    stream = stream.pipe(gulp.dest(dest));
  }

  return stream;
}
