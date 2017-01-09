
var Cache = require("./cache.js");
var Copy = require("./copy.js");
var ParseQueryString = require("./parse-query-string.js");
var ParseSet = require("./parse-set.js");
var Random = require("./random.js");
var Remarks = require("./remarks.js");
var Timer = require("./timer.js");
var Preload = require("./preload.js");

window.onload = function () {
  var cache = Cache();
  var set;
  var total;
  cache.slogan.innerText = "Abi-Dalzim: "+Random.slogan();
  cache.detail.src = Random.picture();
  cache.slogan.onclick = function () {
    Copy(window.location.href.split("?")[0]+"?set="+encodeURIComponent(cache.set.value));
  }
  function activate () { cache.start.disabled = cache.start.set = false }
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
    cache.start.disabled = true;
    if (set.length) {
      cache.set.disabled = true;
      Preload(set, activate);
    }
  };
  cache.set.value = ParseQueryString(window.location.search).set || "";
  cache.set.onchange();
  cache.start.onclick = function () {
    cache.start.disabled = cache.set.disabled = true;
    var current = 0;
    function next (index) {
      cache.rep0.innerText = set[index+0] || "";
      cache.rep1.innerText = set[index+1] || "";
      cache.rep2.innerText = set[index+2] || "";
      cache.detail.src = set[index] ? set[index].src : Random.picture();
      while (remarks.firstChild)
        cache.remarks.removeChild(remarks.firstChild);
      ((set[index] && Remarks[set[index].name]) ||[]).forEach(function (r) {
        var li = document.createElement("li");
        li.innerText = r;
        cache.remarks.appendChild(li);
      });
      cache.bell.currentTime = 0;
      cache.bell.play();
      cache.progress.innerText = Math.floor(100*current/total)+"%";
      if (set[index]) {
        Timer(cache.timer, set[index].duration, function () {
          current += set[index].duration;
          next(index+1);
        });
      } else {
        activate();
      }
    }
    next(0);
  };
};
