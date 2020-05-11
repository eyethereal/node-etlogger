const Log = require("../index");

function logStuff(tag) {
    Log.debug("%s at debug\n  second line", tag);
    Log.info("%s at info\n  second line", tag);
    Log.warn("%s at warn\n  second line", tag);
    Log.error("%s at error\n  second line", tag);
    Log.hr();
}

logStuff("default");

Log.configure({
    showPrefix: "<line prefix>",
    showName: true,
    showTime: true,
    showLevel: true,
});
logStuff("everything on");

Log.configure({
    colorPrefix: Log.color("red,italic"),
    colorName: Log.color("magenta,underline"),
    colorTime: Log.color("underlineoff,blink"),
    colorMsg: Log.color("framed"),
    colorReset: Log.color("default,bdefault,italicoff,underlineoff,blinkoff,framedcircledoff"),

    timeFormat: "iso",
})
logStuff("crazy things");
