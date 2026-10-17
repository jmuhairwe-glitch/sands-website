/**
 * Preliminary aquaculture budgeting model, not a stocking approval, quote or loan offer.
 * Tank, pump, filter, aeration, installation, feed and selling-price inputs were
 * provided by SANDS; remaining site, power, safety and operating costs require confirmation.
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
  pumpWatts: number; // provisional electrical power draw PER installed pump
  aerationWattsPerTank: number; // provisional electric draw PER tank
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
  pumpUnits: number;
  nominalInstalledFlowLph: number;
  provisionalBypassFlowLph: number;
  flowPerTankLph: number;
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
  catfish: { label: "African catfish", densityKgM3: 160, feedPriceKg: 3000, fingerlingPrice: 500, defaultFcr: 1.3, defaultHarvestKg: 1, defaultSalePriceKg: 15000 },
  tilapia: { label: "Tilapia", densityKgM3: 20, feedPriceKg: 2900, fingerlingPrice: 500, defaultFcr: 1.5, defaultHarvestKg: .6, defaultSalePriceKg: 10000 },
} as const;

export const DEFAULTS: FarmInputs = {
  mode: "new", budget: 15000000, species: "catfish", tankLitres: 3142,
  tankCount: 1, actualFlowLph: 0, biofilterPresent: false,
  aerationPresent: false, backupPresent: false,
  fcr: 1.3, survival: .85, harvestKgEach: 1, salePriceKg: 15000,
  cycleDays: 180, electricityTariff: 850,
  pumpWatts: 1500, aerationWattsPerTank: 100,
};

// SANDS circular tank: 2 m diameter x 1.2 m physical height. Brimful: ~3,770 L.
// Planning water depth is provisionally 1.0 m (~3,142 L) until SANDS confirms actual fill level.
// A 30,000 L/h pump can potentially serve several tanks, subject to delivered head and treatment design.
export const SANDS_TANK = {
  diameterM: 2, wallHeightM: 1.2, assumedWaterDepthM: 1,
  brimfulLitres: Math.round(Math.PI * 1 * 1 * 1.2 * 1000),
  workingLitres: Math.round(Math.PI * 1 * 1 * 1 * 1000),
  tankCost: 1100000, pumpCost: 1500000, pumpFlowLph: 30000,
  tanksPerPump: 6, targetTurnoversPerHour: 1.25,
  filterCost: 600000, aerationCost: 350000, pipingInstallCost: 350000,
  catfishHarvestTargetPerTank: 500,
} as const;

const clean = (n: number, fallback: number, lower: number, upper: number) =>
  Number.isFinite(n) ? Math.min(upper, Math.max(lower, n)) : fallback;

function calculate(inputs: FarmInputs, tanks: number): FarmResult {
  const species = SPECIES[inputs.species];
  const litresPerTank = clean(inputs.tankLitres, SANDS_TANK.workingLitres, 500, 100000);
  const count = Math.max(1, Math.min(100, Math.floor(tanks)));
  const volumeLitres = litresPerTank * count;
  const survival = clean(inputs.survival, .85, .5, .98);
  const weightKg = clean(inputs.harvestKgEach, .3, .3, 2.0);
  const fcr = clean(inputs.fcr, 1.3, 1, 2.8);
  const days = clean(inputs.cycleDays, 180, 90, 365);
  const nominalPumpLph = Math.ceil(volumeLitres * SANDS_TANK.targetTurnoversPerHour);
  const isExisting = inputs.mode === "existing";
  const effectiveFlow = isExisting ? Math.max(0, inputs.actualFlowLph) : nominalPumpLph;
  // Existing-tank estimates are capped by pump-flow screening as well as culture volume.
  // The 1.25 turnovers/hour is only a planning screen; oxygen, CO2 and TAN
  // balances must be checked by SANDS before any stocking recommendation.
  const effectiveVolume = Math.min(volumeLitres, effectiveFlow / SANDS_TANK.targetTurnoversPerHour);
  const harvestCapacity = effectiveVolume / 1000 * species.densityKgM3;
  const capacityHarvestCount = Math.max(0, Math.floor(harvestCapacity / weightKg));
  // SANDS requests 500 fish HARVESTED per standard tank, rather than 500 stocked.
  // Reverse-calculate stocking to account for survival (500 / 0.85 -> 589).
  // High-density catfish production is a CONDITIONAL design target, not a
  // validation of the current 600k UGX filter or aeration package.
  const requestedHarvestCount = inputs.species === "catfish"
    ? Math.floor(effectiveVolume / SANDS_TANK.workingLitres * SANDS_TANK.catfishHarvestTargetPerTank)
    : capacityHarvestCount;
  const fishHarvested = Math.max(0, Math.min(capacityHarvestCount, requestedHarvestCount));
  const fishStocked = Math.ceil(fishHarvested / survival);
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
  // SANDS shares ONE 30,000 L/hour pump across up to SIX standard tanks.
  // Add a pump only at the seventh standard tank, or sooner if larger tanks
  // make the preliminary 1.25-turnover/h allocation exceed rated capacity.
  // Rated hydraulic flow is not the verified delivered flow at operating head.
  const pumpUnits = Math.max(1,
    Math.ceil(count / SANDS_TANK.tanksPerPump),
    Math.ceil(nominalPumpLph / SANDS_TANK.pumpFlowLph)
  );
  const nominalInstalledFlowLph = isExisting ? Math.max(0, inputs.actualFlowLph) : pumpUnits * SANDS_TANK.pumpFlowLph;
  const provisionalBypassFlowLph = Math.max(0, nominalInstalledFlowLph - nominalPumpLph);
  const flowPerTankLph = nominalPumpLph / count;
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
  // These loads are deliberately exposed to users; pump flow in L/h does
  // NOT specify electrical power. Default 1,500 W per pump and 100 W/tank
  // aeration are UNCONFIRMED estimates and must be calibrated from nameplates.
  const assumedWatts = clean(inputs.pumpWatts, 1500, 50, 10000) * (isExisting ? 1 : pumpUnits)
    + clean(inputs.aerationWattsPerTank, 100, 0, 3000) * count;
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
  if (!isExisting) warnings.push("One nominal 30,000 L/h pump is costed for up to six standard tanks. Its actual delivered flow at installed head, valve allocation, bypass route and power draw must be confirmed.");
  if (!isExisting && provisionalBypassFlowLph > 0) warnings.push("Nominal flow not directed to grow-out tanks (" + Math.round(provisionalBypassFlowLph).toLocaleString("en-UG") + " L/h) is assumed routed to the aerating/filter return. This bypass is not guaranteed additional dissolved oxygen and must not short-circuit treatment.");
  warnings.push("Backup power UGX 1,200,000, pump/aeration W, support, testing and contingency remain estimates, not confirmed SANDS costs. 30,000 L/h pump flow does not tell us electric power.");
  if (inputs.species === "catfish") {
    const density = harvestKg / Math.max(.001, volumeLitres / 1000);
    if (density > 100) warnings.push("HIGH-INTENSITY DESIGN: " + Math.round(density) + " kg/m3 expected harvest biomass. This is a proposed output target only. SANDS must verify aeration/oxygen transfer, filtration TAN removal, solids, CO2 stripping, backup and water-quality monitoring. No stocking approval is implied.");
    warnings.push("Catfish project targets 500 fish HARVESTED per standard working-volume tank, with extra fish stocked for mortality at the selected survival rate.");
  }
  warnings.push("1.0 m working water depth is provisional; confirm actual tank water level.");
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
    pumpUnits, nominalInstalledFlowLph, provisionalBypassFlowLph, flowPerTankLph,
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
