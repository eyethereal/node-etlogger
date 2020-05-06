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

// console.log("logger.js import module=",module);

!function() {
    // console.log("Running logger.js first time module=",module);
    var logConfig = require("./logConfig");
    var logEngine = require("./logEngine");
    var LogStream = require("./logStream");
    var HandlerConsole = require("./handlerConsole");

    function Logger(name, initialConfig, singletonContext) {
        var self = this;

        self.isETLogger = true;

        // Expose this for the writable stream in particular
        self.engine = logEngine;

        // We do this here instead of on the prototype so that
        // these methods can be called without the context of
        // the logger object.
        function addMethod(name, level, inspect) {
            self[name] = function() {
                var args = Array.prototype.slice.apply(arguments);

                logEngine.log({
                    level: level,
                    inspect: inspect,
                    logger: self,
                    args: args,
                });
            }
        }

        // The core log function names
        addMethod("error", logConfig.LEVEL_ERROR, false);
        addMethod("warn", logConfig.LEVEL_WARN, false);
        addMethod("info", logConfig.LEVEL_INFO, false);
        addMethod("debug", logConfig.LEVEL_DEBUG, false);
        self.err = self.error;
        self.exception = self.error;
        self.warning = self.warn;
        self.log = self.info;

        // The inspect versions
        addMethod("errori", logConfig.LEVEL_ERROR, true);
        addMethod("warni", logConfig.LEVEL_WARN, true);
        addMethod("infoi", logConfig.LEVEL_INFO, true);
        addMethod("debugi", logConfig.LEVEL_DEBUG, true);
        self.erri = self.errori;
        self.exceptioni = self.errori;
        self.warningi = self.warni;
        self.logi = self.infoi;

        // The rest of the console api
        self.assert = function() {
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

        self.clear = function() {
            logEngine.clear();
        }

        self.count = function(name) {
            logEngine.count(name);
        }

        self.countReset = function(name) {
            logEngine.countReset(name);
        }

        self.dir = function(object) {
            logEngine.log({
                level: logConfig.LEVEL_DEBUG,
                dir: object,
                logger: self,
            });
        }

        self.dirxml = function(object) {
            logEngine.log({
                level: logConfig.LEVEL_DEBUG,
                dirxml: object,
                logger: self,
            });
        }

        self.group = function(label) {
            logEngine.group(label);
        }

        self.groupEnd = function() {
            logEngine.groupEnd();
        }

        // Non-standard!
        self.profile = function() {
            logEngine.profile();
        }

        // Non-standard!
        self.profileEnd = function() {
            logEngine.profileEnd();
        }

        self.time = function(label) {
            logEngine.time(label);
        }

        self.timeEnd = function(label) {
            logEngine.timeEnd(label);
        }

        // Non-standard!
        self.timestamp = function(label) {
            logEngine.timestamp(label);
        }

        self.trace = function() {
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
        self.getWriteStream = function(streamOpts) {
            return new LogStream(this, streamOpts);
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

        self.bindToWindow = function(opts) {
            if (typeof window === "undefined") return;

            window.console.warn("Before self._config=", self._config);
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
            window.console.warn("After1 self._config=", self._config);

            if (opts) {
                // Add any overrides
                self.configure(opts);
            }
            window.console.warn("After2 self._config=", self._config);

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

        // Export this for convenience
        logger.loggerFor = loggerFor;

        logger.handlerConsole = handlerConsole;

        return logger;
    }

    // Default console handler
    // Important to give it some initial args so we can mostly use
    // defaults from the logger object
    var handlerConsole = new HandlerConsole({
        fallbackLog: console.error,
    });
    logEngine.addLogHandler(handlerConsole);

    // console.log("logger.js creating DefaultLogger module=",module);

    var DefaultLogger = loggerFor();
    // Do this in a second step so we get the defaults for initial values
    DefaultLogger.configure({
        fallbackLog: console.error,
    });

    // Export for node
    if (typeof module !== 'undefined') {
        module.exports = DefaultLogger;
    }

    // Export for browsser
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

// console.log("logger.js first time module=",module);
