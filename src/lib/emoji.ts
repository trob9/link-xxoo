// Matches exactly one emoji "grapheme" — including multi-codepoint forms
// like skin-toned (👍🏽), flags (🇦🇺, two regional-indicator letters), and
// ZWJ sequences (👨‍👩‍👧‍👦, 🏳️‍🌈) — and rejects plain text.
// Built from numeric code points rather than typed as literal characters —
// zero-width joiner (0x200D) and variation selector (0xFE0F) are invisible
// and too easy to mistype/corrupt as source-file characters.
const ZWJ = String.fromCodePoint(0x200d); // glues emoji into sequences like 👨‍👩‍👧‍👦
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f); // forces emoji presentation, e.g. ❤️
const SINGLE_EMOJI_RE = new RegExp(
  `^(\\p{Extended_Pictographic}|\\p{Regional_Indicator}{2})` +
    `(${ZWJ}(\\p{Extended_Pictographic}|\\p{Regional_Indicator}{2})|\\p{Emoji_Modifier}|${VARIATION_SELECTOR})*$`,
  "u",
);

export function isSingleEmoji(value: string): boolean {
  return SINGLE_EMOJI_RE.test(value);
}

// A curated, reasonably broad set for the picker grid — not exhaustive,
// just enough that most people find something without needing to fall back
// to typing/pasting one from their OS emoji keyboard (still supported,
// still validated by isSingleEmoji either way).
export const EMOJI_PICKER_OPTIONS: string[] = [
  "😀", "😂", "😍", "😎", "🤔", "😴", "🥳", "😭", "🔥", "✨", "💯", "👍",
  "👎", "🙌", "👀", "💪", "🤝", "🙏", "❤️", "🧡", "💛", "💚", "💙", "💜",
  "🖤", "🤍", "💔", "⭐", "🌟", "⚡", "🌈", "☀️", "🌙", "☁️", "🌊", "🌵",
  "🎵", "🎧", "🎤", "🎸", "🎹", "🎬", "📸", "📷", "🎨", "✍️", "📚", "💡",
  "🎯", "🏆", "🎮", "🕹️", "♟️", "🧩", "🍕", "🍔", "🍟", "🌮", "🍣", "🍰",
  "☕", "🍺", "🍷", "🥂", "🍎", "🍉", "🏀", "⚽", "🏈", "🎾", "🏓", "🏋️",
  "🧘", "🚴", "🏄", "⛷️", "🥊", "🏃", "🚀", "✈️", "🚗", "🚲", "🗺️", "🧭",
  "🏔️", "🏖️", "🏕️", "🌍", "💼", "💻", "📱", "⌚", "🔗", "📌", "🔒", "🔑",
  "💰", "💳", "🎁", "🛍️", "🐶", "🐱", "🦊", "🐻", "🐼", "🦁", "🐸", "🦋",
];
