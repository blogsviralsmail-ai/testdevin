import QRCode from "qrcode";

/**
 * Generate a QR code as a base64 data URI string.
 * Use this instead of external QR APIs (e.g., api.qrserver.com).
 */
export async function generateQRDataUri(data: string, size: number = 70): Promise<string> {
  return QRCode.toDataURL(data, {
    width: size,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
