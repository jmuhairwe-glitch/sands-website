import { NextRequest, NextResponse } from "next/server";
import { DEFAULTS, SPECIES, simulateFarm, type FarmInputs } from "../../../lib/farm-finance";
import { evaluateInvestment } from "../../../lib/farm-investment";
import { generateFarmProposal, type ApplicantDetails } from "../../../lib/finance-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const numeric: (keyof FarmInputs)[] = [
  "budget", "tankLitres", "tankCount", "actualFlowLph", "fcr",
  "survival", "harvestKgEach", "salePriceKg", "cycleDays", "electricityTariff",
  "pumpWatts", "aerationWattsPerTank", "waterExchangePct", "waterCostPer1000L",
  "starterBagKgPerTank",
];
const flags: (keyof FarmInputs)[] = ["biofilterPresent", "aerationPresent", "backupPresent"];
const text = (x: unknown, limit: number) =>
  typeof x === "string" ? x.replace(/[\u0000-\u001f<>]/g, " ").slice(0, limit).trim() : "";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > 12000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid proposal input" }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;
    const given = payload.inputs as Partial<FarmInputs> | undefined;
    const details = payload.applicant as Partial<ApplicantDetails> | undefined;
    if (!given || typeof given !== "object" || !details || typeof details !== "object") {
      return NextResponse.json({ error: "Missing project selections" }, { status: 400 });
    }
    const input: FarmInputs = { ...DEFAULTS };
    for (const key of numeric) {
      const value = given[key];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return NextResponse.json({ error: "Invalid figure: " + key }, { status: 400 });
      }
      // All numeric input bounds match the browser controls.
      (input as unknown as Record<string, number>)[key] = value;
    }
    if (!["catfish", "tilapia"].includes(String(given.species))) {
      return NextResponse.json({ error: "Invalid species" }, { status: 400 });
    }
    if (!["new", "existing"].includes(String(given.mode))) {
      return NextResponse.json({ error: "Invalid project mode" }, { status: 400 });
    }
    input.mode = given.mode as FarmInputs["mode"];
    input.species = given.species as keyof typeof SPECIES;
    for (const flag of flags) {
      (input as unknown as Record<string, boolean>)[flag] = given[flag] === true;
    }
    if (input.budget < 3_000_000 || input.budget > 100_000_000 ||
        input.tankLitres < 500 || input.tankLitres > 100_000 ||
        input.tankCount < 1 || input.tankCount > 100 ||
        input.actualFlowLph < 0 || input.actualFlowLph > 3_000_000 ||
        input.fcr < 1 || input.fcr > 2.8 ||
        input.survival < .5 || input.survival > .98 ||
        input.harvestKgEach < .3 || input.harvestKgEach > 2 ||
        input.salePriceKg < 1000 || input.salePriceKg > 50_000 ||
        input.cycleDays < 90 || input.cycleDays > 365 ||
        input.electricityTariff < 100 || input.electricityTariff > 2500 ||
        input.pumpWatts < 50 || input.pumpWatts > 10000 ||
        input.aerationWattsPerTank < 0 || input.aerationWattsPerTank > 3000 ||
        input.waterExchangePct < 20 || input.waterExchangePct > 100 ||
        input.waterCostPer1000L < 0 || input.waterCostPer1000L > 100000 ||
        input.starterBagKgPerTank < 0 || input.starterBagKgPerTank > 100) {
      return NextResponse.json({ error: "One or more values are outside the planning limits" }, { status: 400 });
    }
    const ownContribution = details.contribution;
    if (typeof ownContribution !== "number" || !Number.isFinite(ownContribution) ||
        ownContribution < 0 || ownContribution > 100_000_000) {
      return NextResponse.json({ error: "Invalid contribution amount" }, { status: 400 });
    }
    const applicant: ApplicantDetails = {
      name: text(details.name, 100),
      projectName: text(details.projectName, 120),
      location: text(details.location, 120),
      contact: text(details.contact, 100),
      financier: text(details.financier, 120),
      notes: text(details.notes, 700),
      contribution: ownContribution,
    };
    const result = simulateFarm(input);
    const investment = evaluateInvestment(input, result);
    const pdf = generateFarmProposal(input, result, investment, applicant);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"SANDS-Fish-Farm-Funding-Proposal.pdf\"",
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not generate the proposal. Check your entries." }, { status: 400 });
  }
}


// Public, clearly labelled sample for reviewing the PDF layout without entering personal information.
export async function GET(request: NextRequest) {
  if (new URL(request.url).searchParams.get("sample") !== "1") {
    return NextResponse.json({ error: "Use the simulator to prepare your PDF." }, { status: 405 });
  }
  const input = { ...DEFAULTS };
  const result = simulateFarm(input);
  const sample = generateFarmProposal(input, result, evaluateInvestment(input, result), {
    name: "SAMPLE APPLICANT",
    projectName: "Sample Catfish Farming Project",
    location: "Uganda - site to be assessed",
    contact: "Not provided",
    financier: "Prospective lender or investor",
    contribution: 2_000_000,
    notes: "SAMPLE ONLY - figures do not represent an approved farm design, quote or loan.",
  });
  return new Response(new Uint8Array(sample), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"SANDS-Sample-Funding-Proposal.pdf\"",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
