import { NextRequest, NextResponse } from "next/server";
import net from "net";
import { buildZpl } from "@/components/ui/products/labels/zplGenerator";

// Only allow RFC1918 private addresses + loopback — prevents SSRF against public internet
function isPrivateIp(ip: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false;
  const parts = ip.split(".").map(Number);
  if (parts.some(n => n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function sendZpl(ip: string, zpl: string, port = 9100): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      err ? reject(err) : resolve();
    };
    socket.setTimeout(6000);
    socket.connect(port, ip, () => {
      socket.write(zpl, "utf8", (err) => {
        if (err) { done(err); return; }
        socket.end(() => done());
      });
    });
    socket.on("error", done);
    socket.on("timeout", () => done(new Error("Printer not responding (timeout)")));
  });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    printerIp: string;
    printerPort?: number;
    template: Parameters<typeof buildZpl>[0];
    data: Parameters<typeof buildZpl>[1];
    fieldConfigs: Parameters<typeof buildZpl>[2];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  if (!body.printerIp) {
    return NextResponse.json({ success: false, error: "Printer IP required" }, { status: 400 });
  }
  if (!isPrivateIp(body.printerIp)) {
    return NextResponse.json(
      { success: false, error: "Printer IP must be a local network address (192.168.x.x, 10.x.x.x, etc.)" },
      { status: 400 }
    );
  }

  try {
    const zpl = buildZpl(body.template, body.data, body.fieldConfigs);
    await sendZpl(body.printerIp, zpl, body.printerPort ?? 9100);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Print failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
