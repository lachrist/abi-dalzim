
module.exports = function (set, callback) {
  var progress = 0;
  function done () {
    progress++
    (progress === set.length) && callback();
  }
  set.forEach(function (rep) {
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
  });
};
