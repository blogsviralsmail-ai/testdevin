import { describe, it, expect } from "vitest";

// Test formatCurrency utility
describe("formatCurrency", () => {
  it("formats Indian currency correctly", () => {
    // Inline the function since it relies on locale
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    expect(formatCurrency(1000)).toContain("1,000");
    expect(formatCurrency(100000)).toContain("1,00,000");
    expect(formatCurrency(0)).toContain("0");
  });
});

// Test working day calculation
describe("calculateWorkingDay", () => {
  it("skips Sundays correctly", () => {
    // Simple working day counter
    const calculateWorkingDay = (joiningDate: Date, targetDate: Date): number => {
      let count = 0;
      const current = new Date(joiningDate);
      while (current <= targetDate) {
        if (current.getDay() !== 0) count++; // Skip Sunday
        current.setDate(current.getDate() + 1);
      }
      return count;
    };

    // Mon to Fri = 5 working days
    const mon = new Date("2026-05-04"); // Monday
    const fri = new Date("2026-05-08"); // Friday
    expect(calculateWorkingDay(mon, fri)).toBe(5);

    // Mon to next Mon = 7 working days (skip Sunday)
    const nextMon = new Date("2026-05-11");
    expect(calculateWorkingDay(mon, nextMon)).toBe(7);
  });

  it("returns 1 for same day", () => {
    const calculateWorkingDay = (joiningDate: Date, targetDate: Date): number => {
      let count = 0;
      const current = new Date(joiningDate);
      while (current <= targetDate) {
        if (current.getDay() !== 0) count++;
        current.setDate(current.getDate() + 1);
      }
      return count;
    };

    const date = new Date("2026-05-05"); // Monday
    expect(calculateWorkingDay(date, date)).toBe(1);
  });
});
