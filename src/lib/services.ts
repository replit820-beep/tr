export type ServiceKey =
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "telegram"
  | "x"
  | "snapchat"
  | "linkedin";
export type ActionKey = "ban" | "unban";

export const SERVICES: {
  key: ServiceKey;
  name: string;
  prices: { ban: number; unban: number };
  accent: string;
  unbanOnly?: boolean;
}[] = [
  { key: "instagram", name: "Instagram", prices: { ban: 1500, unban: 1000 }, accent: "from-pink-500 to-orange-400" },
  { key: "facebook", name: "Facebook", prices: { ban: 1300, unban: 800 }, accent: "from-blue-500 to-indigo-500" },
  { key: "whatsapp", name: "WhatsApp", prices: { ban: 1800, unban: 2000 }, accent: "from-emerald-500 to-green-600" },
  { key: "telegram", name: "Telegram", prices: { ban: 3000, unban: 2700 }, accent: "from-sky-400 to-cyan-500" },
  { key: "x", name: "X", prices: { ban: 0, unban: 900 }, accent: "from-zinc-700 to-black", unbanOnly: true },
  { key: "snapchat", name: "Snapchat", prices: { ban: 1900, unban: 2200 }, accent: "from-yellow-300 to-yellow-500" },
  { key: "linkedin", name: "LinkedIn", prices: { ban: 2800, unban: 3200 }, accent: "from-sky-600 to-blue-700" },
];

export const SUPPORT_WHATSAPP = "+919278095923";
export const UPI_ID = "Wtfvinayak@fam";
export const USDT_BEP20 = "0x54e038cd2972e7df6d290ecee829a408a30132a5";

// 1 USDT = ₹X (update here when market rate changes)
export const USDT_INR_RATE = 98;

export function inrToUsdt(inr: number): string {
  return (inr / USDT_INR_RATE).toFixed(2);
}

export function formatDualPrice(inr: number): string {
  return `₹${inr.toLocaleString("en-IN")} · ${inrToUsdt(inr)} USDT`;
}

export function priceFor(service: ServiceKey, action: ActionKey): number {
  const s = SERVICES.find((s) => s.key === service)!;
  return s.prices[action];
}