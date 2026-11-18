import { NextResponse } from "next/server";
import { DataStore } from "@/lib/storage";

// Scheduled background task endpoint (simulating Supabase Edge Function / cron for 24h auto-cancel)
export async function GET() {
  try {
    const cancelledCount = DataStore.checkAndCancelExpiredOrders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cancelled_orders_count: cancelledCount,
      message: `Berhasil memproses auto-cancel 24 jam untuk ${cancelledCount} pesanan.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "CRON_FAILED", message: err.message },
      { status: 500 }
    );
  }
}
