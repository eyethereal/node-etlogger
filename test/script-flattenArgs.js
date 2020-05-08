const Log = require("../index");

function logStuff(tag) {
    Log.debugi(Log._config.flattenLastArg);

    const state = { key: "value", int: 1234, obj: { k2: "v2"}, array: [1,2,3] };
    const array = ["a", "b", 13];
    const str = "<string>";
    const num = 1.234;

    Log.log(tag);
    Log.log("Simple string");
    Log.log("Simple sprintf %d", 1234);
    Log.log(state);
    Log.log(array);
    Log.log(str);
    Log.log(num);
    Log.log(tag, ": Strings only - no last");
    Log.log("%s: sprintf - no last", tag);

    Log.log(tag, ": Strings only - state:", state);
    Log.log(tag, ": Strings only - array:", array);
    Log.log(tag, ": Strings only - str:", str);
    Log.log(tag, ": Strings only - num:", num);

    Log.log("%s: sprintf - state:", tag, state);
    Log.log("%s: sprintf - array:", tag, array);
    Log.log("%s: sprintf - str:", tag, str);
    Log.log("%s: sprintf - num:", tag, num);

    Log.msg({ args: [tag, ": msg strings - state:"], flatten: state });
    Log.msg({ args: [tag, ": msg strings - array:"], flatten: array });
    Log.msg({ args: [tag, ": msg strings - str:"], flatten: str });
    Log.msg({ args: [tag, ": msg strings - num:"], flatten: num });

    Log.msg({ args: ["%s: msg sprintf - state:", tag], flatten: state });
    Log.msg({ args: ["%s: msg sprintf - array:", tag], flatten: array });
    Log.msg({ args: ["%s: msg sprintf - str:", tag], flatten: str });
    Log.msg({ args: ["%s: msg sprintf - num:", tag], flatten: num });

    Log.hr();
}


logStuff("(default config)");

Log.configure({
    flattenLastArg: false,
});
logStuff("(flattenLastArg false)");

Log.configure({
    flattenLastArg: true,
});
logStuff("(flattenLastArg true)");
