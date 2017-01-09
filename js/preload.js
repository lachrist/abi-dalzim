
module.exports = function (set, callback) {
  var names = [];
  function done () {
    names.pop();
    names.length || callback();
  }
  set.forEach(function (rep) {
    if (names.indexOf(rep.name) === -1) {
      names.push(rep.name);
      var extensions = ["gif", "png", "jpg"];
      var img = new Image();
      function preload () {
        var ext = extensions.pop();
        if (ext)
          img.src = "rep/"+rep.name+"."+ext;
        else
          done();
      }
      img.onload = function () {
        rep.src = img.src;
        done();
      };
      img.onerror = preload;
      preload();
    }
  });
};
