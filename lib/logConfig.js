

function configure(options) {
    if (!options) {
        return;
    }

    let config = this._config;
    if (!config) {
        config = {};
        this._config = config;
    }

    function setIfDef(key) {
        if (typeof options[key] !== "undefined") {
            config[key] = options[key];
        }
    }

    setIfDef("fallbackLog");
    setIfDef("logLevel");
    setIfDef("useColor");
    setIfDef("showTime");
    setIfDef("showLevel");
    setIfDef("showPrefix");

    setIfDef("timeFormat");

    setIfDef("colorPrefix");
    setIfDef("colorTime");
    setIfDef("colorError");
    setIfDef("colorWarn");
    setIfDef("colorInfo");
    setIfDef("colorDebug");
    setIfDef("colorMsg");
    setIfDef("colorReset");

    setIfDef("newlines");
    setIfDef("nativeConsoleLevels");
    setIfDef("nativeConsoleArgs");

    setIfDef("flattenLastArg")

    setIfDef("hrWidth");
    setIfDef("hrChar");

    if (typeof options.logLevelNames !== "undefined") {
        config.logLevelNames = options.logLevelNames.split(",");
        config.maxLevelNameLength = 0;
        for (let i = 0; i < config.logLevelNames.length; i += 1) {
            config.maxLevelNameLength = Math.max(config.maxLevelNameLength, config.logLevelNames[i].length);
        }
    }

    if (typeof options.inspectOptions === "object") {
        config.inspectOptions = options.inspectOptions;
    }
    if (typeof options.inspectOptions === "string") {
        config.inspectOptions = JSON.parse(options.inspectOptions);
    }
}

/**
 * Parses a text string and returns a console color string.
 *
 * The name spec is a comma separated list of the following tokens.
 * If it is an empty string then the default foreground and background
 * colors are returned
 *
 *      black, red, green, yellow, blue, magenta, cyan, white - foreground color
 *      bblack, bred, bgreen, byelloe, bblue, bmagenta, bcyan, bwhite - background color
 *
 *      default - default foreground, will be set if other foreground not specified
 *      bdefault - default background, will be set if other background not specified
 *
 *      bright - bright intensity
 *      dull - normal intensity, will be set if bright is not specified
 *
 *      The following do not commonly work very well so the "off" versions
 *      are not automatically added when the on version is not included. This
 *      means that if you use these be sure to include the off versions or
 *      you will likely end up with styles bleeding through where you don't
 *      want them to.
 *
 *      italic, italicoff - italics on / off
 *      underline, underlineoff - underline on / off
 *      blink, blinkoff - blink on / off
 *
 *      framed, circled, framedcircledoff - Frame or circle the text
 *      overlined, overlinedoff - overline on / off
 *
 * @param name
 */
function color(name) {
    if (!name) {
        name = "";
    }

    const parts = name.split(",");
    const out = [];
    let hasForeground = false;
    let hasBackground = false;
    for (let i = 0; i < parts.length; i += 1) {
        const code = COLOR_TOKENS[parts[i]];
        if (code) {
            out.push(code);
            if (code >= 30 && code <= 39) {
                hasForeground = true;
            }
            if (code >= 40 && code <= 49) {
                hasBackground = true;
            }
        }
    }
    if (!hasForeground) {
        out.push(COLOR_TOKENS.default);
        out.push(COLOR_TOKENS.dull);
    }
    if (!hasBackground) {
        out.push(COLOR_TOKENS.bdefault);
    }

    return ["\x1B[", out.join(";"), "m"].join("");
}

/*
 Refer to http://en.wikipedia.org/wiki/ANSI_escape_code
 30-37 for foreground color, 39 = default
 40-47 for background color, 49 = default
 0:Black 1:Red 2:Green 3:Yellow 4:Blue 5:Magenta 6:Cyan 7:White

 1 for bright (as opposed to dull)
 22 for normal intensity
 3 italic (23 off) = no work
 4 underline (24 off) = Mac OK
 5 blink (25 off) = no work

 The following don't work in Mac Terminal
 51	Framed
 52	Encircled
 54 Not framed or encircled
 53 Overlined
 55	Not overlined
*/
var COLOR_TOKENS = {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    default: 39,

    bblack: 40,
    bred: 41,
    bgreen: 42,
    byellow: 43,
    bblue: 44,
    bmagenta: 45,
    bcyan: 46,
    bwhite: 47,
    bdefault: 49,

    bright: 1,
    dull: 22,

    italic: 3,
    italicoff: 23,

    underline: 4,
    underlineoff: 24,

    blink: 5,
    blinkoff: 25,

    framed: 51,
    circled: 52,
    framedcircledoff: 54,

    overlined: 53,
    overlinedoff: 55,
}

const LEVEL_ERROR = 0;
const LEVEL_WARN =  1;
const LEVEL_INFO =  2;
const LEVEL_DEBUG = 3;

function logConfig(logger, initial) {
    logger.configure = configure;
    logger.color = color;

    logger.LEVEL_ERROR = LEVEL_ERROR;
    logger.LEVEL_WARN = LEVEL_WARN;
    logger.LEVEL_INFO = LEVEL_INFO;
    logger.LEVEL_DEBUG = LEVEL_DEBUG;

    // The default defaults
    if (!initial) {
        logger.configure({
            logLevel: LEVEL_DEBUG,
            logLevelNames: "ERROR,WARN,INFO,DEBUG",

            useColor: true,
            showTime: true,
            showLevel: true,
            showPrefix: false,

            timeFormat: "normal",

            colorPrefix: color(""),
            colorTime: color(""),
            // colorMsg: color(""),
            colorError: color("red,bright"),
            colorWarn: color("cyan,bright"),
            colorInfo: color(""),
            colorDebug: color("yellow,dull"),
            colorMsg: false,
            colorReset: color(""), // After the msg before the next line which might be from some other thing printing to stdout

            // Options are falsey, "indent", or "space"
            newlines: "indent",
            nativeConsoleLevels: true,
            nativeConsoleArgs: false,

            flattenLastArg: false,

            hrWidth: 80,
            hwChar: "-",
        });
    } else {
        logger.configure(initial);
    }
}

logConfig.LEVEL_ERROR = LEVEL_ERROR;
logConfig.LEVEL_WARN = LEVEL_WARN;
logConfig.LEVEL_INFO = LEVEL_INFO;
logConfig.LEVEL_DEBUG = LEVEL_DEBUG;

logConfig.NAMES_TO_LEVELS = {
    "error": LEVEL_ERROR,
    "warn": LEVEL_WARN,
    "info": LEVEL_INFO,
    "debug": LEVEL_DEBUG,

    "err": LEVEL_ERROR,
    "warning": LEVEL_WARN,
    "log": LEVEL_INFO,
    "verbose": LEVEL_DEBUG,

    "e": LEVEL_ERROR,
    "w": LEVEL_WARN,
    "i": LEVEL_INFO,
    "d": LEVEL_DEBUG,
    "l": LEVEL_INFO,
    "v": LEVEL_DEBUG,

    "": LEVEL_INFO,
};

module.exports = logConfig;
