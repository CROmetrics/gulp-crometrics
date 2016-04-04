#!/usr/bin/env node
'use strict';

var rimraf = require('rimraf');

rimraf('./lib/*', function() {
});