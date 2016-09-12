
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
    recap = 3;
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
