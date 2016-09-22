(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = function () {
  var elements = document.getElementsByTagName("*");
  var cache = {};
  for (var i=0; i<elements.length; i++)
    elements[i].id && (cache[elements[i].id] = elements[i]);
  return cache;
}

},{}],2:[function(require,module,exports){

module.exports = function (text) {
  window.prompt("Copy to clipboard: (Ctrl|CMD)+C, Enter", text);
};

},{}],3:[function(require,module,exports){

var Cache = require("./cache.js");
var Copy = require("./copy.js");
var ParseQueryString = require("./parse-query-string.js");
var ParseSet = require("./parse-set.js");
var Random = require("./random.js");
var Remarks = require("./remarks.js");
var Timer = require("./timer.js");

window.onload = function () {
  var recap = null;
  var cache = Cache();
  var set;
  var total;
  cache.slogan.innerText = "Abi-Dalzim: "+Random.slogan();
  cache.detail.src = Random.picture();
  cache.header.onclick = function () {
    recap = 1;
  }
  cache.slogan.onclick = function () {
    Copy(window.location.href.split("?")[0]+"?set="+encodeURIComponent(cache.set.value));
  }
  cache.set.onchange = function () {
    try {
      set = cache.set.value ? ParseSet(cache.set.value) : [];
    } catch (e) {
      set = [];
      console.dir(e);
      alert("Parse error: "+e.message);
    }
    total = set.reduce(function (acc, rep) { return acc + rep.duration }, 0);
    cache.total.innerText = Math.ceil(total/60)+"min";
    cache.start.disabled = !total;
  };
  cache.set.value = ParseQueryString(window.location.search).set || "";
  cache.set.onchange();
  cache.start.onclick = function () {
    cache.start.disabled = true;
    cache.set.disabled = true;
    var current = 0;
    function next () {
      cache.rep0.innerText = set[0] || "";
      cache.rep1.innerText = set[1] || "";
      cache.rep2.innerText = set[2] || "";
      cache.detail.src = set[0] ? "rep/"+set[0].name+".jpg" : Random.picture();
      while (remarks.firstChild)
        cache.remarks.removeChild(remarks.firstChild);
      ((set[0] && Remarks[set[0].name]) ||[]).forEach(function (r) {
        var li = document.createElement("li");
        li.innerText = r;
        cache.remarks.appendChild(li);
      });
      cache.bell.currentTime = 0;
      cache.bell.play();
      cache.progress.innerText = Math.floor(100*current/total)+"%";
      if (set[0]) {
        Timer(cache.timer, recap || set[0].duration, function () {
          current += set[0].duration;
          set.shift();
          next();
        });
      } else {
        cache.start.disabled = false;
        cache.set.disabled = false;
        recap = null;
      }
    }
    next();
  };
};

},{"./cache.js":1,"./copy.js":2,"./parse-query-string.js":4,"./parse-set.js":5,"./random.js":6,"./remarks.js":7,"./timer.js":8}],4:[function(require,module,exports){

module.exports = function (search) {
  if (!search)
    return {};
  if (search[0] !== "?")
    throw new Error("Not a query string");
  var result = {};
  search.substring(1).split("&").forEach(function (binding) {
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
  var sum = Parsec.lift(Parsec.separate0(term, Parsec.keyword("+")), flaten);
  var parenthesis = Parsec.between(Parsec.keyword("("), sum, Parsec.keyword(")"));
  primaries.push(atom, parenthesis);
  return sum;
} ());

module.exports = (input) => Parsec.run(Parsec.sequence_([sum, Parsec.Spaces], 0), input);

},{"parsecjs":9}],6:[function(require,module,exports){

function citation (sentence, author) {
  return "\u201C"+sentence+"\u201D \u2014 "+author;
}

function pick (xs) {
  return xs[Math.floor(Math.random() * xs.length)];
}

var slogans = [
  "Get ripped or die tryin",
  "Everyday I'm shuffling",
  citation("No", "Rosa Park"),
  citation("Hey mec!", "Karim Naili"),
  "Ever heard of Friendship is Manly?",
  "Everyday by Rusko (Netsky Remix VIP) is stupidly hardcore"
];

var pictures = [
  "media/abi-dalzim.jpg",
  "media/alexander-popov.jpg",
  "media/katy-hosszu.gif",
  "media/swimming-1.jpg",
  "media/swimming-2.jpg",
  "media/vitruvian-man.jpg"
];

exports.slogan = function () { return pick(slogans) };

exports.picture = function () { return pick(pictures) };

},{}],7:[function(require,module,exports){

////////////
// Burpee //
////////////

exports["burpee-2"] = [
  "Bien descendre les fesses en position accroupie"
];

exports["burpee"] = exports["burpee-1"] = exports["burpee-pushup"] = [
  "Ne pas creuser le dos en position de pompe"
];

/////////////////
// Butt-Kicker //
/////////////////

exports["butt-kicker"] = [
  "Les talons doivent bien remonter aux fesses",
  "Bien amortir les chocs, il ne doit pas y avoir de bruit"
];

/////////////
// Elastic //
/////////////

exports["elastic-butterfly"] = [
  "Essayer de reproduire un maximum le mouvement sous l'eau",
  "Tenir ses poignet toujours perpendiculaire au mouvement",
  "Plier un peu les coudes au début du mouvement",
  "Les elastiques doivent venire cogner les épaules à la fin du mouvement",
  "Déplier les poignets à la fin du mouvement pour gagner quelques centimètres"
];

exports["elastic-left-rotator"] = exports["elastic-right-rotator"] = [
  "Le coude ne doit pas bouger",
  "Controler le mouvement dans le phase de retour"
];

/////////////////
// Elbow-Plank //
/////////////////

exports["elbow-plank-front"] = [
  "Bien contrôler les abdos pour ne pas creuser le dos",
  "Les coudes doivent être bien en dessous des épaules",
  "Ne pas lever les fesses sinon c'est tricher"
];

exports["elbow-plank-left"] = exports["plank-right"] = [
  "Bien rester de profil avec les épaules l'une au dessus de l'autre",
  "Ne pas laisser les fesses s'abaisser"
];

exports["elbow-plank-back"] = [
  "Bien lever les fesses et esssayer de rester le plus droit possible"
];

//////////////////
// Flutter-Kick //
//////////////////

exports["flutter-kick"] = [
  "Coller le menton a la poitrine pour ne PAS creuser le dos",
  "Mettre les mains en dessous des fesses pour ne PAS cresuer le dos",
  "Jambes tendues jusqu'à la pointe des pieds",
  "Ne PAS creuser le dos"
];

///////////////
// High-Knee //
///////////////

exports["high-knee"] = [
  "Les genoux doivent monter au niveau des hanches",
  "Bien amortir les chocs, il ne doit pas y avoir de bruit"
];

///////////
// Lunge //
///////////

///////////////////////
// Mountain-Climbing //
///////////////////////

exports["mountain-climbing"] = [
  "Ne pas lever les fesses"
];

////////////
// Pushup //
////////////

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

//////////////////
// Pushup-Plank //
//////////////////

exports["pushup-plank-back"] = [
  "Remonter les fesses aux maximum"
];

exports["pushup-plank-arm-left"] = exports["pushup-plank-arm-right"] = [
  "Ecarter les jambes pour pouvoir rester de face",
  "Lever le bras au moins au niveau de la tête",
  "Le nazism, c'est mal"
];

exports["pushup-plank-high"] = [
  "Faire le gros dos et sortir les épaules vers le sol"
];

exports["pushup-large-plank-low"] = [
  "Ne pas creuser le dos ni remonter les fesses",
  "Les coudes collé au corps"
];

exports["pushup-plank-left"] = exports["pushup-plank-right"] = [
  "Rester bien de profile, les épaules l'une au dessus de l'autre",
  "Ne sortir les fesses ver l'arrière"
];

exports["pushup-plank-leg-left"] = exports["pushup-plank-leg-right"] = [
  "Ne pas monter la jambe trop haut pour eviter de lever les fesses"
];

///////////
// Squat //
///////////

exports["squat"] = [
  "Bien sortir les fesses en arrière pour que le dos reste droit"
];

exports["squat-jump"] = [
  "Toucher le sol et descendre les fesses"
]

//////////////
// Superman //
//////////////

exports["superman-plank"] = [
  "Garder le bras bien tendu vers l'avant",
  "La poitrine et les genoux ne doivent pas toucher le sol"
];

////////////
// Walkup //
////////////

exports["walkup-right"] = [
  "Monter ET descendre avec le bras droit",
  "Faire le gros dos en position bras tendu"
];

exports["walkup-left"] = [
  "Monter ET descendre avec le bras gauche",
  "Faire le gros dos en position bras tendu"
];

},{}],8:[function(require,module,exports){

module.exports = function (timer, duration, callback) {
  var start = new Date().getTime();
  function tick () {
    var rest = duration - (new Date().getTime() - start)/1000;
    timer.innerText = rest < 0 ? "0.0" : rest.toFixed(1);
    rest < 0 ? callback() : setTimeout(tick, 200);
  };
  tick();
}

},{}],9:[function(require,module,exports){

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

exports.keyword = (keyword) => exports.then(exports.Spaces, exports.literal(keyword));

exports.sequence = (parsers) => parsers.length
  ?exports.bind(parsers[0], (x0) => exports.lift(
    exports.sequence(parsers.slice(1)),
    Array.prototype.concat.bind([x0])))
  :exports.return([])

exports.sequence_ = (parsers, index) => exports.lift(exports.sequence(parsers), (xs) => xs[index])

exports.between = (parser1, parser2, parser3) => exports.sequence_([parser1, parser2, parser3], 1);

exports.some = (parser) => exports.bind(parser, (x0) =>
  exports.lift(exports.many(parser), Array.prototype.concat.bind([x0])));

exports.separate2 = (parser, separator) => exports.bind(parser, (x0) =>
  exports.lift(exports.some(exports.then(separator, parser)), Array.prototype.concat.bind([x0])));

exports.separate1 = (parser, separator) => exports.bind(parser, (x0) =>
  exports.lift(exports.many(exports.then(separator, parser)), Array.prototype.concat.bind([x0])));

exports.separate0 = (parser, separator) => exports.choice([
  exports.separate1(parser, separator),
  exports.return([])
]);




},{}]},{},[3]);
