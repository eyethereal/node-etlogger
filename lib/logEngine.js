/*****
 * Copyright (c) 2017 Eyethereal, Inc.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom
 * the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
 * THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var vsprintf = require("./sprintf").vsprintf;

try {
    var utilInspect = require("util").inspect;
} catch (e) {
    // Ignore this
}

// Capture these as startup
var _realConsole = console;

// Take the methods we might call from it just in case they
// get replaced without replacing the console object itself
var _realClear = _realConsole.clear;
var _realCount = _realConsole.count;

function d2(out, num) {
    if (num < 10) {
        out.push("0");
    }
    out.push(num);
}

function d3(out, num) {
    if (num < 100) {
        out.push("0");
    }
    if (num < 10) {
        out.push("0");
    }
    out.push(num);
}


// Polyfill for toISOString
if (!Date.prototype.toISOString) {
    (function() {
        Date.prototype.toISOString = function() {
            var out = [];
            out.push(this.getUTCFullYear());
            out.push("-");
            d2(out, this.getUTCMonth() + 1);
            out.push("-");
            d2(out, this.getUTCDate());
            out.push("T");
            d2(out, this.getUTCHours());
            out.push(":");
            d2(out, this.getUTCMinutes());
            out.push(":");
            d2(out, this.getUTCSeconds());
            out.push(".");
            out.push((this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5));
            out.push("Z");
            return out.join("");
        };
    }());
}
////////

function normalTime(out, date) {
    d2(out, date.getHours());
    out.push(":");
    d2(out, date.getMinutes());
    out.push(":");
    d2(out, date.getSeconds());
    out.push(".");
    d3(out, date.getMilliseconds());
}

function flattenArg(arg) {
    if (typeof arg === "undefined") {
        return "";
    }

    if (typeof arg === "object" && !Array.isArray(arg)) {
        // Take it apart
        var out = [];
        Object.entries(arg).forEach(function(entry) {
            out.push(entry[0]);
            out.push("=");
            out.push(JSON.stringify(entry[1]));
            out.push(" ");
        });
        return out.join("");
    }

    // Er, whatever
    // console.error("arg = ", arg);
    return JSON.stringify(arg);
}

function getHeader() {
    var self = this;
    if (!self) {
        return "";
    }

    if (typeof self._header !== "undefined") {
        return self._header;
    }

    // Need to make the message
    var cfg = self.logger._config;

    var line = [];

    function maybeColor(color) {
        if (!cfg.useColor || !color) return;
        if (cfg[color]) {
            line.push(cfg[color]);
        }
    }

    self._newLineHeader = "";
    if (cfg.showPrefix || cfg.showTime || cfg.showLevel) {
        if (cfg.showPrefix) {
            maybeColor("colorPrefix");
            line.push(cfg.showPrefix);
            line.push(" ");
        }

        if (cfg.showTime) {
            maybeColor("colorTime");
            switch (cfg.timeFormat) {
            case "iso":
                line.push(self.date.toISOString());
                break;

            default:
                normalTime(line, self.date);
            }
            line.push(" ");
        }

        if (cfg.showLevel) {
            maybeColor(["colorError","colorWarn", "colorInfo", "colorDebug"][self.level]);

            var levelName = cfg.logLevelNames[self.level] || "UNKNOWN";
            var maxLength = cfg.maxLevelNameLength || 7;
            line.push(levelName.slice(0,maxLength));

            // Pad it to the right
            for (var p = levelName.length; p < maxLength; p += 1) {
                line.push(" ");
            }

            line.push(" ");
        }

        // Back to msg color
        maybeColor("colorMsg");

        // Store what we have so far in case we need it again
        self._newLineHeader = line.join("");

        line.push("| ");
    } else {
        // With no header we still need the message color potentially
        maybeColor("colorMsg");
    }

    self._header = line.join("");
    return self._header;
}

function getMessage() {
    var self = this;
    if (!self) {
        return "";
    }

    if (self._message) {
        // console.log("Returning cached message ", self._message);
        return self._message;
    }

    // Need to make the message
    var cfg = self.logger._config;

    var line = [];

    function maybeColor(color) {
        if (!cfg.useColor || !color) return;
        if (cfg[color]) {
            line.push(cfg[color]);
        }
    }

    // Generate the header first
    self.getHeader();

    // Now the actual message line

    // Only if we have args of course
    var text = "";

    if (self.args.length > 0) {
        if (typeof self.args[0] === "string" && self.args[0].indexOf("%") !== -1) {
            // If it looks like sprintf, then only do sprintf
            var fmt = self.args[0];
            var vals = self.args.slice(1);

            if (self._header) {
                fmt = self._header+fmt;
            }

            if (cfg.flattenLastArg && vals.length > 0 && !self.flatten) {
                var toFlatten = vals[vals.length-1];
                if (typeof toFlatten === "object") {
                    fmt += " %" + (vals.length + 1) + "$s";
                    vals.push(flattenArg(toFlatten));
                }
            }
            if (self.flatten) {
                fmt += " %" + (vals.length + 1) + "$s";
                vals.push(flattenArg(self.flatten));
            }
            text = vsprintf(fmt, vals);
        } else {
            // Old style of inspection
            var inspectOptions = cfg.inspectOptions || { depth: 10, colors: cfg.useColor };
            var buildText = [];
            if (self._header) {
                line.push(self._header);
            }

            for (var i = 0; i < self.args.length; i += 1) {
                var arg = self.args[i];

                if (typeof arg === "undefined") arg = "undefined";

                if (i === self.args.length - 1 && cfg.flattenLastArg && typeof arg === "object") {
                    // Flatten the arg instead of outputing it
                    if (i > 0) {
                        buildText.push(" ");
                    }
                    buildText.push(flattenArg(arg));
                } else {
                    // Output the arg normally
                    if (self.inspect && utilInspect) {
                        // TODO: Maybe have other inspection types?
                        if (typeof arg === "string") {
                            buildText.push(arg);
                        } else {
                            buildText.push(utilInspect(arg, inspectOptions));
                        }
                    } else {
                        if (arg === null) {
                            buildText.push("null");
                        } else {
                            buildText.push(arg.toString());
                        }
                    }
                }
            }

            if (self.flatten) {
                buildText.push(" ");
                buildText.push(flattenArg(self.flatten));
            }

            text = buildText.join("");
        }
    }

    // Let see if we need continuation headers or not
    if (cfg.newlines == "indent" && self._header && text.indexOf("\n") !== -1) {
        // Oh hey we do! We have the newlines!
        // console.log("header='", self._header, "' nlh='", self._newLineHeader,"'");
        if (self._newLineHeader) {
            // Nuke all the color codes
            var nlh = self._newLineHeader.replace(/\x1B\[.*?m/g,"");

            // Now nuke everything that isn't a space
            nlh = nlh.replace(/\S/g, " ");

            // And then add this back also
            nlh = "\n" + nlh + "| ";

            // Add the continuation header for newlines
            text = text.replace(/\n/g, nlh);
        }
    } else if (cfg.newlines == "space") {
        text = text.replace(/\n/g, " ");
    }

    if (text) {
        line.push(text);
    }
    maybeColor("colorReset");

    self._message = line.join("");
    return self._message;
}

// The things that handle the messages
var logHandlers = [];

function addLogHandler(logHandler) {
    logHandlers.push(logHandler);
}

function dispatchTo(handler, cfg, method, arg) {
    try {
        var fn = handler[method];
        if (!fn) {
            return;
        }

        var ret = handler[method](arg);
        if (ret && typeof Promise !== "undefined" && ret instanceof
            Promise) {
            // Can't really get out of this binding
            ret.catch(function promiseCatch(err) {
                if (handler && handler._config && handler._config.fallbackLog) {
                    handler._config.fallbackLog(err);
                }
                if (cfg.fallbackLog) {
                    cfg.fallbackLog(err);
                }
            });
        }
    } catch (e) {
        if (handler && handler._config && handler._config.fallbackLog) {
            handler._config.fallbackLog(e);
        }
        if (cfg.fallbackLog) {
            cfg.fallbackLog(e);
        }
    }
}

function dispatch(cfg, method, arg) {
    // Now just dispatch it. Right now we send it
    // to everyone. Fancier routing could be done, but
    // that's the sort of thing we generally don't want
    // to be doing with this library.
    for (let i = 0; i < logHandlers.length; i += 1) {
        dispatchTo(logHandlers[i], cfg, method, arg);
    }
}

///////////////////////////////////////////////////////////////////////////////
/**
 * The main logging function. All the other stuff really just sets values that
 * get passed into this function if possible.
 *
 * @param {Object} options - set of key value options
 *                  options.level - the level of the message, exports.DEBUG, exports.INFO, exports.WARN, or exports.ERROR
 *                  options.continuation - if set to true, this line is considered a continuation
 *                                         of the previous log message. In general this means it won't get it's
 *                                         own unique timestamp.
 *                  options.inspect - if true then the configured inspector will be used instead of the to_string method for each argument
 * @param {Object} other arguments - All other arguments are output to the log stream either
 *                                   using their to_string method or by calling an inspector on them
 * @type void
 */
