
module.exports = function (search) {
  if (!search)
    return {};
  if (search[0] !== "?")
    throw new Error("Not a query string");
  var result = {};
  search.substring(1).split("&").forEach(function (binding) {
    var parts = binding.split("=");
    if (parts.length !== 2)
      throw new Error("Incorrect binding: "+binding);
    result[parts[0]] = decodeURIComponent(parts[1]);
  });
  return result;
};
