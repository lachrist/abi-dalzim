
//   3 * (45s front-plank + 15s rest)
// + 60s rest
// + 12 * 5 pushup in 15s
// + 60s rest

var Fs = require("fs");
console.log("?set="+encodeURIComponent(Fs.readFileSync(__dirname+"/test.txt", "utf8")));
