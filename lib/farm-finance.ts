/**
 * Preliminary aquaculture budgeting model, not a stocking approval, quote or loan offer.
 * SANDS must replace indicative equipment, electricity and service allowances with quotes.
 */
export type Species = "catfish" | "tilapia";
export type FarmMode = "new" | "existing";
export type FarmInputs = {
  mode: FarmMode;
  budget: number;
  species: Species;
  tankLitres: number;
  tankCount: number;
  actualFlowLph: number;
  biofilterPresent: boolean;
  aerationPresent: boolean;
  backupPresent: boolean;
  fcr: number;
  survival: number; // fraction
  harvestKgEach: number;
  salePriceKg: number;
  cycleDays: number;
  electricityTariff: number;
};
export type FarmResult = {
  feasible: boolean;
  tanks: number;
  volumeLitres: number;
  fishStocked: number;
  fishHarvested: number;
  harvestKg: number;
  feedKg: number;
  peakFeedKgDay: number;
  tanGramsDay: number;
  oxygenKgDay: number;
  nominalPumpLph: number;
  infrastructure: number;
  fingerlingsCost: number;
  feedCost: number;
  energyCost: number;
  supportCost: number;
  waterTestingCost: number;
  runningCost: number;
  contingency: number;
  projectTotal: number;
  amountRemaining: number;
  projectedSales: number;
  cycleOperatingMargin: number;
  firstCycleCashResult: number;
  warnings: string[];
};

export const SPECIES = {
  catfish: { label: "African catfish", densityKgM3: 45, feedPriceKg: 3000, fingerlingPrice: 500, defaultFcr: 1.3, defaultHarvestKg: .3, defaultSalePriceKg: 15000 },
  tilapia: { label: "Tilapia", densityKgM3: 20, feedPriceKg: 2900, fingerlingPrice: 500, defaultFcr: 1.5, defaultHarvestKg: .6, defaultSalePriceKg: 10000 },
} as const;

export const DEFAULTS: FarmInputs = {
  mode: "new", budget: 15000000, species: "catfish", tankLitres: 3142,
  tankCount: 1, actualFlowLph: 0, biofilterPresent: false,
  aerationPresent: false, backupPresent: false,
  fcr: 1.3, survival: .85, harvestKgEach: .3, salePriceKg: 15000,
  cycleDays: 180, electricityTariff: 850,
};

// SANDS circular tank: 2 m diameter x 1.2 m physical height. Brimful: ~3,770 L.
// Planning water depth is provisionally 1.0 m (~3,142 L) until SANDS confirms actual fill level.
// A 30,000 L/h pump can potentially serve several tanks, subject to delivered head and treatment design.
export const SANDS_TANK = {
  diameterM: 2, wallHeightM: 1.2, assumedWaterDepthM: 1,
  brimfulLitres: Math.round(Math.PI * 1 * 1 * 1.2 * 1000),
  workingLitres: Math.round(Math.PI * 1 * 1 * 1 * 1000),
  tankCost: 1100000, pumpCost: 1500000, pumpFlowLph: 30000,
  filterCost: 600000, aerationCost: 350000, pipingInstallCost: 350000,
  catfishStockPerTank: 500,
} as const;

const clean = (n: number, fallback: number, lower: number, upper: number) =>
  Number.isFinite(n) ? Math.min(upper, Math.max(lower, n)) : fallback;

