const Log = require("../index");

function logStuff() {
    Log.hr();
    Log.infoi("newlines=", Log._config.newlines);
    Log.log("Some\nnew\nlines");
}

logStuff();

Log.configure({
    newlines: false,
})

logStuff();

Log.configure({
    newlines: "space",
})

logStuff();
