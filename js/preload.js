
function apply (f) { f() }
var exts = ["jpg", "png", "gif"];

var srcs = {};
var ongoing = {};

function register (name, src) {
  srcs[name] = src;
  ongoing[name].forEach(apply);
  delete ongoing[name];
}

function load (name, index) {
  if (index === exts.length)
    return register(name, null);
  var image = new Image();
  image.onerror = function () { load(name, index+1) };
  image.onload = function () { register(name, image.src) };
  image.src = "rep/"+name+"."+exts[index];
}

module.exports = function (set, callback) {
  var progress = 0;
  set.forEach(function (rep) {
    function done () {
      srcs[rep.name] && (rep.src = srcs[rep.name]);
      (++progress === set.length) && callback()
    }
    if (rep.name in srcs)
      return done();
    if (rep.name in ongoing)
      return ongoing[rep.name].push(done);
    ongoing[rep.name] = [done];
    load(rep.name, 0);
  });
};
