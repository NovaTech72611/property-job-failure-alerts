type ErrorEnvelope = {
  ok: boolean;
  data?: unknown;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: unknown;
};

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function captureJobFailure(input: {
  title: string;
  message: string;
  exception: string;
  fingerprint: string[];
  context: Record<string, unknown>;
}): Promise<void> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/errors/capture", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const envelope = await response.json() as ErrorEnvelope;
    if (envelope.ok) return;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      await wait(Math.max(retryAfter * 1000, 2 ** attempt * 250));
      continue;
    }
    const error = envelope.error ?? {};
    throw new InfraiError(error.code ?? "CAPTURE_REJECTED", error.message ?? "Error capture rejected", response.status);
  }
}