function log(logMsg) {
    if (!logMsg) return;

    var cfg = logMsg.logger._config;

    var level = logMsg.level || logMsg.logger.LEVEL_INFO;
    if (cfg.logLevel < level) {
        return;
    }

    logMsg.date = new Date();

    // Attach this formatter thing in case one of the handlers
    // wants it. We don't format the message immediately in case
    // none of the handlers actually needs that work done.
    if (!logMsg.getMessage) {
        logMsg.getMessage = getMessage;
    }

    if (!logMsg.getHeader) {
        logMsg.getHeader = getHeader;
    }

    dispatch(cfg, "handleLog", logMsg);
}

function clear(logger) {
    var cfg = logger._config;
    dispatch(cfg, "handleClear");
}

function count(logger, name) {
    var cfg = logger._config;
    dispatch(cfg, "handleCount", name);
}

function countReset(logger, name) {
    var cfg = logger._config;
    dispatch(cfg, "handleCountReset", name);
}

function dir(logger, object) {
    var cfg = logger._config;
    dispatch(cfg, "handleDir", object);
}

function dirxml(logger, object) {
    var cfg = logger._config;
    dispatch(cfg, "handleDirxml", object);
}

function group(logger, label) {
    var cfg = logger._config;
    dispatch(cfg, "handleGroup", label);
}

function groupEnd(logger, label) {
    var cfg = logger._config;
    dispatch(cfg, "handleGroupEnd", label);
}

function profile(logger) {
    var cfg = logger._config;
    dispatch(cfg, "handleProfile");
}

function profileEnd(logger) {
    var cfg = logger._config;
    dispatch(cfg, "handleProfileEnd");
}

function time(logger, label) {
    var cfg = logger._config;
    dispatch(cfg, "handleTime", label);
}

function timeEnd(logger, label) {
    var cfg = logger._config;
    dispatch(cfg, "handleTimeEnd", label);
}

function timestamp(logger, label) {
    var cfg = logger._config;
    dispatch(cfg, "handleTimestamp", label);
}

module.exports = {
    addLogHandler: addLogHandler,

    log: log,

    clear: clear,
    count: count,
    countReset: countReset,
    dir: dir,
    dirxml: dirxml,
    group: group,
    groupEnd: groupEnd,
    profile: profile,
    profileEnd: profileEnd,
    time: time,
    timeEnd: timeEnd,
    timestamp: timestamp,
};
