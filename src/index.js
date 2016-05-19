import gulpHelp from 'gulp-help';
import bundlify from './transforms/bundlify';
import gulpSeq from 'gulp-sequence';
import shell from 'gulp-shell';
import del from 'del';
import gulpSass from 'gulp-sass';
import eslint from 'gulp-eslint';
import eslintConfig from './config/eslintconfig';
import csslint from 'gulp-csslint';
import csslintConfig from './config/csslintconfig';
import finder from 'process-finder';

const paths = {
  src: {
    html: '/src/**/*.html',
    scripts: '/src/**/*.js',
    stylesheets: ['/src/**/*.css', '/src/**/*.scss', '/src/**/*.sass'],
  },
  html: '/src/*.html',
  scripts: '/src/*.js',
  stylesheets: ['/src/*.css', '/src/*.scss', '/src/*.sass'],
  dest: '',
};

export default function clearbuild(_gulp, basePath, { lintCss = false } = {}) {
  const gulp = gulpHelp(_gulp);
  const sequence = gulpSeq.use(gulp);
  
  // Executable Dev function to compile and watch for further file changes
  this.dev = () => {
    return sequence(
      ['lint:scripts', 'lint:stylesheets'],
      'build:stylesheets', 'build:scripts'
      'watch'
    )();
  };
  
  // Compile all relevant files but don't watch for further changes.
  this.compile = () => {
    return sequence(
      ['lint:scripts', 'lint:stylesheets'],
      'build:stylesheets', 'build:scripts'
    )();
  };

  gulp.task('default', 'Run the dev task.', ['dev']);

  // -- Live Development ----------
  gulp.task('dev', 'Build and preview your experiment.', this.dev);

  gulp.task('watch', 'Rebuild when experiment files change.', () => {
    gulp.watch(basePath + paths.src.html, ['build']);
    gulp.watch(basePath + paths.src.scripts, ['build']);
    gulp.watch(basePath + paths.src.stylesheets, ['build']);
    
    // Watch global
    gulp.watch(paths.src.html, ['build']);
    gulp.watch(paths.src.scripts, ['build']);
    gulp.watch(paths.src.stylesheets, ['build']);
  });

  // -- Build Experiment ----------
  gulp.task('build', 'Build experiment scripts and stylesheets.', () => {
    return sequence('lint', 'build:clean', 'build:stylesheets', 'build:scripts')();
  });

  gulp.task('build:clean', 'Clean build.', (cb) => {
    return del([basePath + paths.dest + '/*.js', basePath + paths.dest + '/*.css'], cb);
  });

  gulp.task('build:scripts', 'Transpile and browserify scripts.', ['build:scripts:global','build:scripts:variation']);
  
  gulp.task('build:scripts:global', () => {
    return gulp.src(paths.scripts)
      .pipe(bundlify())
      .pipe(gulp.dest(paths.dest));
  });
  
  gulp.task('build:scripts:variation', () => {
    return gulp.src(basePath + paths.scripts)
      .pipe(bundlify())
      .pipe(gulp.dest(basePath + paths.dest));
  });
  
  gulp.task('build:stylesheets', 'Compile stylesheets.', ['build:stylesheets:global','build:stylesheets:variation']);

  gulp.task('build:stylesheets:global', 'Compile stylesheets.', () => {
    return gulp.src(paths.stylesheets)
      .pipe(gulpSass({ sourceMapEmbed: false }).on('error', gulpSass.logError))
      .pipe(gulp.dest(paths.dest));
  });

  gulp.task('build:stylesheets:variation', 'Compile stylesheets.', () => {
    return gulp.src(basePath + paths.stylesheets)
      .pipe(gulpSass({ sourceMapEmbed: false }).on('error', gulpSass.logError))
      .pipe(gulp.dest(basePath + paths.dest));
  });

  // -- Lint Experiment ----------
  gulp.task('lint',
    'Lint scripts and stylesheets',
    ['lint:scripts', 'lint:stylesheets']
  );

  gulp.task('lint:scripts', 'Lint scripts.', () => {
    return gulp.src(basePath + paths.scripts)
      .pipe(eslint(eslintConfig))
      .pipe(eslint.format());
  });

  gulp.task('lint:stylesheets', 'Compile and lint stylesheets.', () => {
    const task = gulp.src(basePath + paths.stylesheets)
      .pipe(gulpSass({ sourceMapEmbed: false }).on('error', gulpSass.logError))
      .pipe(csslint(csslintConfig));
    if (lintCss) {
      task.pipe(csslint.reporter());
    }
  });
}
