(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = function (text) {
  window.prompt("Copy to clipboard: (Ctrl|CMD)+C, Enter", text);
};

},{}],2:[function(require,module,exports){

var Remarks = require("./remarks.js");

module.exports = function (detail, remarks, name) {
  detail.src = "rep/"+name+".jpg";
  while (remarks.firstChild)
    remarks.removeChild(remarks.firstChild);
  (Remarks[name]||[]).forEach(function (r) {
    var li = document.createElement("li");
    li.innerText = r;
    remarks.appendChild(li);
  });
}

},{"./remarks.js":7}],3:[function(require,module,exports){

var ParseSet = require("./parse-set.js");
var ParseQueryString = require("./parse-query-string.js");
var Timer = require("./timer.js");
var Queue = require("./queue.js");
var Slogan = require("./slogan.js");
var Copy = require("./copy.js");
var Display = require("./display.js");

window.onload = function () {
  var cache = {};
  [ "slogan",
    "timer",
    "set",
    "progress",
    "head",
    "tail",
    "detail",
    "start",
    "total",
    "remarks",
    "bell"
  ].forEach(function (id) { cache[id] = document.getElementById(id) });
  var set;
  var total;
  cache.slogan.innerText = "Abi-Dalzim: "+Slogan();
  cache.slogan.onclick = function () {
    Copy(window.location.href.split("?")[0]+"?set="+encodeURIComponent(cache.set.value));
  }
  cache.set.onchange = function () {
    try {
      set = ParseSet(cache.set.value);
    } catch (e) {
      cache.start.disabled = true;
      return cache.total.innerText = "Parse error...";
    }
    total = set.reduce(function (acc, rep) { return acc + rep.duration }, 0);
    cache.start.disabled = false;
    cache.total.innerText = Math.ceil(total/60)+"min";
  };
  cache.set.value = ParseQueryString(window.location.search).set;
  cache.set.onchange();
  cache.head.onchange = function () {
    Display(cache.detail, cache.remarks, cache.head.value);
  }
  cache.start.onclick = function () {
    cache.start.disabled = true;
    cache.set.disabled = true;
    var queue = Queue(cache.tail, set, 5);
    var current = 0;
    function next () {
      cache.bell.currentTime = 0;
      cache.bell.play();
      cache.progress.innerText = Math.floor(100 * current / total) + "%";
      var rep = queue();
      if (rep) {
        cache.head.value = rep;
        Display(cache.detail, cache.remarks, rep.name);
        Timer(cache.timer, rep.duration, function () {
          current += rep.duration;
          next();
        });
      } else {
        cache.detail.src = "rep/rest.jpg";
        cache.head.value = "";
        cache.start.disabled = false;
        cache.set.disabled = false;
      }
    }
    next();
  };
};

},{"./copy.js":1,"./display.js":2,"./parse-query-string.js":4,"./parse-set.js":5,"./queue.js":6,"./slogan.js":8,"./timer.js":9}],4:[function(require,module,exports){

module.exports = function (search) {
  if (search[0] !== "?")
    throw new Error("Not a query string");
  search = search.substring(1);
  var result = {};
  search.split("&").forEach(function (binding) {
    var parts = binding.split("=");
    if (parts.length !== 2)
      throw new Error("Incorrect binding: "+binding);
    result[parts[0]] = decodeURIComponent(parts[1]);
  });
  return result;
}

},{}],5:[function(require,module,exports){

// SUM := TERM ('+' TERM)*
// TERM := REPETITION
//       | PRIMARY
// REPETITION := NUMBER '*' PRIMARY
// PRIMARY := '(' SUM ')'
//          | ATOM
// ATOM := DURATION NAME
//       | NUMBER NAME 'in' DURATION

//   3 * (45s front-plank + 15s rest)
// + 60s rest
// + 12 * (5 pushup in 15s)
// + 60s rest

var Parsec = require("parsecjs");

var flaten = (xss) => Array.prototype.concat.apply([], xss);

// BASE //
var duration = Parsec.then(
  Parsec.Spaces,
  Parsec.lift(
    Parsec.regexp(/^[0-9]+s/),
    parseInt));
var name = Parsec.then(
  Parsec.Spaces,
  Parsec.regexp(/^[A-Za-z0-9_\-]+/));
var number = Parsec.then(
  Parsec.Spaces,
  Parsec.lift(
    Parsec.regexp(/^[0-9]+/),
    parseInt));

// ATOM //
var atom = (function () {
  function gainage2string () { return this.duration+"s "+this.name }
  var gainage = Parsec.bind(duration, function (d) {
    return Parsec.lift(name, function (n) {
      return {name:n, duration:d, toString:gainage2string};
    });
  });
  function motion2string () { return this.count+" "+this.name+" in "+this.duration+"s" }
  var motion = Parsec.bind(number, function (c) {
    return Parsec.bind(name, function (n) {
      return Parsec.then(
        Parsec.keyword("in"),
        Parsec.lift(duration, function (d) {
          return {name:n, duration:d, count:c, toString:motion2string};
        }));
    });
  });
  return Parsec.choice([gainage, motion]);
} ());

// SUM //
var sum = (function () {
  var primaries = [];
  var primary = Parsec.choice(primaries);
  var repetition = Parsec.bind(number, (n) =>
    Parsec.then(
      Parsec.keyword("*"),
      Parsec.lift(primary, (p) => flaten(Array(n).fill(p)))));
  var term = Parsec.choice([primary, repetition]);
  var sum = Parsec.lift(Parsec.separate1(term, Parsec.keyword("+")), flaten);
  var parenthesis = Parsec.enclose(Parsec.keyword("("), sum, Parsec.keyword(")"));
  primaries.push(atom, parenthesis);
  return sum;
} ());

module.exports = (input) => Parsec.run(sum, input);

// module.exports
// // SUM //
// module.exports = (function () {
//   var terms = [];
//   var term = Parsec.choice(terms);
//   var sum = Parsec.separate1(term, Parsec.keyword("+"));
//   var multiplication = Parsec.bind(number, function (n) {
//     return Parsec.then(
//       Parsec.keyword("*"),
//       Parsec.lift(sum, function (s) {
//         return Array(n).fill(s);
//       }));
//   });
//   var parenthesis = Parsec.enclose(Parsec.keyword("("), sum, Parsec.keyword(")"));
//   terms.push(atom, multiplication, parenthesis);
//   return sum;
// } ());





// var addition = Parsec.separate(multiplication, Parsec.keyword("+"));


// var expressions = [];
// var expression = Parsec.choice(expressions);


// var parenthesis = Parsec.then(
//   Parsec.keyword("("),
//   Parsec.bind(expression, function (e) {
//     return Parsec.lift(
//       Parsec.keyword(")"),
//       function () { return e });
//   }));
// var multiplication = Parsec.bind(number, function (n) {
//   return Parsec.then(
//     Parsec.keyword("*"),
//     Parsec.lift(expression, function (e) {
//       return Array(n).fill(e);
//     }));
// });
// var addition = Parsec.separate2(expression, Parsec.keyword("+"));
// expressions.push(parenthesis, multiplication, addition, exercise);

// module.exports = expression



},{"parsecjs":10}],6:[function(require,module,exports){

function make (inner) {
  var li = document.createElement("li");
  li.innerText = inner;
  return li;
}

module.exports = function (list, elements, display) {
  for (var i=0; i<Math.min(elements.length, display); i++)
    list.appendChild(make(elements[i]));
  var j = 0;
  return function () {
    var child = list.firstChild;
    if (list.firstChild) {
      list.removeChild(list.firstChild);
      (i < elements.length) && list.appendChild(make(elements[i++]));
      return elements[j++];
    }
  }
};

},{}],7:[function(require,module,exports){

// Cardio //

exports["mountain-climbing"] = [
  "Ne pas lever les fesses"
];

// Elbow Planks //

exports["plank-front"] = [
  "Bien contrôler les abdos pour ne pas creuser le dos",
  "Les coudes doivent être bien en dessous des épaules",
  "Ne pas lever les fesses sinon c'est tricher"
];

exports["plank-left"] = (exports["plank-right"] = [
  "Bien rester de profil avec les épaules l'une au dessus de l'autre",
  "Ne pas laisser les fesses s'abaisser"
]);

exports["plank-back"] = [
  "Bien lever les fesses et esssayer de rester le plus droit possible"
];

// Pushup Planks //

exports["plank-pushup"] = [
  "Faire le gros dos et sortir les épaules vers le sol"
];

exports["plank-leg-left"] = (exports["plank-leg-right"] = [
  "Ne pas monter le jambes trop haut pour eviter de lever les fesses"
]);

exports["plank-arm-left"] = (exports["plank-arm-right"] = [
  "Ecarter les jambes pour pouvoir rester de face",
  "Lever le bras au moins au niveau de la tête",
  "Le nazism, c'est mal"
]);

// Walkup Planks //

exports["plank-walkup-right"] = [
  "Monter ET descendre avec le bras droit",
  "Faire le gros dos en position bras tendu"
];

exports["plank-walkup-left"] = [
  "Monter ET descendre avec le bras gauche",
  "Faire le gros dos en position bras tendu"
];

// Pushups //

exports["pushup-close"] = [
  "Toujours controler ses abos; rester gainer et ne pas creuser le dos",
  "Les coudes restent colé au corp durant le mouvement",
  "Ne pas aller chercher le sol avec sa tête, on reste en position de planche",
  "Si vous avez du mal, ne descendez pas jusqu'au bout"
];

exports["pushup-large"] = [
  "Toujours controler ses abos; rester gainer et ne pas creuser le dos",
  "Ne pas aller chercher le sol avec sa tête, on reste en position de planche",
  "Si vous avez du mal, ne descendez pas jusqu'au bout"
];

// Elastics //

exports["elastic-butterfly"] = [
  "Essayer de reproduire un maximum le mouvement sous l'eau",
  "Tenir ses poignet toujours perpendiculaire au mouvement",
  "Plier un peu les coudes au début du mouvement",
  "Les elastiques doivent venire cogner les épaules à la fin du mouvement",
  "Déplier les poignets à la fin du mouvement pour gagner quelques centimètres"
];

},{}],8:[function(require,module,exports){

function citation (sentence, author) {
  return "\u201C"+sentence+"\u201D \u2014 "+author;
}

var slogans = [
  "Get ripped or die tryin",
  "Everyday I'm shuffling",
  citation("No", "Rosa Park"),
  citation("Hey mec!", "Karim Naili"),
  "Ever heard of Friendship is Manly?",
  "Everyday by Rusko (Netsky Remix VIP) is stupidly hardcore"
];

module.exports = function () {
  return slogans[Math.floor(Math.random() * slogans.length)];
}

},{}],9:[function(require,module,exports){

module.exports = function (timer, duration, callback) {
  var start = new Date().getTime();
  function tick () {
    var rest = duration - (new Date().getTime() - start)/1000;
    timer.innerText = rest < 0 ? "0.0" : rest.toFixed(1);
    rest < 0 ? callback() : setTimeout(tick, 200);
  };
  tick();
}

},{}],10:[function(require,module,exports){

var descriptions = new WeakMap();

exports.description = WeakMap.prototype.get.bind(descriptions);

var register = (parser, description) => {
  descriptions.set(parser, description);
  return parser;
};

var truncate = (string) => JSON.stringify((string.length <= 20) ? string : (string.substring(0,20) + "..."));

exports.run = (parser, input) => {
  var [error, result, rest] = parser(input);
  if (error)
    throw new Error(error + "near: " + truncate(rest));
  if (rest)
    throw new Error("Incomplete parsing, rest: " + truncate(rest));
  return result;
};

exports.debug = () => {
  var indent = 0;
  return (parser, name) => {
    if (!descriptions.has(parser))
      throw new TypeError("Parsec.debug: first argument has to be a parser, got: " + parser);
    var description = name + "@" + descriptions.get(parser);
    return register((input) => {
      var spaces = Array(++indent).join("    ");
      console.log(spaces + description);
      console.log(spaces + Array(description.length+1).join("="));
      console.log(spaces + ">> Input: " + truncate(input));
      var [error, result, rest] = parser(input);
      console.log(spaces + (error ? (">> ERROR: " + error) : (">> Result: " + JSON.stringify(result))));
      console.log(spaces + ">> Rest: " + truncate(rest));
      return (indent--, [error, result, rest]);
    }, description);
  }
};

//////////////////////////////////
// First-class monadic function //
//////////////////////////////////

exports.bind = (parser, constructor) => {
  if (!descriptions.has(parser))
    throw new TypeError("Parsec.bind: first argument has to be a parser, got: " + parser);
  if (typeof constructor !== "function")
    throw new TypeError("Parsec.bind: second argument has to be a function, got: " + constructor);
  var description = "Parsec.bind(" + descriptions.get(parser) + ", " + (constructor.name || "anonymous") + ")"
  return register((input) => {
    var [error, result, rest] = parser(input);
    if (error)
      return [error, null, rest];
    var next = constructor(result);
    if (!descriptions.has(next))
      throw new TypeError("Parsec.bind: second argument should return a parser, got: " + next);
    return next(rest);
  }, description);
};

exports.return = (value) => {
  var description = "Parsec.return(" + JSON.stringify(String(value)) + ")";
  return register((input) => [null, value, input], description);
};

exports.fail = (error) => {
  var description = "Parsec.fail(" + JSON.stringify(String(error)) + ")";
  return register((input) => [error, null, input], description);
};

/////////////////////
// Monadic helpers //
/////////////////////

exports.then = (parser1, parser2) => exports.bind(parser1, () => parser2);

exports.lift = (parser, f) => exports.bind(parser, (x) => exports.return(f(x)));

/////////////////////////////
// First-class combinators //
/////////////////////////////

// String -> Parser Char
exports.oneof = (characters) => {
  if (typeof characters !== "string")
    throw new TypeError("Parsec.oneof: first argument has to be a string, got: " + characters);
  var description = "Parsec.oneof(" + JSON.stringify(characters) + ")";
  return register((input) => (characters.indexOf(input[0]) !== -1)
    ? [null, input[0], input.substring(1)]
    : [description, null, input], description);
};

// String -> Parser Null
exports.literal = (string) => {
  if (typeof string !== "string")
    throw new TypeError("Parsec.literal: first argument has to be a string, got: " + string);
  var description = "Parsec.literal(" + JSON.stringify(string) + ")";
  return register((input) => input.startsWith(string)
    ? [null, null, input.substring(string.length)]
    : [description, null, input], description);
};

// Regexp -> Parser String
exports.regexp = (regexp) => {
  if (!(regexp instanceof RegExp))
    throw new TypeError("Parsec.regexp: first argument has to be a RegExp, got: " + regexp);
  if (regexp.global)
    throw new Error("Parsec.regexp: fist argument cannot be a global RegExp, got " + regexp);
  if (regexp.source[0] !== "^")
    throw new Error("Parsec.regexp: first argument should start with ^, got " + regexp);
  var description = "Parsec.regexp(" + regexp + ")";
  return register((input) => {
    var result = regexp.exec(input);
    return result
      ? [null, result[0], input.substring(result[0].length)]
      : [description, null, input];
  }, description);
};

// Parser a -> Parser [a]
exports.many = (parser) => {
  if (!descriptions.has(parser))
    throw new TypeError("Parsec.many: first argument has to be parser, got: " + parser);
  var description = "Parsec.many(" + descriptions.get(parser) + ")";
  return register((input) => {
    var error, result, rest, results = [];
    while (([error, result, rest] = parser(input), !error)) {
      input = rest;
      results.push(result);
    }
    return [null, results, input];
  }, description);
};

// [Parser a] -> Parser a
exports.choice = (parsers) => {
  if (!Array.isArray(parsers))
    throw new TypeError("Parsec.choice: first argument has to be an array, got: " + parsers);
  var description = "Parsec.choice([" + parsers.map((parser, index) => {
    if (!descriptions.has(parser))
      throw new TypeError("Parsec.choice: first argument has to be an array of parsers, got at index " + index + ": " + parser);
    return descriptions.get(parser);
  }).join(", ") + "])";
  return register((input) => {
    for (var i=0; i<parsers.length; i++) {
      var [error, result, rest] = parsers[i](input);
      if (!error)
        return [null, result, rest];
    }
    return [description, null, input];
  }, description);
};

////////////////////////
// Helper combinators //
////////////////////////

exports.Spaces = exports.regexp(/^\s*/);

exports.Number = exports.lift(exports.regexp(/^[+-]?[0-9]+(\.[0-9]+)?/), JSON.parse);

exports.DoubleQuotedString = exports.lift(exports.regexp(/^"(\\.|[^"])*"/), JSON.parse);

exports.some = (parser) => exports.bind(parser, (x0) =>
  exports.lift(exports.many(parser), Array.prototype.concat.bind([x0])));

exports.keyword = (keyword) => exports.then(exports.Spaces, exports.literal(keyword));

exports.separate2 = (parser, separator) => exports.bind(parser, (x0) =>
  exports.lift(exports.some(exports.then(separator, parser)), Array.prototype.concat.bind([x0])));

exports.separate1 = (parser, separator) => exports.choice([
  exports.separate2(parser, separator),
  parser
]);

exports.separate0 = (parser, separator) => exports.choice([
  exports.separate1(parser, separator),
  exports.return([])
]);

exports.enclose = (parser1, parser2, parser3) => exports.then(
  parser1,
  exports.bind(
    parser2,
    (x) => exports.lift(parser3, () => x)));



},{}]},{},[3]);
