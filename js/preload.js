
module.exports = function (set, callback) {
  var srcs = [];
  function load () { srcs.pop() || callback() }
  set.forEach(function (rep) {
    if (srcs.indexOf(rep.src) !== -1) {
      srcs.push(rep.src);
      var img = new Image();
      img.src = rep.src;
      img.onload = done;
      img.onerror = function () { alert("404 "+rep.src+" not found") };
    }
  });
};
