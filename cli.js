var program = require('commander');
var fs = require('fs');
var Instrumenter = require('./instrumenter');

const PREFIX = "instrumented-";

program
  .version('0.0.1')
  .description('Instrument javascript code for coverage analysis with blanket.js')
  .usage('[options] [target ...]')
  .option('-R, --recursive', 'Instrument a directory recursively')
  .option('-s, --separate [dir]', 'Separate instrumented files in different subdir')
  .option('-d, --debug', 'Display time used for overall processing. If used in combination with --verbose it display time used for each file to instrument')
  .option('-v, --verbose', 'Display some information on the current status')
  .option('-q, --quiet', 'Surpress warnings and log output');

program.parse(process.argv);

process.on('exit', function(code) {
    var time = process.hrtime(global.startTime);
    if(program.debug) {
        console.log(time[0] + 's ' + time[1] + 'ns execution time');
    }
});

if (!program.args.length) {
    program.help();
} else {
    global.startTime = process.hrtime();
    program.args.forEach(function(target) {
        try {
            var stat = fs.statSync(target);
        } catch(error) {
            console.log('Omitting ' + target);
        }
        var instrumenter = new Instrumenter(PREFIX, program.verbose, program.quiet, program.debug)
        if(stat.isDirectory()) {
            instrumenter.instrumentDir(target, program.recursive);
        }
        if(stat.isFile()) {
            instrumenter.instrumentFile(target);
        }
    });
}

