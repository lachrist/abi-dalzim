
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
