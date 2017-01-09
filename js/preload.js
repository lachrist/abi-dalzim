
module.exports = function (set, callback) {
  var names = [];
  set.forEach(function (rep) {
    if (names.indexOf(rep.name) !== -1) {
      names.push(rep.name);
      var extensions = ["gif", "png", "jpg"];
      var img = new Image();
      function preload () {
        img.src = "rep/"+rep.name+"/"+(extensions.pop()||alert("Could not preload "+rep.name));
      }
      img.onload = function () {
        rep.src = img.src
        names.pop() || callback();
      };
      img.onerror = preload;
      preload();
    }
  });
};
