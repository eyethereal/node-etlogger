// Normally this is how the logger would be included but for
// this file in the same project we reference it with a relative
// path.
//
// const Log = require("etlogger");

const Log = require("../index.js");

console.log("This is normal stuff pre-binding")

const real = global.console;
global.console = Log;

const anObj = {
    "array": [ 1, 2, 3],
    "child": {
        one: 1,
        two: 2,
    }
};

console.log("And then this is after binding :)")
console.error("an error is important")
console.warn("You should be warned");

console.log("An object ", anObj);

console.alwaysInspect();

console.log("The inspected object ", anObj);

const str = "I am a string";

console.log("A label for", str, " and then something");
real.log("A label for", str, " and then something");