function calculate(inputs: FarmInputs, tanks: number): FarmResult {
  const species = SPECIES[inputs.species];
  const litresPerTank = clean(inputs.tankLitres, SANDS_TANK.workingLitres, 500, 100000);
  const count = Math.max(1, Math.min(100, Math.floor(tanks)));
  const volumeLitres = litresPerTank * count;
  const survival = clean(inputs.survival, .85, .5, .98);
  const weightKg = clean(inputs.harvestKgEach, .8, .3, 2.0);
  const fcr = clean(inputs.fcr, 1.3, 1, 2.8);
  const days = clean(inputs.cycleDays, 180, 90, 365);
  const nominalPumpLph = Math.ceil(volumeLitres * 1.25);
  const isExisting = inputs.mode === "existing";
  const effectiveFlow = isExisting ? Math.max(0, inputs.actualFlowLph) : nominalPumpLph;
  // Existing-tank estimates are capped by pump-flow screening as well as culture volume.
  // The 1.25 turnovers/hour is only a planning screen; oxygen, CO2 and TAN
  // balances must be checked by SANDS before any stocking recommendation.
  const effectiveVolume = Math.min(volumeLitres, effectiveFlow / 1.25);
  const harvestCapacity = effectiveVolume / 1000 * species.densityKgM3;
  const capacityHarvestCount = Math.max(0, Math.floor(harvestCapacity / weightKg));
  // SANDS reports 500 catfish stocked per 2 m diameter tank (provisional 1 m water depth).
  // Keep this stocking target distinct from harvested survivors, and enforce a separate
  // biomass density screen if users select a heavier target harvest weight.
  const screenStock = inputs.species === "catfish"
    ? Math.floor(effectiveVolume / SANDS_TANK.workingLitres * SANDS_TANK.catfishStockPerTank)
    : Math.floor(capacityHarvestCount / survival);
  const fishStocked = Math.max(0, Math.min(screenStock, Math.floor(capacityHarvestCount / survival)));
  const fishHarvested = Math.min(capacityHarvestCount, Math.floor(fishStocked * survival));
  const harvestKg = fishHarvested * weightKg;
  const feedKg = Math.max(0, (harvestKg - fishStocked * .025) * fcr * 1.08);
  const peakFeedKgDay = harvestKg * .02;
  // 40 g TAN / kg feed is a screening estimate. Actual TAN depends on protein
  // and digestibility. Biofilter performance depends on media, oxygen, pH and temperature.
  const tanGramsDay = peakFeedKgDay * 40;
  const oxygenKgDay = peakFeedKgDay * .6;

  // Supplier-supplied component prices apply to the SANDS standard tank only.
  // Until other tank sizes are quoted, scale component cost approximately by working volume.
  // Pump is a shared unit, NOT automatically one pump per tank.
  const relativeTankSize = litresPerTank / SANDS_TANK.workingLitres;
  const standardUnitCost = SANDS_TANK.tankCost + SANDS_TANK.filterCost +
    SANDS_TANK.aerationCost + SANDS_TANK.pipingInstallCost;
  const pumpUnits = Math.max(1, Math.ceil(nominalPumpLph / SANDS_TANK.pumpFlowLph));
  // UGX 1.2m is an UNCONFIRMED backup-power allowance, not supplied pricing.
  const provisionalBackupAllowance = 1200000;
  const infrastructure = isExisting
    ? (inputs.biofilterPresent ? 0 : SANDS_TANK.filterCost * count * relativeTankSize)
      + (inputs.aerationPresent ? 0 : SANDS_TANK.aerationCost * count * relativeTankSize)
      + ((!inputs.biofilterPresent || !inputs.aerationPresent) ? SANDS_TANK.pipingInstallCost * count : 0)
      + (inputs.backupPresent ? 0 : provisionalBackupAllowance)
    : count * standardUnitCost * relativeTankSize
      + pumpUnits * SANDS_TANK.pumpCost
      + provisionalBackupAllowance;

  const fingerlingsCost = fishStocked * species.fingerlingPrice;
  const feedCost = feedKg * species.feedPriceKg;
  // Placeholder electrical-load assumption, not derived from pump flow.
  const assumedWatts = 120 + count * 100;
  const energyCost = (assumedWatts / 1000) * 24 * days *
    clean(inputs.electricityTariff, 850, 100, 2500);
  const supportCost = 400000 + 180000 * count;
  const waterTestingCost = 250000 + 120000 * count;
  const runningCost = fingerlingsCost + feedCost + energyCost + supportCost + waterTestingCost;
  const contingency = (infrastructure + runningCost) * .10;
  const projectTotal = infrastructure + runningCost + contingency;
  const budget = clean(inputs.budget, 15000000, 0, 500000000);
  const projectedSales = harvestKg * clean(inputs.salePriceKg, 10000, 1000, 50000);
  const cycleOperatingMargin = projectedSales - runningCost;
  const warnings: string[] = [];
  if (isExisting && effectiveFlow < nominalPumpLph) warnings.push("Reported circulation is below the preliminary turnover screen; fish numbers have been reduced. Check pump head and actual flow.");
  if (!isExisting && litresPerTank !== SANDS_TANK.workingLitres) warnings.push("Nonstandard tank dimensions require a supplier quotation; equipment costs have only been scaled as a placeholder.");
  if (!isExisting && count > 1) warnings.push("Shared 30,000 L/h pump allocation is preliminary: verify delivery at operating head and biological/mechanical filtration capacity.");
  warnings.push("Backup power UGX 1,200,000, operating wattage, support, testing, and contingency remain estimates rather than confirmed SANDS costs.");
  warnings.push("500 catfish per SANDS tank and a 1.0 m working water depth are provisional planning inputs, not technical stocking clearance.");
  warnings.push("Fingerling starting weight (25 g), FCR, survival, cycle length, feed allowance and TAN factors still need confirmation.");
  if (isExisting && inputs.biofilterPresent) warnings.push("Existing biofilter performance has not been verified. Media, maturity and TAN-removal capacity need testing.");
  if (isExisting && inputs.backupPresent) warnings.push("Confirm backup power will run all critical equipment for the required outage duration.");
  if (cycleOperatingMargin <= 0) warnings.push("Estimated fish sales do not cover modeled running costs. Review the economics before borrowing.");
  if (projectedSales - projectTotal < 0) warnings.push("First-cycle receipts do not recover installation plus running costs; equipment is a multi-cycle investment.");
  warnings.push("SANDS must validate oxygen, solids removal, TAN conversion, CO2 stripping, water availability, power and actual site costs before stocking.");
  return {
    feasible: fishStocked > 0 && (!isExisting || projectTotal <= budget),
    tanks: count, volumeLitres, fishStocked, fishHarvested, harvestKg,
    feedKg, peakFeedKgDay, tanGramsDay, oxygenKgDay, nominalPumpLph,
    infrastructure, fingerlingsCost, feedCost, energyCost, supportCost,
    waterTestingCost, runningCost, contingency, projectTotal,
    amountRemaining: budget - projectTotal, projectedSales, cycleOperatingMargin,
    firstCycleCashResult: projectedSales - projectTotal, warnings,
  };
}

export function simulateFarm(inputs: FarmInputs): FarmResult {
  if (inputs.mode === "existing") return calculate(inputs, inputs.tankCount);
  // Choose the largest number of *complete* modules affordable, including
  // the entire first-cycle feed, power, testing, support and contingency.
  let best: FarmResult | null = null;
  for (let tanks = 1; tanks <= 100; tanks++) {
    const next = calculate(inputs, tanks);
    if (next.projectTotal <= inputs.budget) best = next;
    else break;
  }
  if (best) return best;
  const smallest = calculate(inputs, 1);
  return {
    ...smallest, feasible: false,
    warnings: ["Budget does not cover the complete first-cycle estimate for one tank. The shortfall is shown below.", ...smallest.warnings]
  };
}
export function ugx(n: number): string {
  return "UGX " + Math.round(n).toLocaleString("en-UG");
}
export function quantity(n: number, digits = 0): string {
  return n.toLocaleString("en-UG", { maximumFractionDigits: digits });
}
