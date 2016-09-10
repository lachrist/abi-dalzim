
module.exports = function (timer, duration, callback) {
  var start = new Date().getTime();
  function tick () {
    var rest = duration - (new Date().getTime() - start)/1000;
    timer.innerText = rest < 0 ? "0.0" : rest.toFixed(1);
    rest < 0 ? callback() : setTimeout(tick, 200);
  };
  tick();
}
