export function maskWord(word) {
  const chars = word.split("");
  const maskCount = Math.max(1, Math.floor(word.length / 3));
  const idxs = new Set();
  while (idxs.size < maskCount) {
    const i = Math.floor(Math.random() * word.length);
    if (/[a-zA-Z]/.test(chars[i])) idxs.add(i);
  }
  idxs.forEach(i => (chars[i] = "_"));
  return chars.join("");
}
