"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash, Plus } from "lucide-react";

interface PlanDraft {
  id?: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceAnnual: number | null;
  conversationsQuota: number;
  features: string;
  isPopular: boolean;
  sortOrder: number;
}

export function PlansEditor({ initialPlans }: { initialPlans: Plan[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanDraft[]>(
    initialPlans.length
      ? initialPlans.map((p) => ({ ...p, priceAnnual: p.priceAnnual ?? null }))
      : [
          { name: "Starter", slug: "monthly_basic", priceMonthly: 19, priceAnnual: null, conversationsQuota: 1000, features: JSON.stringify(["1,000 conversations / month", "Unlimited agents", "Multilingual"]), isPopular: false, sortOrder: 0 },
          { name: "Pro", slug: "monthly_pro", priceMonthly: 39, priceAnnual: null, conversationsQuota: 2000, features: JSON.stringify(["2,000 conversations / month", "Unlimited agents", "Priority support"]), isPopular: true, sortOrder: 1 },
        ]
  );

  function update(i: number, patch: Partial<PlanDraft>) {
    setPlans(plans.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function addPlan() {
    setPlans([...plans, { name: "New plan", slug: `plan_${Date.now()}`, priceMonthly: 0, priceAnnual: null, conversationsQuota: 100, features: JSON.stringify([]), isPopular: false, sortOrder: plans.length }]);
  }

  function removePlan(i: number) {
    if (!confirm("Remove this plan?")) return;
    setPlans(plans.filter((_, idx) => idx !== i));
  }

  async function saveAll() {
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans }),
    });
    if (res.ok) {
      toast.success("Saved");
      router.refresh();
    } else toast.error("Failed");
  }

  return (
    <div className="space-y-6">
      {plans.map((p, i) => {
        let featuresList: string[] = [];
        try { featuresList = JSON.parse(p.features); } catch {}
        return (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{p.name}</CardTitle>
                <button onClick={() => removePlan(i)} className="text-red-500 hover:text-red-700"><Trash className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={p.name} onChange={(e) => update(i, { name: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={p.slug} onChange={(e) => update(i, { slug: e.target.value })} />
              </div>
              <div>
                <Label>Price (monthly, $)</Label>
                <Input type="number" value={p.priceMonthly} onChange={(e) => update(i, { priceMonthly: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Price (annual, $ total)</Label>
                <Input type="number" value={p.priceAnnual ?? ""} onChange={(e) => update(i, { priceAnnual: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label>Conversations quota</Label>
                <Input type="number" value={p.conversationsQuota} onChange={(e) => update(i, { conversationsQuota: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={p.sortOrder} onChange={(e) => update(i, { sortOrder: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  rows={5}
                  value={featuresList.join("\n")}
                  onChange={(e) => update(i, { features: JSON.stringify(e.target.value.split("\n").filter(Boolean)) })}
                />
              </div>
              <label className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" checked={p.isPopular} onChange={(e) => update(i, { isPopular: e.target.checked })} />
                <span className="text-sm">Highlight as most popular</span>
              </label>
            </CardContent>
          </Card>
        );
      })}
      <div className="flex gap-3">
        <Button variant="outline" onClick={addPlan}><Plus className="h-4 w-4 mr-2" />Add plan</Button>
        <Button variant="primary" onClick={saveAll}>Save all plans</Button>
      </div>
    </div>
  );
}
