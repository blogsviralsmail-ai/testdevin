"use client";
import { useState } from "react";
import Script from "next/script";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PlanProps {
  plan: {
    id: string;
    name: string;
    slug: string;
    priceMonthly: number;
    priceAnnual: number | null;
    conversationsQuota: number;
    features: string;
    isPopular: boolean;
    current: boolean;
  };
  razorpayConfigured: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export function BillingClient({ plan, razorpayConfigured }: PlanProps) {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);

  async function subscribe(cycle: "monthly" | "annual") {
    setLoading(cycle);
    try {
      const orderRes = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug, cycle }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        toast.error(order.error || "Couldn't start checkout");
        return;
      }
      if (typeof window === "undefined" || !window.Razorpay) {
        toast.error("Razorpay script not loaded yet — refresh and try again.");
        return;
      }
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Dealism",
        description: `${plan.name} — ${cycle}`,
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
              planSlug: plan.slug,
            }),
          });
          if (verifyRes.ok) {
            toast.success(`Upgraded to ${plan.name}!`);
            setTimeout(() => window.location.reload(), 1200);
          } else {
            const data = await verifyRes.json();
            toast.error(data.error || "Verification failed");
          }
        },
        theme: { color: "#ea580c" },
      });
      rzp.open();
    } finally {
      setLoading(null);
    }
  }

  const features = plan.features
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Card className={plan.isPopular ? "border-orange-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{plan.name}</span>
            {plan.current && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Current
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-3xl font-bold">
            ₹{plan.priceMonthly}
            <span className="text-base font-normal text-neutral-500">/mo</span>
          </div>
          <p className="text-sm text-neutral-600">
            {plan.conversationsQuota.toLocaleString()} conversations / month
          </p>
          {features.length > 0 && (
            <ul className="space-y-1 text-sm text-neutral-700">
              {features.map((f, i) => (
                <li key={i}>• {f}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              disabled={!razorpayConfigured || plan.current || loading !== null || plan.priceMonthly <= 0}
              onClick={() => subscribe("monthly")}
            >
              {loading === "monthly" ? "..." : plan.priceMonthly <= 0 ? "Free" : "Pay monthly"}
            </Button>
            {plan.priceAnnual ? (
              <Button
                variant="outline"
                disabled={!razorpayConfigured || plan.current || loading !== null}
                onClick={() => subscribe("annual")}
              >
                {loading === "annual" ? "..." : `Pay annually (₹${plan.priceAnnual})`}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
