
// SUM := TERM ('+' TERM)*
// TERM := REPETITION
//       | PRIMARY
// REPETITION := NUMBER '*' PRIMARY
// PRIMARY := '(' SUM ')'
//          | ATOM
// ATOM := DURATION NAME
//       | NUMBER NAME 'in' DURATION

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
          return {name:n, duration:d, count:c, src:src, toString:motion2string};
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
