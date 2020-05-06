
try {
    var stream = require("stream");

    module.exports = function(logger, streamOpts) {
        var defOpts = streamOpts || {};

        var level = defOpts.level || logger.LEVEL_INFO;
        var inspect = defOpts.inspect || false;

        return new stream.Writable({
            decodeStrings: false,
            objectMode: true,
            write: function(chunk, encoding, callback) {

                var text = chunk || "";
                if (typeof text !== "string") {
                    // Specify encoding because it is _probably_
                    // a buffer
                    text = text.toString("utf8");
                }

                logger.logEngine.log({
                    level: level,
                    logger: logger,
                    args: [text],
                    inspect: inspect,
                });

                if (typeof callback === "function") {
                    callback();
                }
            },
        });
    }
} catch (e) {
    module.exports = function(streamOpts) {
        return {
            on: function() { },
            write: function() { },
            end: function() { },
            cork: function() { },
            uncork: function() { },
            setDefaultEncoding: function() { },
        }
    }
}
