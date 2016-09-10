
function citation (sentence, author) {
  return "\u201C"+sentence+"\u201D \u2014 "+author;
}

var slogans = [
  "Get ripped or die tryin",
  "Everyday I'm shuffling",
  citation("No", "Rosa Park"),
  citation("Hey mec!", "Karim Naili"),
  "Ever heard of Friendship is Manly?",
  "Everyday by Rusko (Netsky Remix VIP) is stupidly hardcore"
];

module.exports = function () {
  return slogans[Math.floor(Math.random() * slogans.length)];
}
