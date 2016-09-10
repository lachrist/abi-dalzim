
  console.dir(ParseTraining(training));
  var total ;
  var current;





  var initial = null;
  var rest = 
  document.getElementById("start").onclick = function () {
    initial = new Date.getTime();
  };
  function tick () {
    setTimeout(tick, 200);
  }

};


function start () {
  origin = new Date().getTime();
}



// var Fs = require("fs");
// var ParseTraining = require("./js/parse-training.js");
// var ParseQueryString = require("./")
// window.location.search

// console.log(JSON.stringify(Parse(Fs.readFileSync("./js/test.txt", "utf8")), null, 2));n

function tokenize (lines) {
  return lines.split("\n").map(function (line, x) {
    var y = 0;
    var tokens = [];
    while (y < line.length) {
      var word = /^(\S*)/.exec(line.substring(y))[0]; 
      word && tokens.push({value:word, source:x+":"+y});
      y += word.length || 1;
    }
    return tokens;
  });
}

parsers.expression = 

parsers.parenthesis = function (string) {

} 

parsers.space = function (string, index) {
  return n
};

var parsers = {};
parsers.expression = function (tokens) {
  var parts;
  if (tokens[0].value === "(") {
    if (tokens[tokens.length-1].value !== ")")
      throw new Error("Unmatched parenthesis at "+tokens[0].source);
    return parsers.expression(tokens.slice(1, tokens.length-1));
  }
  var parts = 
  if (/^([0-9]+)/)
    
}

// front-plank: 3 x (45s front-plank + 15s rest)
// 3 x ()
// pushups: 6 x (3 large-pushups in 15s + 3 )
// squat: 6 x (10 squats in 30s)

module.exports = function (total, ) {}
