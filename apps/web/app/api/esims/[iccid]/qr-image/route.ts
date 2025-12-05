import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { iccid: string } }
) {
  try {
    const iccid = params.iccid;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const userEmail = request.headers.get("x-user-email") || "";

    const response = await fetch(`${apiUrl}/esim/${iccid}`, {
      headers: {
        "x-user-email": userEmail,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch eSIM profile" },
        { status: response.status }
      );
    }

    const profile = await response.json();
    const qrCodeUrl = profile.qrCodeUrl;

    if (!qrCodeUrl) {
      return NextResponse.json(
        { error: "QR code URL not found" },
        { status: 404 }
      );
    }

    const qrResponse = await fetch(qrCodeUrl, {
      headers: {
        Accept: "image/*",
      },
      cache: "no-store",
    });

    if (!qrResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch QR code image" },
        { status: qrResponse.status }
      );
    }

    const imageBuffer = await qrResponse.arrayBuffer();
    const contentType = qrResponse.headers.get("content-type") || "image/png";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": `inline; filename="voyage-esim-${iccid}.png"`,
      },
    });
  } catch (error) {
    console.error("QR image proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

