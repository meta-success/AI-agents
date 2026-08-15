export type SkillId =
  | "nlp"
  | "computer-vision"
  | "audio-speech"
  | "multimodal"
  | "agents"
  | "rag"
  | "mlops"
  | "prompt-engineering"
  | "data-annotation"
  | "rlhf"
  | "fine-tuning"
  | "workflow"
  | "document-ai"
  | "predictive"
  | "ai-apis"
  | "generative"
  | "edge-ai"
  | "conversational"
  | "recommendations"
  | "ai-safety";

export type Skill = {
  id: SkillId;
  name: string;
  proof: string;
};

/** All Rework skills targeted by this portfolio app (20/20). */
export const SKILLS: Skill[] = [
  {
    id: "nlp",
    name: "Natural Language Processing",
    proof: "Entity extraction, sentiment, and keyword NLP desk",
  },
  {
    id: "computer-vision",
    name: "Computer Vision",
    proof: "Vision lab — OCR, objects, scene analysis via gpt-4o",
  },
  {
    id: "audio-speech",
    name: "Audio & Speech",
    proof: "Whisper transcription + TTS playback",
  },
  {
    id: "multimodal",
    name: "Multimodal AI",
    proof: "Joint text + image (+ audio) agent analysis",
  },
  {
    id: "agents",
    name: "AI Agents & Assistants",
    proof: "Autonomous Nexus analysis agent",
  },
  {
    id: "rag",
    name: "RAG Systems",
    proof: "GraphQL retrieval + document chunk context",
  },
  {
    id: "mlops",
    name: "MLOps & Deployment",
    proof: "Health checks, workflow telemetry, Vercel deploy",
  },
  {
    id: "prompt-engineering",
    name: "Prompt Engineering",
    proof: "Editable system prompts with strict output contracts",
  },
  {
    id: "data-annotation",
    name: "Data Annotation & Labeling",
    proof: "Label studio for text/image samples",
  },
  {
    id: "rlhf",
    name: "RLHF & Alignment",
    proof: "Thumbs feedback + preference pair collection",
  },
  {
    id: "fine-tuning",
    name: "Model Fine-tuning",
    proof: "Export JSONL training sets from labels & preferences",
  },
  {
    id: "workflow",
    name: "Workflow Automation",
    proof: "Multi-step sanitize → RAG → model → safety → format",
  },
  {
    id: "document-ai",
    name: "Document AI & Extraction",
    proof: "Structured field extraction from documents",
  },
  {
    id: "predictive",
    name: "Predictive Analytics",
    proof: "CSV trend forecast studio",
  },
  {
    id: "ai-apis",
    name: "AI Integration & APIs",
    proof: "Multiple Next.js AI route handlers",
  },
  {
    id: "generative",
    name: "Generative AI (Image/Video/Audio)",
    proof: "DALL·E image generation + speech synthesis",
  },
  {
    id: "edge-ai",
    name: "Edge AI / On-device ML",
    proof: "Browser-side sentiment & toxicity classifier",
  },
  {
    id: "conversational",
    name: "Conversational AI / Chatbots",
    proof: "Multi-turn chat studio",
  },
  {
    id: "recommendations",
    name: "Recommendation Systems",
    proof: "Context-aware next-action recommendations",
  },
  {
    id: "ai-safety",
    name: "AI Safety & Red Teaming",
    proof: "Moderation checks + adversarial red-team probes",
  },
];

export type StudioId =
  | "agent"
  | "chat"
  | "nlp"
  | "vision"
  | "speech"
  | "generate"
  | "document"
  | "predict"
  | "annotate"
  | "align"
  | "finetune"
  | "safety"
  | "edge"
  | "skills";

export type Studio = {
  id: StudioId;
  label: string;
  description: string;
  skills: SkillId[];
  group: "core" | "create" | "train" | "map";
};

export const STUDIOS: Studio[] = [
  {
    id: "agent",
    label: "Agent",
    description: "Multimodal RAG agent",
    skills: ["agents", "multimodal", "rag", "workflow", "prompt-engineering", "ai-apis", "mlops"],
    group: "core",
  },
  {
    id: "chat",
    label: "Chat",
    description: "Conversational assistant",
    skills: ["conversational", "nlp", "agents"],
    group: "core",
  },
  {
    id: "nlp",
    label: "NLP",
    description: "Language understanding",
    skills: ["nlp", "prompt-engineering"],
    group: "core",
  },
  {
    id: "vision",
    label: "Vision",
    description: "Computer vision lab",
    skills: ["computer-vision", "multimodal"],
    group: "core",
  },
  {
    id: "speech",
    label: "Speech",
    description: "Audio & speech",
    skills: ["audio-speech", "generative"],
    group: "create",
  },
  {
    id: "generate",
    label: "Generate",
    description: "Image generation",
    skills: ["generative", "prompt-engineering"],
    group: "create",
  },
  {
    id: "document",
    label: "Docs",
    description: "Document AI",
    skills: ["document-ai", "rag", "nlp"],
    group: "create",
  },
  {
    id: "predict",
    label: "Predict",
    description: "Forecasting",
    skills: ["predictive"],
    group: "create",
  },
  {
    id: "annotate",
    label: "Annotate",
    description: "Labeling desk",
    skills: ["data-annotation"],
    group: "train",
  },
  {
    id: "align",
    label: "Align",
    description: "RLHF feedback",
    skills: ["rlhf", "ai-safety"],
    group: "train",
  },
  {
    id: "finetune",
    label: "Fine-tune",
    description: "Training export",
    skills: ["fine-tuning", "data-annotation", "rlhf"],
    group: "train",
  },
  {
    id: "safety",
    label: "Safety",
    description: "Red teaming",
    skills: ["ai-safety", "rlhf"],
    group: "train",
  },
  {
    id: "edge",
    label: "Edge",
    description: "On-device ML",
    skills: ["edge-ai"],
    group: "train",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Coverage map",
    skills: [],
    group: "map",
  },
];
