import { NextRequest, NextResponse } from "next/server";
import { DataStore } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity = 1, shippingAddress, customerContact, buyerId } = body;

    if (!productId || !shippingAddress || !customerContact) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Data produk, kontak, dan alamat wajib diisi." },
        { status: 400 }
      );
    }

    const result = DataStore.createOrder({
      productId,
      quantity,
      shippingAddress,
      customerContact,
      buyerId: buyerId || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "INSUFFICIENT_STOCK", message: result.error || "Gagal membuat pesanan." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: result.order?.id,
      status: result.order?.status,
      total_price: result.order?.total_price,
      expires_at: result.order?.expires_at,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message || "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
