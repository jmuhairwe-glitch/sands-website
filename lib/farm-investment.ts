import { SPECIES, type FarmInputs, type FarmResult } from "./farm-finance";

/**
 * First-season cash recovery and repeat-cycle economics, not a credit decision.
 * Inclusive SANDS packages bundle the initial fingerlings and starter bag:
 * these are not bought twice in the first cycle, but must be bought again in
 * later cycles. Assumes all cash outflows occur before harvest for each season.
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
  firstCycleOutlay: number;
  firstCycleCashResult: number;
  recurringOutlay: number;
  cashSurplus: number;
  paybackSeasons: number | null;
  paybackMonths: number | null;
};

export type SeasonCashFlow = {
  season: number;
  sales: number;
  totalOutlay: number;
  seasonCashResult: number;
  cumulativeCash: number;
  recovered: boolean;
};

export type InvestmentAnalysis = {
  initialCapital: number; // total first-cycle outlay, not unbundled hardware price
  firstCycleCashResult: number;
  recurringCycleOutlay: number;
  cashSurplusPerCycle: number;
  paybackSeasons: number | null;
  paybackMonths: number | null;
  scenarios: Scenario[];
  cashFlow: SeasonCashFlow[];
};

function scenarios(inputs: FarmInputs, result: FarmResult): Scenario[] {
  const species = SPECIES[inputs.species];
  const definitions = [
    { label: "Conservative", survivalFactor: .87, fcrFactor: 1.15, priceFactor: .9 },
    { label: "Expected", survivalFactor: 1, fcrFactor: 1, priceFactor: 1 },
    { label: "Optimistic", survivalFactor: 1.07, fcrFactor: .92, priceFactor: 1.1 },
  ];
  return definitions.map(s => {
    const survival = Math.min(.98, Math.max(.5, inputs.survival * s.survivalFactor));
    const fcr = inputs.fcr * s.fcrFactor;
    const priceKg = inputs.salePriceKg * s.priceFactor;
    const screenVolume = inputs.mode === "existing"
      ? Math.min(result.volumeLitres, Math.max(0, inputs.actualFlowLph) / 1.25)
      : result.volumeLitres;
    const maxFishByDensity = Math.max(0, Math.floor(screenVolume / 1000 * species.densityKgM3 / inputs.harvestKgEach));
    // Keep the maximum intended harvest at the customer's chosen base target.
    const fishSold = Math.min(result.fishHarvested, maxFishByDensity, Math.floor(result.fishStocked * survival));
    const harvestKg = fishSold * inputs.harvestKgEach;
    const feedKg = Math.max(0, (harvestKg - result.fishStocked * .025) * fcr * 1.08);
    const additionalFirstFeedKg = Math.max(0, feedKg - result.includedStarterFeedKg);
    const commonRunning = result.energyCost + result.supportCost + result.waterTestingCost + result.waterExchangeCost + result.otherSeasonCost;
    const firstCycleOutlay = (
      result.infrastructure + result.fingerlingsCost
      + additionalFirstFeedKg * species.feedPriceKg
      + commonRunning + result.initialFillWaterCost
    ) * 1.1;
    const recurringOutlay = (
      result.repeatFingerlingsCost + feedKg * species.feedPriceKg + commonRunning
    ) * 1.1;
    const sales = harvestKg * priceKg;
    const firstCycleCashResult = sales - firstCycleOutlay;
    const cashSurplus = sales - recurringOutlay;
    // Count seasons until total cumulative farm cash flow becomes nonnegative.
    // Season 1 uses the actual package; seasons 2+ need fresh fingerlings/feed.
    const paybackSeasons = firstCycleCashResult >= 0 ? 1
      : cashSurplus > 0 ? 1 + Math.ceil(-firstCycleCashResult / cashSurplus)
      : null;
    return {
      label: s.label, survival, fcr, priceKg, fishSold, harvestKg, feedKg,
      sales, firstCycleOutlay, firstCycleCashResult, recurringOutlay,
      cashSurplus, paybackSeasons,
      paybackMonths: paybackSeasons === null ? null :
        Math.round(paybackSeasons * inputs.cycleDays / 30.4375),
    };
  });
}

export function evaluateInvestment(inputs: FarmInputs, result: FarmResult): InvestmentAnalysis {
  const alternatives = scenarios(inputs, result);
  const base = alternatives[1];
  // Show the same first-season full equipment/package outlay used by the PDF;
  // follow with fresh fish, full feed and other recurring costs each season.
  // Positive cash during a season does not mean the startup investment was
  // repaid until cumulative cash flow reaches zero.
  let cumulative = 0;
  const seasonCount = Math.max(5, Math.min(8, base.paybackSeasons ?? 5));
  const cashFlow: SeasonCashFlow[] = Array.from({ length: seasonCount }, (_, i) => {
    const season = i + 1;
    const totalOutlay = season === 1 ? base.firstCycleOutlay : base.recurringOutlay;
    const seasonCashResult = base.sales - totalOutlay;
    cumulative += seasonCashResult;
    return { season, sales: base.sales, totalOutlay, seasonCashResult,
      cumulativeCash: cumulative, recovered: cumulative >= 0 };
  });
  return {
    cashFlow,
    initialCapital: base.firstCycleOutlay,
    firstCycleCashResult: base.firstCycleCashResult,
    recurringCycleOutlay: base.recurringOutlay,
    cashSurplusPerCycle: base.cashSurplus,
    paybackSeasons: base.paybackSeasons,
    paybackMonths: base.paybackMonths,
    scenarios: alternatives,
  };
}
