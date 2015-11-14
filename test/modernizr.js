'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var assert = require('yeoman-assert');

describe('modernizr', function () {
  before(function (done) {
    helpers.run(path.join(__dirname, '../app'))
      .inDir(path.join(__dirname, '.tmp'))
      .withOptions({'skip-install': true})
      .withPrompts({features: [
        'includeModernizr'
      ]})
      .on('end', done);
  });

  it('adds the Bower dependency', function () {
    assert.fileContent('bower.json', 'modernizr');
  });

  it('adds the Grunt plugin', function () {
    assert.fileContent('package.json', 'modernizr');
  });

  it('adds the Grunt task', function () {
    assert.fileContent('Gruntfile.js', 'modernizr');
  });

  it('adds the HTML description', function () {
    assert.fileContent('app/index.html', 'Modernizr');
  });
});
