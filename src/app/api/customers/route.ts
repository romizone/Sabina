import { listCustomers } from "@/lib/data/customers";
import { TRANSACTION_LOOKBACK_YEARS } from "@/lib/config";
import { ragStats } from "@/lib/rag";

export async function GET() {
  const stats = ragStats();
  return Response.json({
    customers: listCustomers(),
    sopCount: stats.sop,
    serviceDocs: stats.service,
    lookbackYears: TRANSACTION_LOOKBACK_YEARS,
    generatedAt: new Date().toISOString(),
  });
}
