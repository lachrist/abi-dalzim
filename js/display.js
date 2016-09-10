
var Remarks = require("./remarks.js");

module.exports = function (detail, remarks, name) {
  detail.src = "rep/"+name+".jpg";
  while (remarks.firstChild)
    remarks.removeChild(remarks.firstChild);
  (Remarks[name]||[]).forEach(function (r) {
    var li = document.createElement("li");
    li.innerText = r;
    remarks.appendChild(li);
  });
}
