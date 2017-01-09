
module.exports = function (set, callback) {
  var names = [];
  var misses = [];
  function done () { names.pop() || callback(misses) }
  set.forEach(function (rep) {
    if (names.indexOf(rep.name) === -1) {
      names.push(rep.name);
      var extensions = ["gif", "png", "jpg"];
      var img = new Image();
      function preload () {
        var ext = extensions.pop();
        if (ext)
          return img.src = "rep/"+rep.name+"/"+ext
        misses.push(rep.name);
        done();
      }
      img.onload = function () {
        rep.src = img.src
        done();
      };
      img.onerror = preload;
      preload();
    }
  });
};
