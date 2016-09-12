
module.exports = function () {
  var elements = document.getElementsByTagName("*");
  var cache = {};
  for (var i=0; i<elements.length; i++)
    elements[i].id && (cache[elements[i].id] = elements[i]);
  return cache;
}
