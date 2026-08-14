export type AnnotationRecord = {
  id: string;
  text: string;
  label: string;
  notes?: string;
  createdAt: string;
};

export type PreferencePair = {
  id: string;
  prompt: string;
  chosen: string;
  rejected: string;
  createdAt: string;
};

export type FeedbackRecord = {
  id: string;
  response: string;
  rating: "up" | "down";
  comment?: string;
  createdAt: string;
};

const ANNOTATIONS_KEY = "nexus.annotations";
const PREFERENCES_KEY = "nexus.preferences";
const FEEDBACK_KEY = "nexus.feedback";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function listAnnotations() {
  return read<AnnotationRecord[]>(ANNOTATIONS_KEY, []);
}

export function saveAnnotation(record: Omit<AnnotationRecord, "id" | "createdAt">) {
  const next: AnnotationRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = [next, ...listAnnotations()];
  write(ANNOTATIONS_KEY, all);
  return next;
}

export function deleteAnnotation(id: string) {
  write(
    ANNOTATIONS_KEY,
    listAnnotations().filter((a) => a.id !== id)
  );
}

export function listPreferences() {
  return read<PreferencePair[]>(PREFERENCES_KEY, []);
}

export function savePreference(record: Omit<PreferencePair, "id" | "createdAt">) {
  const next: PreferencePair = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = [next, ...listPreferences()];
  write(PREFERENCES_KEY, all);
  return next;
}

export function listFeedback() {
  return read<FeedbackRecord[]>(FEEDBACK_KEY, []);
}

export function saveFeedback(record: Omit<FeedbackRecord, "id" | "createdAt">) {
  const next: FeedbackRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = [next, ...listFeedback()];
  write(FEEDBACK_KEY, all);
  return next;
}

/** Build OpenAI fine-tuning JSONL from annotations + preference pairs. */
export function buildFineTuneJsonl() {
  const lines: string[] = [];

  for (const a of listAnnotations()) {
    lines.push(
      JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a labeling assistant. Classify the user text with the correct label.",
          },
          { role: "user", content: a.text },
          {
            role: "assistant",
            content: JSON.stringify({ label: a.label, notes: a.notes ?? "" }),
          },
        ],
      })
    );
  }

  for (const p of listPreferences()) {
    lines.push(
      JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are an aligned assistant. Prefer helpful, safe, precise answers.",
          },
          { role: "user", content: p.prompt },
          { role: "assistant", content: p.chosen },
        ],
      })
    );
  }

  return lines.join("\n");
}
