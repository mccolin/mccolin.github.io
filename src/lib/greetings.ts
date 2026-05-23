
const greetings = [
  "👋 Hi. I'm Colin.",
  "🧔🏻‍♂️ Hello. I'm Colin.",
  "🕵️ You've found Colin.",
  "🍕 This is Colin.",
  "👨‍💻 Colin is here.",
  "🎉 Oh hey, it's Colin.",
  "🌍 Colin has entered the chat.",
  "🤘 Colin is here.",
  "🥊 Yo! It's Colin.",
];

const weightedGreetings = [
  ...Array(3).fill(greetings[0]),
  ...Array(3).fill(greetings[1]),
  ...greetings.slice(2),
];

export function allGreetings(): string[] {
  return [...greetings];
}

export function siteGreetings(): string[] {
  return [...weightedGreetings];
}

export function baseGreeting(): string {
  return greetings[0];
}

export function getGreeting(): string {
  return weightedGreetings[Math.floor(Math.random() * weightedGreetings.length)];
}

export function allEmoji(): string[] {
  const segmenter = new Intl.Segmenter();
  return greetings.map(g => [...segmenter.segment(g)][0].segment);
}

export function randomEmoji(amount: number = 1): string[] {
  const emoji = allEmoji();
  return emoji.sort(() => Math.random() - 0.5).slice(0, amount);
}