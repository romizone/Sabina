import { APP_HOST, PUBLIC_MODEL_NAME } from "@/lib/config";
import { hasDeepseekKey } from "@/lib/deepseek";
import { ragStats } from "@/lib/rag";

export async function GET() {
  const stats = ragStats();
  return Response.json({
    ok: true,
    service: "sabina",
    host: APP_HOST,
    model: PUBLIC_MODEL_NAME,
    deepseekConfigured: hasDeepseekKey(),
    sopCount: stats.sop,
    serviceDocs: stats.service,
    ragTotal: stats.totalIndexed,
    time: new Date().toISOString(),
  });
}
