'use strict';
var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var wiredep = require('wiredep');
var mkdirp = require('mkdirp');
var _s = require('underscore.string');

module.exports = generators.Base.extend({
  constructor: function () {
    var testLocal;

    generators.Base.apply(this, arguments);

    this.option('skip-welcome-message', {
      desc: 'Skips the welcome message',
      type: Boolean
    });

    this.option('skip-install-message', {
      desc: 'Skips the message after the installation of dependencies',
      type: Boolean
    });

    // setup the test-framework property, Gruntfile template will need this
    this.option('test-framework', {
      desc: 'Test framework to be invoked',
      type: String,
      defaults: 'mocha'
    });

    this.option('babel', {
      desc: 'Use Babel',
      type: Boolean,
      defaults: true
    });

    if (this.options['test-framework'] === 'mocha') {
      testLocal = require.resolve('generator-mocha/generators/app/index.js');
    } else if (this.options['test-framework'] === 'jasmine') {
      testLocal = require.resolve('generator-jasmine/generators/app/index.js');
    }

    this.composeWith(this.options['test-framework'] + ':app', {
      options: {
        'skip-install': this.options['skip-install']
      }
    }, {
      local: testLocal
    });
  },

  initializing: function () {
    this.pkg = require('../package.json');
  },

  askFor: function () {
    var done = this.async();

    if (!this.options['skip-welcome-message']) {
      this.log(yosay('\'Allo \'allo! Out of the box I include Bootstrap 4, jQuery, and a Gruntfile to build your app.'));
    }

    var prompts = [{
      type: 'checkbox',
      name: 'features',
      message: 'What more would you like?',
      choices: [{
        name: 'Font Awesome',
        value: 'includeFontAwesome',
        checked: false
      }, {
        name: 'Octicons',
        value: 'includeOcticons',
        checked: false          
      }]
    }, {
      type: 'confirm',
      name: 'enableFlexbox',
      message: 'Would you like to enable flexbox (reduced browser and device support)?',
      default: false
    }];
    
    this.prompt(prompts, function (answers) {
      var features = answers.features;

      function hasFeature(feat) {
        return features && features.indexOf(feat) !== -1;
      }

      this.includeSass = true; //hasFeature('includeSass');
      this.includeBootstrap = true; //hasFeature('includeBootstrap');
      this.includeModernizr = false; //hasFeature('includeModernizr');
      this.includeFontAwesome = hasFeature('includeFontAwesome');
      this.includeOcticons = hasFeature('includeOcticons');
      this.enableFlexbox = answers.enableFlexbox;

      done();
    }.bind(this));
  },

  writing: {
    gruntfile: function () {
      this.fs.copyTpl(
        this.templatePath('Gruntfile.js'),
        this.destinationPath('Gruntfile.js'),
        {
          pkg: this.pkg,
          includeSass: this.includeSass,
          includeBootstrap: this.includeBootstrap,
          testFramework: this.options['test-framework'],
          useBabel: this.options['babel']
        }
      );
    },

    packageJSON: function () {
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('package.json'),
        {
          includeSass: this.includeSass,
          enableFlexbox: this.enableFlexbox,
          includeJQuery: this.includeBootstrap || this.includeJQuery,
          includeFontAwesome: this.includeFontAwesome,
          includeOcticons: this.includeOcticons,
          testFramework: this.options['test-framework'],
          useBabel: this.options['babel']
        }
      )
    },

    git: function () {
      this.fs.copy(
        this.templatePath('gitignore'),
        this.destinationPath('.gitignore')
      );

      this.fs.copy(
        this.templatePath('gitattributes'),
        this.destinationPath('.gitattributes')
      );
    },

    bower: function () {
      var bowerJson = {
        name: _s.slugify(this.appname),
        private: true,
        dependencies: {}
      };

      if (this.includeBootstrap) {
        bowerJson.dependencies['bootstrap'] = 'https://github.com/twbs/bootstrap.git#v4-dev';
        bowerJson.dependencies['jquery'] = '~2.1.4';
      } 

      if (this.includeFontAwesome) {
        bowerJson.dependencies['components-font-awesome'] = '~4.4';
      }
      if (this.includeOcticons) {
        bowerJson.dependencies['octicons'] = '~3.3.0';
        bowerJson.overrides = {
            'octicons': {
              'main': [
                'octicons/octicons.scss'
              ]
            }
        };   
      }

      this.fs.writeJSON('bower.json', bowerJson);
      this.fs.copy(
        this.templatePath('bowerrc'),
        this.destinationPath('.bowerrc')
      );
    },

    editorConfig: function () {
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );
    },

    scripts: function () {
      this.fs.copy(
        this.templatePath('main.js'),
        this.destinationPath('app/scripts/main.js')
      );
    },

    styles: function () {
      var stylesheet;

      if (this.includeSass) {
        stylesheet = 'main.scss';
      } else {
        stylesheet = 'main.css';
      }

      this.fs.copyTpl(
        this.templatePath(stylesheet),
        this.destinationPath('app/styles/' + stylesheet),
        {
          includeBootstrap: this.includeBootstrap,
          includeFontAwesome: this.includeFontAwesome,
          includeOcticons: this.includeOcticons,
          enableFlexbox: this.enableFlexbox
        }
      )
    },

    html: function () {
      var bsPath;

      // path prefix for Bootstrap JS files
      bsPath = '/bower_components/bootstrap/js/dist/';
        
      this.fs.copyTpl(
        this.templatePath('index.html'),
        this.destinationPath('app/index.html'),
        {
          appname: this.appname,
          includeSass: this.includeSass,
          includeBootstrap: this.includeBootstrap,
          includeFontAwesome: this.includeFontAwesome,
          includeOcticons: this.includeOcticons,
          enableFlexbox: this.enableFlexbox,
          bsPath: bsPath,
          bsPlugins: [
            'alert',
            'button',
            'carousel',
            'collapse',
            'dropdown',
            'modal',
            'scrollspy',
            'tab',
            'tooltip',
            'popover',
            'util'
          ]
        }
      );
    },

    icons: function () {
      this.fs.copy(
        this.templatePath('favicon.ico'),
        this.destinationPath('app/favicon.ico')
      );

      this.fs.copy(
        this.templatePath('apple-touch-icon.png'),
        this.destinationPath('app/apple-touch-icon.png')
      );
    },

    robots: function () {
      this.fs.copy(
        this.templatePath('robots.txt'),
        this.destinationPath('app/robots.txt')
      );
    },

    misc: function () {
      mkdirp('app/images');
      mkdirp('app/fonts');
    }
  },

  install: function () {
    this.installDependencies({
      skipInstall: this.options['skip-install'],
      skipMessage: this.options['skip-install-message']
    });
  },

  end: function () {
    var bowerJson = this.fs.readJSON(this.destinationPath('bower.json'));
    var howToInstall =
      '\nAfter running ' +
      chalk.yellow.bold('npm install & bower install') +
      ', inject your' +
      '\nfront end dependencies by running ' +
      chalk.yellow.bold('grunt wiredep') +
      '.';

    if (this.options['skip-install']) {
      this.log(howToInstall);
      return;
    }

    // wire Bower packages to .html
    wiredep({
      bowerJson: bowerJson,
      src: 'app/index.html',
      exclude: ['bootstrap.js'],
      ignorePath: /^(\.\.\/)*\.\./
    });

    if (this.includeSass) {
      // wire Bower packages to .scss
      wiredep({
        bowerJson: bowerJson,
        src: 'app/styles/*.scss',
        ignorePath: /^(\.\.\/)+/
      });
    }
  }
});
