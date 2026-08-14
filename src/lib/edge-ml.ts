/**
 * Edge AI / On-device ML — runs entirely in the browser (no server round-trip).
 * Lightweight lexicon classifier for sentiment + toxicity risk.
 */

const POSITIVE = [
  "good",
  "great",
  "excellent",
  "love",
  "amazing",
  "happy",
  "success",
  "helpful",
  "clear",
  "thanks",
  "brilliant",
  "wonderful",
];

const NEGATIVE = [
  "bad",
  "terrible",
  "hate",
  "awful",
  "angry",
  "fail",
  "poor",
  "broken",
  "useless",
  "worst",
  "slow",
  "bug",
];

const TOXIC = [
  "idiot",
  "stupid",
  "dumb",
  "kill",
  "hate you",
  "shut up",
  "trash",
  "worthless",
];

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export type EdgePrediction = {
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  toxicityRisk: "low" | "medium" | "high";
  toxicityScore: number;
  matched: {
    positive: string[];
    negative: string[];
    toxic: string[];
  };
  latencyMs: number;
  runtime: "browser-on-device";
};

export function runOnDeviceClassifier(text: string): EdgePrediction {
  const started = performance.now();
  const tokens = tokenize(text);
  const blob = tokens.join(" ");

  const matchedPositive = POSITIVE.filter((w) => blob.includes(w));
  const matchedNegative = NEGATIVE.filter((w) => blob.includes(w));
  const matchedToxic = TOXIC.filter((w) => blob.includes(w));

  const raw =
    (matchedPositive.length - matchedNegative.length) /
    Math.max(1, matchedPositive.length + matchedNegative.length);
  const sentimentScore = Number(raw.toFixed(3));

  let sentiment: EdgePrediction["sentiment"] = "neutral";
  if (sentimentScore >= 0.25) sentiment = "positive";
  if (sentimentScore <= -0.25) sentiment = "negative";

  const toxicityScore = Number(
    Math.min(1, matchedToxic.length / 3 + (matchedNegative.length > 3 ? 0.2 : 0)).toFixed(3)
  );

  let toxicityRisk: EdgePrediction["toxicityRisk"] = "low";
  if (toxicityScore >= 0.34) toxicityRisk = "medium";
  if (toxicityScore >= 0.67) toxicityRisk = "high";

  return {
    sentiment,
    sentimentScore,
    toxicityRisk,
    toxicityScore,
    matched: {
      positive: matchedPositive,
      negative: matchedNegative,
      toxic: matchedToxic,
    },
    latencyMs: Number((performance.now() - started).toFixed(2)),
    runtime: "browser-on-device",
  };
}
