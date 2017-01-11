
function citation (sentence, author) {
  return "\u201C"+sentence+"\u201D \u2014 "+author;
}

function pick (xs) {
  return xs[Math.floor(Math.random() * xs.length)];
}

var slogans = [
  "Get ripped or die tryin",
  "Everyday I'm shuffling",
  citation("No", "Rosa Park"),
  citation("Hey mec!", "Karim Naili"),
  "Ever heard of Friendship is Manly?",
  "Everyday by Rusko (Netsky Remix VIP) is stupidly hardcore"
];

var pictures = [
  "media/abi-dalzim.jpg",
  "media/alexander-popov.jpg",
  "media/katy-hosszu.jpg",
  "media/swimming-1.jpg",
  "media/swimming-2.jpg",
  "media/vitruvian-man.jpg"
];

exports.slogan = function () { return pick(slogans) };

exports.picture = function () { return pick(pictures) };
