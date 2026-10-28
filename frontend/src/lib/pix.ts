// Pix "Copia e Cola" payload builder — EMV® QRCPS-MPM as specified by Banco Central do Brasil (BR Code).
// The amount (tag 54) is embedded so the payer's bank app pre-fills the exact plan price.

export const PIX_KEY = "a1152707-4ec6-4605-947a-b09ab548feb6";
const MERCHANT_NAME = "KMCONTROL";
const MERCHANT_CITY = "SAO PAULO";

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

// CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — required checksum for tag 63.
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max);
}

export function buildPixPayload(amount: number, txid: string, key: string = PIX_KEY): string {
  const account = tlv("00", "br.gov.bcb.pix") + tlv("01", key);
  const cleanTxid = txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const body =
    tlv("00", "01") +
    tlv("26", account) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount.toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", sanitize(MERCHANT_NAME, 25)) +
    tlv("60", sanitize(MERCHANT_CITY, 15)) +
    tlv("62", tlv("05", cleanTxid)) +
    "6304";
  return body + crc16(body);
}
