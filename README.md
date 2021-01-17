# ET Logger

Javascript / ECMAscript already has `console.log()`, why would I use this package? 

Because this package gives you a very lightweight way to get much more useful logs. It has no dependencies and it works consistently in both node.js and browsers.

The goal of ETLogger is to be super easy to integrate into your project while still providing an upgrade and centralization of logging output for your codebase. The idea being that if everything is flowing through it, then you can get point those logging events at various other places really easily.

## Scenario 1 - Independent log flow

This is where ET Logger was born back before `console` had levels. The following

    const Log = require("etlogger");

    Log.info("A simple message with ", 3, " arguments");

produces

    04:36:48.757 INFO  | A simple message with 3 arguments

In addition to `.info` there are of course `.error`, `.warn`, and `.debug` along with other spellings and variations discussed below.

By doing very little you can immediately get both a timestamp and a level next to all your logging output. The levels are colorized and logging multiline strings is handled so that the output lines up nicely on the console.

    Log.info("The first line\nThe second line\nAnd now a third line")

    04:45:56.557 INFO  | The first line
                       | The second line
                       | And now a third line    

This works in-browser as well as long as you are using some sort of packaging system like browserify, parcel, etc. Of course lots of browser code writes to the console directly so you may want to use the second option.

## Scenario 2 - Replacing the console object

Because the exported object from the package is api compatible with the global `console` object you can simply replace console at the entry point of your application and then everyone else's logging that uses that object will be captured. Because the default behavior of console.log() is to use inspect you also want to tell the Log object about that using

    // At the top of your main entry point file
    const Log = require("etlogger");
    Log.alwaysInspect();
    global.console = Log;

    // Anywhere else in the application or a library
    console.log("Now you can tell what time this happened!");

See below for more configuration options to do things like modify the handling of messages so that they don't go to the console but instead go to some other handler like syslog, stackdriver, etc.

In a browser instead of using `global` you probably want to do a couple more things like add an event listener to the error event as well as a slightly different default configuration so a helper function is provided. In browser code, again near the top of your execution path, do the following.

    const Log = require("etlogger");
    Log.bindToWindow();

You can also pass a configurattion object to `.bindToWindow()` to do things like turn off the time or level functionality, both still on by default, since browser dev tools often include those. Configuration is disscussed below.

## Scenario 3 - Multiple named instances

Instead of using the same logger in each of your source files, sometimes you want to be very specific about where messages are coming from. Well the easiest way to do that is to use a named logger instance. All you have to do is call `.loggerFor()` on the default logger and pass in a unique name.

    const Log = require("etlogger").loggerFor("myfile", {showName: true});

    Log.warn("You know where this is from");

produces

    myfile     05:19:54.600 WARN  | You know where this is from

Note that you have to configure the logger, either at creation or afterwards, with the `showName: true` value or else the name won't appear.

The default logger instance returned when the package is imported is a named logger named `default`.

-----

# Full API

## Logging functions

There are lots of convenience names for logging functions that all do very similar things - calling `.msg()` with some default values for the logging level. The list of names and their corresponding level constants is:

    {
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
    }

In addition to each of these names there is a corresponding **i** version of the name which is simply the name with an i appended at the end. When using the **i** version, util.inspect() will be called on each argument instead of `.toString()` which will give you a nicer output. This will even work in the browser because of a built in `sprintf` implementation that will be used if `util.inspect()` is not available.

    const obj = { a:1, b:2 };
    Log.info("Without inspect ", obj);
    Log.infoi("With inspect    ", obj);

produces

    04:43:33.085 INFO  | Without inspect [object Object]
    04:43:34.427 INFO  | With inspect    { a: 1, b: 2 }

### Log.msg(message)

This is a thin wrapper around the internal engine message logging pipeline. It will ensure that every message object does indeed have a `.level` attribute and will translate string level names into level constants which makes it slightly more readable.

