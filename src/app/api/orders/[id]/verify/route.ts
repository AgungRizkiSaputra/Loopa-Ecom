import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/lib/storage";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json();
    const { action, reason } = body;

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { error: "INVALID_ACTION", message: "Action harus berupa 'approve' atau 'reject'." },
        { status: 400 }
      );
    }

    const updated = DataStore.verifyOrder(orderId, action, reason);
    if (!updated) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: updated.id,
      status: updated.status,
      rejection_reason: updated.rejection_reason,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
