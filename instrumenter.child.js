Error.stackTraceLimit = Infinity;

var fs = require('fs');
var path = require('path');
var blkt = require('blanket')({
    'data-cover-customVariable': 'window._$blanket'
});

var prefix;

process.on("message", function (msg) {
    if (msg.message === "doThisWork") {
        prefix = msg.args.prefix;
        instrumentFile(msg.args.file);

        process.send("giveMeMoreWork");
    }
});

process.send("giveMeWork");

function blanketInitializer(target, fileContent, done) {
    blkt.instrument({
        inputFile: fileContent,
        inputFileName: path.basename(target)
    }, done);
}

function send(msg) {
    process.send(msg);
}

function isInstrumentedFile(target) {
    return (path.basename(target).indexOf(prefix) == 0); 
}

function isAlreadyInstrumentedFile(target) {
    return (fs.existsSync(path.join(path.dirname(target), prefix + path.basename(target)))); 
}

function instrumentFile(target) {
    if (isAlreadyInstrumentedFile(target) || isInstrumentedFile(target)) {
        send({
            state: "skipped",
            file: target
        });
        return;
    }

    var startTime = process.hrtime();
    blkt.restoreBlanketLoader();
    try {
        fileContent = fs.readFileSync(target, 'utf-8');
        blanketInitializer(target, fileContent, function(instrumentedCode) {
            dir = path.dirname(target);
            newFileName = prefix + path.basename(target);
       
            fs.writeFileSync(path.join(dir, newFileName), instrumentedCode);
            var endTime = process.hrtime(startTime);

            send({
                state: "success",
                file: target,
                duration: endTime
            });
        });
    } catch (err) {
        send({
            state: "failure",
            file: target,
            error: err.toString()
        });
    }
}
