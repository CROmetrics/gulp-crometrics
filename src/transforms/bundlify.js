import babel from 'babel-core';
import babelify from 'babelify';
import browserify from 'browserify';
import sassify from 'sassify';
import stringify from 'stringify';
import through2 from 'through2';
import optimizelify from './optimizelify';
import commentRegex from 'comment-regex';
import path from 'path';

const browserifyConfig = {
  paths: [
    path.resolve(__dirname,'../../node_modules'),
    path.resolve(__dirname,'../../../../node_modules')
  ]
}

const babelifyConfig = {
  presets: [require('babel-preset-es2015')]
}

function bundlify() {
  return through2.obj((file, enc, next) => {
    // get string of buffer contents
    const contents = file.contents.toString();

    browserify(file.path, browserifyConfig)
      .transform(babelify.configure(babelifyConfig))
      .transform(stringify(['.html']))
      .transform(sassify, { sourceMapEmbed: false })
      .bundle((err, buf) => {
        if (err) console.error(err.toString());
        else {
          const result = buf.toString();
          const transformed = optimizelify(result);
          file.contents = new Buffer(transformed);
        }
        next(null, file);
      });
  });
}

export default bundlify;
