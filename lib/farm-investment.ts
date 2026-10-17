import { SPECIES, type FarmInputs, type FarmResult } from "./farm-finance";

/**
 * Cash-flow screening, not a lender's appraisal. Assumes equivalent consecutive cycles,
 * no financing costs, no taxes, no large replacements, and a market at selected prices.
 */
export type Scenario = {
  label: string;
  survival: number;
  fcr: number;
  priceKg: number;
  fishSold: number;
  harvestKg: number;
  feedKg: number;
  sales: number;
  recurringOutlay: number;
  cashSurplus: number;
  paybackSeasons: number | null;
  paybackMonths: number | null;
};

export type InvestmentAnalysis = {
  initialCapital: number;
  recurringCycleOutlay: number;
  cashSurplusPerCycle: number;
  paybackSeasons: number | null;
  paybackMonths: number | null;
  scenarios: Scenario[];
};

function scenarios(inputs: FarmInputs, result: FarmResult): Scenario[] {
  const species = SPECIES[inputs.species];
  const capital = result.infrastructure * 1.1;
  const definitions = [
    { label: "Conservative", survivalFactor: .87, fcrFactor: 1.15, priceFactor: .9 },
    { label: "Expected", survivalFactor: 1, fcrFactor: 1, priceFactor: 1 },
    { label: "Optimistic", survivalFactor: 1.07, fcrFactor: .92, priceFactor: 1.1 },
  ];
  return definitions.map(s => {
    const survival = Math.min(.98, Math.max(.5, inputs.survival * s.survivalFactor));
    const fcr = inputs.fcr * s.fcrFactor;
    const priceKg = inputs.salePriceKg * s.priceFactor;
    // Scenario survival can vary around the base case, but harvest biomass must
    // stay inside the same culture-volume and recirculation screens.
    const screenVolume = inputs.mode === "existing"
      ? Math.min(result.volumeLitres, Math.max(0, inputs.actualFlowLph) / 1.25)
      : result.volumeLitres;
    const maxFishByDensity = Math.max(0, Math.floor(screenVolume / 1000 * species.densityKgM3 / inputs.harvestKgEach));
    const fishSold = Math.min(maxFishByDensity, Math.floor(result.fishStocked * survival));
    const harvestKg = fishSold * inputs.harvestKgEach;
    const feedKg = Math.max(0, (harvestKg - result.fishStocked * .025) * fcr * 1.08);
    const running = result.fingerlingsCost + feedKg * species.feedPriceKg +
      result.energyCost + result.supportCost + result.waterTestingCost;
    const recurringOutlay = running * 1.1;
    const sales = harvestKg * priceKg;
    const cashSurplus = sales - recurringOutlay;
    const paybackSeasons = cashSurplus > 0 ? Math.max(1, Math.ceil(capital / cashSurplus)) : null;
    return {
      label: s.label, survival, fcr, priceKg, fishSold, harvestKg, feedKg,
      sales, recurringOutlay, cashSurplus, paybackSeasons,
      paybackMonths: paybackSeasons === null ? null :
        Math.round(paybackSeasons * inputs.cycleDays / 30.4375),
    };
  });
}

export function evaluateInvestment(inputs: FarmInputs, result: FarmResult): InvestmentAnalysis {
  const alternatives = scenarios(inputs, result);
  const base = alternatives[1];
  return {
    initialCapital: result.infrastructure * 1.1,
    recurringCycleOutlay: base.recurringOutlay,
    cashSurplusPerCycle: base.cashSurplus,
    paybackSeasons: base.paybackSeasons,
    paybackMonths: base.paybackMonths,
    scenarios: alternatives,
  };
}
