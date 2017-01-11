
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
    cache.control.disabled = true;
    if (set.length) {
      cache.set.disabled = true;
      Preload(set, function () {
        cache.set.disabled = false;
        var misses = set.filter(function (rep) { return rep.src === undefined }).map(function (rep) { return rep.name });
        misses.length
          ? alert("Missing:\n  "+misses.join("\n  "))
          : (cache.control.disabled = false);
      });
    }
  };
  cache.set.value = ParseQueryString(window.location.search).set || "";
  cache.set.onchange();
  function start () {
    cache.set.disabled = true;
    cache.control.innerText = "Pause";
    cache.control.style.backgroundColor = "LightCoral";
    function next (index, elapsed) {
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
      cache.progress.innerText = Math.floor(100*elapsed/total)+"%";
      if (set[index]) {
        var cancel = Timer(cache.timer, set[index].duration, function () {
          next(index+1, elapsed+set[index].duration);
        });
        cache.control.onclick = function () {
          cancel();
          cache.control.innerText = "Resume";
          cache.control.style.backgroundColor = "LightBlue";
          cache.control.onclick = function () {
            cache.control.innerText = "Pause";
            cache.control.style.backgroundColor = "LightCoral";
            next(index, elapsed);
          };
        }
      } else {
        cache.set.disabled = false;
        cache.control.innerText = "Start";
        cache.control.style.backgroundColor = "LightGreen";
        cache.control.onclick = start;
      }
    }
    next(0, 0);
  }
  cache.control.innerText = "Start";
  cache.control.style.backgroundColor = "LightGreen";
  cache.control.onclick = start;
};
