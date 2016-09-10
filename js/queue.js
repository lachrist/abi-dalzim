
function make (inner) {
  var li = document.createElement("li");
  li.innerText = inner;
  return li;
}

module.exports = function (list, elements, display) {
  for (var i=0; i<Math.min(elements.length, display); i++)
    list.appendChild(make(elements[i]));
  var j = 0;
  return function () {
    var child = list.firstChild;
    if (list.firstChild) {
      list.removeChild(list.firstChild);
      (i < elements.length) && list.appendChild(make(elements[i++]));
      return elements[j++];
    }
  }
};
