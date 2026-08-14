import { chatText, jsonError } from "@/lib/openai-client";
import { PREDICT_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { csv, horizon } = (await request.json()) as {
      csv?: string;
      horizon?: number;
    };

    if (!csv?.trim()) return jsonError("csv is required", 400);

    const series = parseNumericSeries(csv);
    const baseline = baselineForecast(series, horizon || 3);

    const narrative = await chatText(
      PREDICT_PROMPT,
      `CSV:\n${csv.slice(0, 6000)}\n\nBaseline forecast: ${JSON.stringify(baseline)}`,
      { model: "gpt-4o-mini", temperature: 0.2 }
    );

    return Response.json({
      success: true,
      series,
      forecast: baseline,
      narrative,
      skill: "Predictive Analytics",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Predict failed");
  }
}

function parseNumericSeries(csv: string) {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const values: number[] = [];
  for (const line of lines) {
    const parts = line.split(/[,\t;]/);
    const num = Number(parts[parts.length - 1]);
    if (!Number.isNaN(num)) values.push(num);
  }

  if (values.length < 3) {
    throw new Error("Need at least 3 numeric rows in CSV (last column = value).");
  }

  return values;
}

function baselineForecast(series: number[], horizon: number) {
  const n = series.length;
  const last = series[n - 1];
  const prev = series[n - 2];
  const slope = last - prev;
  const forecast: number[] = [];
  for (let i = 1; i <= horizon; i++) {
    forecast.push(Number((last + slope * i).toFixed(3)));
  }
  return {
    method: "linear-extrapolation",
    next: forecast,
    lastValue: last,
    slope,
  };
}
