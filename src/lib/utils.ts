import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function calcProfit({
  buyPrice,
  sellPrice,
  shippingCost = 0,
  taxes = 0,
  platformFeePercent = 0,
  extraCosts = 0,
}: {
  buyPrice: number;
  sellPrice: number;
  shippingCost?: number;
  taxes?: number;
  platformFeePercent?: number;
  extraCosts?: number;
}) {
  const platformFee = (sellPrice * platformFeePercent) / 100;
  const totalFees = shippingCost + taxes + platformFee + extraCosts;
  const totalCost = buyPrice + totalFees;
  const netProfit = sellPrice - totalCost;
  const profitMargin = sellPrice > 0 ? (netProfit / sellPrice) * 100 : 0;

  let rating: "excellent" | "good" | "decent" | "bad" | "loss";
  if (profitMargin >= 30) rating = "excellent";
  else if (profitMargin >= 20) rating = "good";
  else if (profitMargin >= 10) rating = "decent";
  else if (profitMargin >= 0) rating = "bad";
  else rating = "loss";

  return { platformFee, totalFees, totalCost, netProfit, profitMargin, rating };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "In Stock": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "Listed": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "Sold": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "Shipped": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
    default: return "text-text-secondary bg-bg-elevated border-bg-border";
  }
}

export function getRatingColor(rating: string): string {
  switch (rating) {
    case "excellent": return "text-emerald-400";
    case "good": return "text-green-400";
    case "decent": return "text-amber-400";
    case "bad": return "text-orange-400";
    case "loss": return "text-red-400";
    default: return "text-text-secondary";
  }
}

export function getRatingLabel(rating: string): string {
  switch (rating) {
    case "excellent": return "🔥 Excellent Flip";
    case "good": return "✅ Good Deal";
    case "decent": return "⚠️ Decent";
    case "bad": return "🟡 Thin Margins";
    case "loss": return "❌ Taking a Loss";
    default: return "—";
  }
}
