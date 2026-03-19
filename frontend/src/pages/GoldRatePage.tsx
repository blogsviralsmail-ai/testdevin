import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { getGoldRate, getGoldRateHistory } from "../api";
import { GoldRate } from "../types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import AdBanner from "../components/AdBanner";

export default function GoldRatePage() {
  const [rate, setRate] = useState<GoldRate | null>(null);
  const [history, setHistory] = useState<GoldRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getGoldRate(), getGoldRateHistory(30)])
      .then(([r, h]) => { setRate(r.data); setHistory(h.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const prevRate = history.length > 1 ? history[history.length - 2] : null;
  const change24k = rate && prevRate ? rate.gold_24k - prevRate.gold_24k : 0;

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("hi-IN", { day: "numeric", month: "short" }),
    "24K": h.gold_24k,
    "22K": h.gold_22k,
    "18K": h.gold_18k,
    "चांदी": h.silver_rate,
  }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>आज का सोने का भाव जयपुर - Gold Rate Today Jaipur | आभूषण बाज़ार</title>
        <meta name="description" content={`आज सोने का भाव जयपुर: 24K ₹${rate?.gold_24k}/ग्राम, 22K ₹${rate?.gold_22k}/ग्राम। चांदी का भाव ₹${rate?.silver_rate}/ग्राम। रोज़ अपडेट होने वाले भाव।`} />
        <meta name="keywords" content="सोने का भाव, gold rate today jaipur, aaj ka sone ka bhav, 22 carat gold price, चांदी का भाव" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">आज का सोने का भाव — {rate?.city}</h1>
          <p className="text-gray-500 mt-1">Gold Rate Today — {rate?.date && new Date(rate.date).toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>

        {/* Current Rates */}
        {rate && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "सोना 24K", labelEn: "Gold 24K", value: rate.gold_24k, color: "from-yellow-500 to-amber-500" },
              { label: "सोना 22K", labelEn: "Gold 22K", value: rate.gold_22k, color: "from-yellow-600 to-orange-500" },
              { label: "सोना 18K", labelEn: "Gold 18K", value: rate.gold_18k, color: "from-amber-500 to-yellow-600" },
              { label: "चांदी", labelEn: "Silver", value: rate.silver_rate, color: "from-gray-400 to-gray-500" },
            ].map((item) => (
              <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-xl p-5 text-white shadow-lg`}>
                <p className="text-sm font-medium opacity-90">{item.label}</p>
                <p className="text-xs opacity-75">{item.labelEn}</p>
                <p className="text-3xl font-bold mt-2">₹{item.value.toLocaleString("en-IN")}</p>
                <p className="text-xs opacity-75 mt-1">प्रति ग्राम</p>
              </div>
            ))}
          </div>
        )}

        {/* Change Indicator */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 flex items-center gap-4">
          {change24k > 0 ? (
            <TrendingUp className="w-8 h-8 text-green-500" />
          ) : change24k < 0 ? (
            <TrendingDown className="w-8 h-8 text-red-500" />
          ) : (
            <Minus className="w-8 h-8 text-gray-400" />
          )}
          <div>
            <p className="font-semibold text-gray-800">
              कल से {change24k > 0 ? "बढ़ा" : change24k < 0 ? "घटा" : "कोई बदलाव नहीं"}
            </p>
            <p className={`text-lg font-bold ${change24k > 0 ? "text-green-600" : change24k < 0 ? "text-red-600" : "text-gray-500"}`}>
              {change24k > 0 ? "+" : ""}{change24k.toFixed(2)} ₹/ग्राम (24K)
            </p>
          </div>
        </div>

        <AdBanner slot="gold-rate-mid" />

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">पिछले 30 दिनों का सोने का भाव</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="24K" stroke="#EAB308" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="22K" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="18K" stroke="#D97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Rate Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <h2 className="text-xl font-bold text-gray-800 p-6 pb-0">दैनिक सोने का भाव — तालिका</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-yellow-50">
                  <th className="text-left p-3 font-semibold text-gray-700">तारीख</th>
                  <th className="text-right p-3 font-semibold text-gray-700">सोना 24K</th>
                  <th className="text-right p-3 font-semibold text-gray-700">सोना 22K</th>
                  <th className="text-right p-3 font-semibold text-gray-700">सोना 18K</th>
                  <th className="text-right p-3 font-semibold text-gray-700">चांदी</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().slice(0, 30).map((h, i) => (
                  <tr key={h.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3">{new Date(h.date).toLocaleDateString("hi-IN")}</td>
                    <td className="p-3 text-right font-medium">₹{h.gold_24k.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right">₹{h.gold_22k.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right">₹{h.gold_18k.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right">₹{h.silver_rate.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AdBanner slot="gold-rate-bottom" />

        {/* SEO Content */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">सोने के भाव के बारे में जानकारी</h2>
          <div className="prose prose-sm text-gray-600 space-y-3">
            <p>
              <strong>सोने का भाव</strong> हर दिन बदलता रहता है। यहाँ आपको जयपुर शहर का आज का सोने का भाव (Gold Rate Today Jaipur) मिलेगा। 
              हम रोज़ सोने और चांदी के भाव अपडेट करते हैं ताकि आप सही समय पर खरीदारी का फैसला ले सकें।
            </p>
            <p>
              <strong>24 कैरेट सोना (24K Gold)</strong> सबसे शुद्ध सोना होता है जिसमें 99.9% शुद्ध सोना होता है। 
              <strong>22 कैरेट सोना (22K Gold)</strong> में 91.67% सोना और बाकी अन्य धातुएं मिली होती हैं — 
              यह ज्वेलरी बनाने के लिए सबसे ज़्यादा इस्तेमाल होता है। <strong>18 कैरेट सोना (18K Gold)</strong> में 75% शुद्ध सोना होता है।
            </p>
            <p>
              सोने के भाव अंतर्राष्ट्रीय बाज़ार, डॉलर की कीमत, सरकारी नीतियों और मांग-आपूर्ति पर निर्भर करते हैं।
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