Since this provides a deep integration to the internal log engine it's probably best to read the code to understand all the things that can happen. This is probably most useful when you want to use the flatten functionality but don't want to turn on `flattenLastArg` for the entire logger. Thus you might do

    Log.msg({level:"debug", args:["An object %o", obj], flatten:{ index, file, offset } });

In this way you have access both to the argument list, which will use sprintf as appropriate, as well as a list of variables to be flattened into a key=value syntax that may be more compatible with log search engines.

### Log.getWriteStream(streamOpts)

If you have something else that is generating output you want to stream directly into the log you can obtain a regular node stream object this way.

The available attributes on the optional streamOpts object are

  **level** - one of the Log.LEVEL_XXXXX constants identifying the level this will be stream at.
  
  **inspect** - a boolean that controls the use of util.inspect on objects written into the stream

### Log.hr(opts)

Write a horizontal rule into the log output. Nice for separating out specific sections of the logging more easily. The optional opts argument can be a level constant, a level name, or an object with the following attributes

  **level** - one of the Log.LEVEL_XXXXX constants identifying the level this will be stream at.

  **width** - width of the output, default 80

  **char** - a string that is repeated width times to create the output

## Configuration

### Log.configure(config)

The configuration for a logger can be changed by passing in a configuration object via this function. It can also be passed in as the second parameter when the logger is obtained via the .loggerFor() method.

The options and their defaults are as follows

    {
        // The filter level of the logger. Messages logged at a level
        // higher than this level will not be sent to the log handlers
        // and thus will not be displayed.
        logLevel: LEVEL_DEBUG,

        // A comma separated list of names to use when creating string output.
        // There should be four entries in the order shown.
        logLevelNames: "ERROR,WARN,INFO,DEBUG",

        // A global way to disable all color ouput
        useColor: true,

        // If non-falsey this should be a string which will be shown at
        // the beginning of the formatted output. It is global to the logger
        // so it's most useful for something like a pid
        showPrefix: false,

        // Boolean controlling the logger name output for the formatted string
        showName: false,

        // Boolean controlling the time output for the formatted string
        showTime: true,

        // Boolean controlling the level output for the formatted string
        showLevel: true,

        // Length of the name field which is padded out with spaces
        maxNameLength: 10,

        // normal = just the time without a date, useful for short running processes
        // iso - include the date which is better for long running processes
        timeFormat: "normal",

        // The color values are ANSI control code strings that can be created
        // with the help of the Log.color() function. If no string is defined
        // no control codes are output for that section. The value color("") 
        // resets to the defaults.
        //
        // This group defines colors for different sections of the formatted
        // message.
        colorPrefix: color(""),
        colorName: color("framed"),
        colorTime: color(""),

        // These color both the level tag and as long as colorMsg doesn't 
        // reset the color, the same color is used for the message text itself
        colorError: color("red,bright"),
        colorWarn: color("cyan,bright"),
        colorInfo: color(""),
        colorDebug: color("yellow,dull"),
        colorMsg: false,

        // This is used after the message text. It's good to reset the coloring
        // in case something else prints to stdout
        colorReset: color(""), 

        // How to handle message text with newlines
        // falsey   - no newline processing
        // "indent" - add spaces equal to the header length and then a | for each 
        //            line after the first one
        // "space"  - just replace the \n with a " " character
        newlines: "indent",


        // Boolean that determines if the native console methods like log.error() are
        // used or not when writing to the real console.
        nativeConsoleLevels: true,

        // Boolean that will cause the logged args to be passed directly on to the
        // real console logging methods. This is nice in a browser scenario 
        // where the browser is going to provide a debugger UI that lets you drill
        // into sub-object and arrays etc.
        nativeConsoleArgs: false,

        // If true, the last argument will be flattened if it is an object and
        // if the log message does not have a flatten attribute
        flattenLastArg: false,

        // Default width of horizontal rule messages
        hrWidth: 80,

        // Character used for horizontal rule messages
        hwChar: "-",
    }

### Log.color(colorString)

