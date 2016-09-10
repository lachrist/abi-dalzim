
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


