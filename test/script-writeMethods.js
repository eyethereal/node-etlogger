const Log = require("../index");

Log.configure({
    flattenLastArg: true,
});

[
    "error",
    "warn",
    "info",
    "debug",
    "err",
    "exception",
    "warning",
    "log",

    "errori",
    "warni",
    "infoi",
    "debugi",
    "erri",
    "exceptioni",
    "warningi",
    "logi",
].forEach(name => {
    Log[name](`This is at ${name}`, {value:123}, " text", {otherObj: true, list:[1,2,3]});
});

Log.configure({
    flattenLastArg: true,
});

Log.log(`Now a flattened arg `, {value:123}, " text", {otherObj: true, list:[1,2,3]});

Log.log(`Flattening with sprintf %o %1$s`, {value:123}, {otherObj: true, list:[1,2,3]});

Log.configure({
    showTime: false,
    showLevel: false,
    nativeConsoleArgs: true,
    nativeConsoleLevels: false,
});

// console.log(Log._config);
// console.log(Log.handlerConsole._config);

Log.warn("(warn) I am a warning", {value:12});
Log.error("(ERROR) This is a lame!", {value:34});
Log.info("(info) I'm just info", {value:56});

Log.configure({
    // showTime: true,
    showLevel: true,
    timeFormat: "iso",
    nativeConsoleArgs: false,
    nativeConsoleLevels: true,
    flattenLastArg: false,
    // colorMsg: Log.color(""),
});

Log.warn("(warn) 2 I am a warning", {value:12});
Log.error("(ERROR) 2 This is a lame!", {value:34});
Log.info("(info) 2 I'm just info", {value:56});

Log.trace("(warn) what is the stack trace?", {value:12});

Log.log(`Doing some\n sprintf %o %1$s`, {value:123}, {otherObj: true, list:[1,2,3]});

Log.configure({
    showTime: true,
    flattenLastArg: true,
});
Log.log(`Now with flatten\n some sprintf %o %1$s`, {value:123}, {otherObj: true, list:[1,2,3]});

Log.log(`And \nmore sprintf %o %1$s`, {value:123}, {otherObj: true, list:[1,2,3]});

Log.configure({
    showTime: false,
    showLevel: false,
    flattenLastArg: true,
});
Log.log(`And no time flatten\n some sprintf %o %1$s`, {value:123}, {otherObj: true, list:[1,2,3]});

Log.log(`More no header \nmore sprintf %o %1$s`, {value:123}, {otherObj: true, list:[1,2,3]});
