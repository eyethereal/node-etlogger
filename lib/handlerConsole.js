
var logConfig = require("./logConfig");

function HandlerConsole(opts) {
    const self = this;

    logConfig(self, opts);

    function optVal(logMsg, name) {
        if (self._config[name]) return self._config[name];
        return logMsg.logger._config[name];
    }
    // Grab the current values of console in case it gets stolen
    self._realConsole = console;

    self._realError = self._realConsole.error;
    self._realWarn = self._realConsole.warn;
    self._realInfo = self._realConsole.info;
    self._realDebug = self._realConsole.debug;

    self.disabled = false;

    self.handleLog = function handleLog(logMsg) {
        if (self.disabled) return;
        if (!self._realConsole) return;

        if (self._realConsole.isETLogger) {
            const fallbackLog = optVal(logMsg, "fallbackLog");
            if (fallbackLog) {
                fallbackLog("Log loop detected. _realConsole is an instance of ETLogger. Refusing to send logs to what is probably myself");
            }
            return;
        }

        var logFn = null;

        if (optVal(logMsg, "nativeConsoleLevels")) {
            // console.log("using nativeConsoleLevels");
            switch(logMsg.level) {
            case logConfig.LEVEL_ERROR:
                logFn = self._realError;
                break;

            case logConfig.LEVEL_WARN:
                logFn = self._realWarn;
                break;

            case logConfig.LEVEL_DEBUG:
                logFn = self._realDebug;
                break;
            }
        }

        // Just in case that isn't actually defined
        if (!logFn) logFn = self._realInfo;
        if (!logFn) return;

        // console.log("logFn = ", logFn);
        if (optVal(logMsg, "nativeConsoleArgs")) {
            // console.log("native args");
            const ar = logMsg.args.slice(0);
            const header = logMsg.getHeader();
            if (header) {
                ar.unshift(header);
            }
            logFn.apply(self._realConsole, ar);
        } else {
            // console.log(logMsg);
            const msg = logMsg.getMessage();
            logFn.call(self._realConsole, msg);
        }
    }
}

module.exports = HandlerConsole;
