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

!function() {
    // console.log("Running logger.js first time module=",module);
    var logConfig = require("./logConfig");
    var logEngine = require("./logEngine");
    var LogStream = require("./logStream");
    var ConsoleHandler = require("./ConsoleHandler");

    function Logger(name, initialConfig, singletonContext) {
        const self = this;

        self.isETLogger = true;

        // Expose this for the writable stream in particular
        self.engine = logEngine;

        // We do this here instead of on the prototype so that
        // these methods can be called without the context of
        // the logger object.
        function addMethod(name, level, inspect) {
            self[name] = function() {
                const args = Array.prototype.slice.apply(arguments);

                logEngine.log({
                    level: level,
                    inspect: inspect,
                    logger: self,
                    args: args,
                });
            }
            Object.defineProperty(self[name], "name", {
                value: name,
                configurable: true,
            });
        }

        // The core log function names
        const keys = Object.keys(logConfig.NAMES_TO_LEVELS);
        for(let i = 0; i < keys.length; i += 1) {
            if (!keys[i]) continue; // Because there is a default entry for ""
            addMethod(keys[i], logConfig.NAMES_TO_LEVELS[keys[i]], false);
            addMethod(keys[i]+"i", logConfig.NAMES_TO_LEVELS[keys[i]], true);
        }

        // The rest of the console api
        self.assert = function assert() {
            var args = Array.prototype.slice.apply(arguments);

            if (!args[0]) {
                logEngine.log({
                    level: logConfig.LEVEL_INFO,
                    inspect: false,
                    logger: self,
                    args: args,
                });
            }
        }

        self.clear = function clear() {
            logEngine.clear(self);
        }

        self.count = function count(name) {
            logEngine.count(self, name);
        }

        self.countReset = function countReset(name) {
            logEngine.countReset(self, name);
        }

        self.dir = function dir(object) {
            logEngine.dir(self, object);
        }

        self.dirxml = function dirxml(object) {
            logEngine.dirxml(self, object);
        }

        self.group = function group(label) {
            logEngine.group(self, label);
        }

        self.groupEnd = function groupEnd() {
            logEngine.groupEnd(self);
        }

        // Non-standard!
        self.profile = function profile() {
            logEngine.profile(self);
        }

        // Non-standard!
        self.profileEnd = function profileEnd() {
            logEngine.profileEnd(self);
        }

        self.time = function time(label) {
            logEngine.time(label);
        }

        self.timeEnd = function timeEnd(label) {
            logEngine.timeEnd(label);
        }

        // Non-standard!
        self.timestamp = function timestamp(label) {
            logEngine.timestamp(label);
        }

        self.trace = function trace() {
            var args = Array.prototype.slice.apply(arguments);

            // Get an exception object
            var ex = (function() {
                try {
                    var _err = __undef__ << 1;
                } catch (e) {
                    return e;
                }
            })();

            var stack = ex.stack;
            if (stack) {
                // Take the string apart and rip of the top 3 lines
                var lines = stack.split("\n");

                if (lines.length > 3) {
                    stack = "\n" + lines.slice(3,lines.length).join("\n");
                }
            }
            args.push(stack);

            logEngine.log({
                level: logConfig.LEVEL_WARN,
                inspect: false,
                logger: self,
                args: args,
                trace: stack,
            });
        }

        //////////
        // Our non-standard enhancements

        /**
         * This exposes an ability to integrate deeply with the logging
         * infrastructure bypassing the limits of the standard interface.
         * In particular it is useful to pass in a `flatten` parameter
         * which will be flattened at the end of the produced log
         * message without turning on flattening for the entire
         * logger which can be incompatible with environments that
         * don't expect that behavior.
         *
         * A pretty standard use might be something like:
         *
         *      Log.msg({level:"debug", args:["An object %o", obj], flatten:{ index, file, offset } });
         *
         * Modifications this will perform on the msgIn object are
         * to replace string levels with numeric ones and add the
         * logger entry set to self, but otherwise everything else could
         * be changed including setting custom getMessage and getHeader
         * fields to totally override the default formatters.
         */
        self.msg = function msg(msgIn) {
            var msg = Object.assign({}, msgIn);
            if (typeof msg.level === "string") {
                msg.level = logConfig.NAMES_TO_LEVELS[msg.level];
            }
            if (!msg.level) {
                msg.level = logConfig.LEVEL_INFO;
            }

            // If there is literally no args array the flattening code won't
            // get executed, so we synthetically generate an empty log message
            // for the caller.
            if (!msg.args && msg.flatten) {
                msg.args = [""];
            }

            msg.logger = self;
            logEngine.log(msg);
        }

        self.getWriteStream = function getWriteStream(streamOpts) {
            return new LogStream(this, streamOpts);
        }

        self.hr = function hr(opts) {
            if (typeof opts === "number") {
                opts = {
                    level: opts,
                };
            } else if (typeof opts === "string") {
                opts = {
                    level: logConfig.NAMES_TO_LEVELS[opts],
                };
            } else if (typeof opts !== "object") {
                opts = {};
            }

            if (!opts.level) {
                opts.level = logConfig.LEVEL_INFO;
            }

            if (!opts.width) {
                opts.width = self._config.hrWidth || 80;
            }
            if (!opts.char) {
                opts.char = self._config.hrChar || "-";
            }

            var text = [];
            for( let i = 0; i < opts.width; i += 1) {
                text.push(opts.char);
            }

            var msg = {
                logger: self,
                level: opts.level,
                args: [text.join("")],
            }

            // self.errori(msg);
            logEngine.log(msg);
        }

        // self.installOn = function(target) {
        //     if (!target) return;
        //
        //     const fallbackLog = target.warn;
        //     self.configure({
        //         fallbackLog,
        //     });
        //     // [ "log", "error", "warn", "info", "debug", "assert"
        //     [ "debug",
        //     ].forEach(name => {
        //         // fallbackLog("Installing on ", name, " which is ", target[name]);
        //         const firstFn = target[name];
        //         // const fn = (...args) => {
        //         //     fallbackLog("firstFn ", firstFn);
        //         //     fallbackLog("In fn ", name, args);
        //         //
        //         //     firstFn.apply(target, args);
        //         // };
        //         // fallbackLog("fn = ", fn);
        //
        //         const newFn = firstFn.bind(target, `Called (${name})`);
        //         // fallbackLog(newFn);
        //         target[name] = newFn;
        //         //
        //         // newFn("Hello");
        //     });
        //
        //     // target._etLoggerInstalled = true;
        // }

        self.bindToWindow = function bindToWindow(opts) {
            if (typeof window === "undefined") return;

            if (!opts || !opts.disableAutoReconfig) {
                // Some sane defaults for window logging
                self.configure({
                    fallbackLog: window.console.error,
                    useColor: false,
                    showTime: true,
                    showLevel: true,

                    nativeConsoleLevels: true,
                    nativeConsoleArgs: true,

                    flattenLastArg: false,
                });
            }

            if (opts) {
                // Add any overrides
                self.configure(opts);
            }

            // Become the global console
            window.console = self;

            // Be the error handler
            // const oldOnError = window.onerror;
            const errHandler = (event) => {
                self.error("Uncaught Error: ", event);

                // Prevent default behavior
                return true;
            };

            // window.onerror = (message, source, lineno, colno, error) => {
            //     return errHandler({ message, source, lineno, colno, error, handler: "onerror" });
            // }

            window.addEventListener('error', (evt) => {
                evt.handler = "error event listener";
                evt.preventDefault();
                return errHandler(evt);
            });

            self.debug("Attached to window logging");
        }
    }

    ////////////////////////////////////////////

    var defContext = {};

    // Default console handler
    // Important to give it some initial args so we can mostly use
    // defaults from the logger object
    const consoleHandler = new ConsoleHandler({
        fallbackLog: console.error,
    });
    logEngine.addLogHandler(consoleHandler);

    function loggerFor(name, initialConfig, singletonContext) {

        // We allow the people asking for log instances to define
        // a common singleton context if they don't want to use
        // this module. This is in support of multi-package use,
        // although generally it's probably easier to pass in
        // a logger to the sub packages in some way.
        var sContext = singletonContext || defContext;

        if (!sContext._loggersByName) {
            sContext._loggersByName = {};
        }
        // All loggers are singletons
        var n = name || "default";
        if (sContext._loggersByName[n]) {
            return sContext._loggersByName[n];
        }

        // Making a new logger
        var logger = new Logger();
        sContext._loggersByName[n] = logger;

        logger._name = n;
        logConfig(logger, initialConfig);

        // Export these for convenience so anywhere you have a Log
        // instance you can grab a new logger
        logger.loggerFor = loggerFor;
        logger.defaultConsoleHandler = consoleHandler;

        // Gotta be able to add logger handlers!
        logger.addLogHandler = logEngine.addLogHandler;

        return logger;
    }

    // console.log("logger.js creating DefaultLogger module=",module);

    const DefaultLogger = loggerFor();
    // Do this in a second step so we get the defaults for initial values
    DefaultLogger.configure({
        fallbackLog: console.error,
    });

    // Export for node
    if (typeof module !== 'undefined') {
        module.exports = DefaultLogger;
    }

    // Export for browser
    if (typeof window !== 'undefined') {
        window['Log'] = DefaultLogger;

        if (typeof define === 'function' && define['amd']) {
            define(function() {
                return {
                    'Log': DefaultLogger,
                }
            })
        }
    }
}();
