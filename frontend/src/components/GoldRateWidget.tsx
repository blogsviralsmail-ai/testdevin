import { useEffect, useState } from "react";
import { getGoldRate } from "../api";
import { GoldRate } from "../types";
import { TrendingUp, RefreshCw } from "lucide-react";

export default function GoldRateWidget() {
  const [rate, setRate] = useState<GoldRate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGoldRate()
      .then((res) => setRate(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-yellow-200 rounded w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-yellow-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!rate) return null;

  const items = [
    { label: "सोना 24K", labelEn: "Gold 24K", value: rate.gold_24k, unit: "₹/ग्राम", color: "from-yellow-500 to-amber-500" },
    { label: "सोना 22K", labelEn: "Gold 22K", value: rate.gold_22k, unit: "₹/ग्राम", color: "from-yellow-600 to-orange-500" },
    { label: "सोना 18K", labelEn: "Gold 18K", value: rate.gold_18k, unit: "₹/ग्राम", color: "from-amber-500 to-yellow-600" },
    { label: "चांदी", labelEn: "Silver", value: rate.silver_rate, unit: "₹/ग्राम", color: "from-gray-400 to-gray-500" },
  ];

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-600" />
          <h2 className="text-lg font-bold text-gray-800">
            आज का सोने का भाव - {rate.city}
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <RefreshCw className="w-3 h-3" />
          {new Date(rate.date).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`bg-gradient-to-br ${item.color} rounded-xl p-4 text-white shadow-lg`}
          >
            <p className="text-xs font-medium opacity-90">{item.label}</p>
            <p className="text-2xl font-bold mt-1">₹{item.value.toLocaleString("en-IN")}</p>
            <p className="text-[10px] opacity-75 mt-1">{item.unit}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