This returns color control codes that can be used when configuring the formatted output of the logger. The string can be a comma separated list of the following values.

    COLOR_TOKENS = {
        // Foregrounds
        black: 30,
        red: 31,
        green: 32,
        yellow: 33,
        blue: 34,
        magenta: 35,
        cyan: 36,
        white: 37,
        default: 39,
    
        // Backgrounds
        bblack: 40,
        bred: 41,
        bgreen: 42,
        byellow: 43,
        bblue: 44,
        bmagenta: 45,
        bcyan: 46,
        bwhite: 47,
        bdefault: 49,
    
        // The default is dull. Bright is usually considered a bold font
        bright: 1,
        dull: 22,
    
        // Your mileage may vary with the rest of these
        italic: 3,
        italicoff: 23,
    
        underline: 4,
        underlineoff: 24,
    
        blink: 5,
        blinkoff: 25,
    
        // The following don't work in the Mac Terminal.app
        framed: 51,
        circled: 52,
        framedcircledoff: 54,
    
        overlined: 53,
        overlinedoff: 55,
    }

## Log Handlers

### Log.addLogHandler(logHandler)

Adds a logHandler which will receive all messages sent into the logging engine from any of the loggers. So if you have different named loggers, they will all share the same engine and therefore the same set of handlers.

The LogHandler interface is described below.

### Log.delLogHandler(logHandler)

Removes a previously added handler. The handlers are stored in an array that is searched with .indexOf() so this has to be the same object that was originally added.

### Log.delConsoleHandler()

Since a default console handler is added to all loggers this method is necessary to remove it in cases where you want all logging to go somewhere else, such as out to a network logging endpoint.

This is probably the most efficient approach, but you can also get the default console log handler using `Log.defaultConsoleHandler`. If you set the `disabled` attribute on that handler, it will still be in the handling stack receiving messages, but it won't output anything to the console.

### LogHandler interface

To be a LogHandler an object needs to have a `handleLog(logMsg)` function. Once added to the logEngine, the handler will receive all messages that pass the level filter of the logger they were sent with.

So if a logger is configured for LEVEL_INFO, the handlers won't receive LEVEL_DEBUG messages sent through that logger.

Log messages have the following attributes that can be accessed directly by a handler in order to forward the message or format it as appropriate

    {
        // This will be one of the Log.LEVEL_XXXX constants.
        // 0 is Error while 3 is Debug, but the constants should be used
        // whenever possible rather than the int values
        logLevel: <int>

        // A date object representing the time the message was sent
        date: <Date>

        // Indicates whether args should be turned into strings using
        // .toString() or util.inspect() and equivalents.
        inspect: <Boolean>

        // A reference to the logger which sent the message
        logger: <Logger>

        // The arguments passed in to the standard logging functions. If
        // a handler is able to send structured objects on to it's destination
        // then it may want to use these values directly instead of the formatted
        // log message. However, it's worth noting that the logging
        // functions accept sprintf styled arguments so handlers should take
        // that into account as necessary.
        args: [<any>]

        // An optional object that should be "flattened" in the sense that it
        // should be translated into "key=value" pairs. This is handled by the
        // default getMessage() function, but a more capable log handler may
        // choose to pass this on in a structured way to the ultimate logging
        // destination
        flatten: <object>
    }

In addition to those attributes there are two functions defined that make writing a simple handler which outputs a single string per message pretty easy. They are `.getHeader()` and `.getMessage()`.

The `.getHeader()` function returns everything to the left side of the "|" that is written by the default console output handler. This may include a prefix, the logger name, the timestamp, and the log level. If color is enabled it will include color control codes.

The `.getMessage()` function returns everything to the right of the "|" which is the formatted args and flattened objects as appropriate. Note that if the configuration value `newlines` is set to `"indent"` which is the default than the message will contain the indention header and the pipe separators. Thus you may want to either set the `newlines` configuration to `"space"` or ignore this function if writing a structured log handler where this is inappropriate.

Both of these getters will cache their results on a per-message basis for performance, so once they've been called they will return the memoized values. It's also worth noting that `.getMessage()` internally calls `.getHeader()`.
