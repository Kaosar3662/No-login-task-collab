const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

const SUBSTRING_WORDS = [
  "nigger", "nigga", "faggot", "fuck", "shit", "bitch", "cunt", "whore", "slut",
  "pussy", "asshole", "bastard", "porn", "xvideos", "xnxx", "blowjob", "handjob",
  "hentai", "orgasm", "masturbat", "dildo", "jerkoff", "cumshot", "gangbang",
];

const WHOLE_WORDS = [
  "sex", "sexy", "sexual", "sexting", "anal", "cum", "dick", "cock", "rape", "raped",
  "rapist", "tits", "tit", "boob", "boobs", "nude", "nudes", "naked", "nsfw", "xxx",
  "milf", "fap", "horny", "ass", "fag", "fags", "dyke", "tranny", "chink", "spic",
  "kike", "coon", "paki", "retard", "retarded", "penis", "vagina", "kys", "wtf", "stfu",
];

const ALLOWED = ["scunthorpe", "shiitake", "snigger", "sniggered", "sniggering", "cocktail", "peacock"];

const VOWELS = "aeiou";

function letterPattern(word) {
  const parts = [];
  for (let i = 0; i < word.length; ) {
    const ch = word[i];
    let n = 1;
    while (word[i + n] === ch) n++;
    const cls = VOWELS.includes(ch) ? `[${ch}*]` : ch;
    parts.push(n === 1 ? `${cls}+` : `(?:${cls}[._\\-]{0,2}){${n - 1}}${cls}+`);
    i += n;
  }
  return parts.join("[._\\-]{0,2}");
}

const substringRegexes = SUBSTRING_WORDS.map((w) => new RegExp(letterPattern(w)));
const wholeRegexes = WHOLE_WORDS.map((w) => new RegExp(`^${w.slice(0, -1)}${w.slice(-1)}+$`));

function normalize(text, bangIsLetter) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u200b-\u200d\ufeff]/g, "")
    .replace(/[0134578@$!]/g, (c) => (c === "!" && !bangIsLetter ? " " : LEET[c] ?? c));
}

function check(text) {
  let t = text;
  for (const ok of ALLOWED) t = t.split(ok).join(" ");
  if (substringRegexes.some((re) => re.test(t))) return true;
  const words = t.split(/[^a-z*]+/).filter(Boolean);
  return words.some((w) => wholeRegexes.some((re) => re.test(w)));
}

export function containsBlocked(...texts) {
  return texts.some((raw) => check(normalize(raw, true)) || check(normalize(raw, false)));
}

export const BLOCKED_EVENT = "blocked-text";

export function rejectIfBlocked(...texts) {
  if (!containsBlocked(...texts)) return false;
  window.dispatchEvent(new Event(BLOCKED_EVENT));
  return true;
}
