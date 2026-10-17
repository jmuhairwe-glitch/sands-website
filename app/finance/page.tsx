import type { Metadata } from "next";
import FinanceCalculator from "./FinanceCalculator";
import "./finance.css";

export const metadata: Metadata = {
  title: "Fish Farm Budget Simulator | SANDS Fish Farm Uganda",
  description: "Choose your fish-farming budget or enter tanks you already own. Estimate fingerlings, full-cycle feed, circulation, filtration loads and project costs before requesting a SANDS assessment.",
  alternates: { canonical: "https://sands.co.ug/finance" },
};

export default function FinancePage() {
  return <FinanceCalculator />;
}
