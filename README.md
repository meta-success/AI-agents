# Nexus Agent — Smart AI Agent Dashboard

Multimodal AI agent dashboard built with **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **OpenAI gpt-4o**, **GraphQL**, and a multi-step analysis workflow.

## Features

- Dark-theme dashboard UI (React + TypeScript)
- `/api/agent` REST endpoint backed by OpenAI
- GraphQL RAG enrichment via `graphql-request`
- 3-step workflow: sanitize → retrieve + analyze → format
- Prompt-engineered multimodal system prompt
- Optional image upload for vision analysis

## Setup

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Set environment variable `OPENAI_API_KEY`.
4. Deploy.

## Skills demonstrated

| Skill | Implementation |
| --- | --- |
| React / TypeScript | `src/app/page.tsx` dashboard |
| Generative AI | OpenAI `gpt-4o` (text + image) |
| AI Agents | Autonomous analysis agent via `/api/agent` |
| AI Integration & APIs | Custom Next.js route handler |
| GraphQL | `src/lib/graphql.ts` + RAG retrieval |
| Workflow Automation | `src/lib/workflow.ts` |
| Prompt Engineering | `src/lib/prompts.ts` |
| MLOps & Deployment | Vercel-ready production app |
| RAG Systems | User input + GraphQL context passed to the model |
