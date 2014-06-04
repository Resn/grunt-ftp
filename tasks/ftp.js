'use strict';
var path = require('path');
var async = require('async');
var chalk = require('chalk');
var JSFtp = require('jsftp');

JSFtp = require('jsftp-mkdirp')(JSFtp);

module.exports = function (grunt) {
	grunt.registerMultiTask('ftp', 'Upload files to an FTP-server', function () {
		var done = this.async();
		var options = this.options();
		var fileCount = 0;
		var threads = 4;

		if (options.host === undefined) {
			throw new Error('`host` required.');
		}

		async.eachLimit(this.files, threads,function (el,next) {
			// have to create a new connection for each file otherwise they conflict
			var ftp = new JSFtp(options);
			var finalRemotePath = el.dest;

			ftp.mkdirp(path.dirname(finalRemotePath), function (err) {
				if (err) {
					return next(err);
				}

				var buffer = grunt.file.read(el.src[0], {encoding: null});

				ftp.put(buffer, finalRemotePath, function (err) {
					if (err) {
						return next(err);
					}

					fileCount++;
					ftp.raw.quit();
					next();
				});
			});
		}, function (err) {
			if (err) {
				return grunt.warn(err);
			}

			if (fileCount > 0) {
				grunt.log.writeln(chalk.green(fileCount, fileCount === 1 ? 'file' : 'files', 'uploaded successfully'));
			} else {
				grunt.log.writeln(chalk.yellow('No files uploaded'));
			}

			done();
		});
	});
};
