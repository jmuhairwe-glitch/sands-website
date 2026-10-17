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
  pumpWatts: number; // SANDS-reported electrical power draw PER shared installed pump
  aerationWattsPerTank: number; // SANDS-reported aerator draw, model assumes one aerator per tank
  waterExchangePct: number; // fresh water replaced daily, minimum 20% of working volume
  waterCostPer1000L: number; // UGX per 1,000 L, 0 means water acquisition cost unpriced
  starterBagKgPerTank: number; // assumed bag size, SANDS still to confirm
  otherSeasonCost: number; // editable unpriced labour, harvesting, freight and repairs per cycle
  extraFiltrationBudget: number; // optional ADDITIONAL whole-system capital above included standard filtration
  upgradedTankExtraCostPerTank: number; // sheet + extra pallets + welding/base change; 0 means unquoted
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
  dailyFreshWaterLitres: number;
  cycleExchangeWaterLitres: number;
  initialFillLitres: number;
  firstCycleFreshWaterLitres: number;
  dailyDischargeLitres: number;
  waterExchangeCost: number;
  initialFillWaterCost: number;
  waterSupplyCost: number;
  otherSeasonCost: number;
  extraFiltrationBudget: number;
  infrastructure: number; // purchased package(s), plus any explicit extra backup allowance
  isSandsPackage: boolean;
  packageCost: number; // base package rate + entered 5,000-L fabrication uplift
  upgradedTank: boolean;
  upgradePricingPending: boolean;
  upgradedTankExtraCost: number;
  backupAllowance: number;
  includedFingerlings: number;
  includedStarterFeedKg: number;
  additionalFeedKg: number;
  repeatFingerlingsCost: number;
  repeatFeedCost: number;
  fingerlingsCost: number; // additional first-cycle fingerlings outside package
  feedCost: number; // additional first-cycle feed outside included starter bag
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
  catfish: { label: "African catfish", densityKgM3: 160, feedPriceKg: 2500, fingerlingPrice: 500, defaultFcr: 1.3, defaultHarvestKg: 1, defaultSalePriceKg: 15000 },
  tilapia: { label: "Tilapia", densityKgM3: 20, feedPriceKg: 2900, fingerlingPrice: 500, defaultFcr: 1.5, defaultHarvestKg: .6, defaultSalePriceKg: 10000 },
} as const;

export const DEFAULTS: FarmInputs = {
  mode: "new", budget: 15000000, species: "catfish", tankLitres: 3142,
  tankCount: 1, actualFlowLph: 0, biofilterPresent: false,
  aerationPresent: false, backupPresent: false,
  fcr: 1.3, survival: .85, harvestKgEach: 1, salePriceKg: 15000,
  cycleDays: 180, electricityTariff: 850,
  pumpWatts: 500, aerationWattsPerTank: 40,
  waterExchangePct: 20, waterCostPer1000L: 0, starterBagKgPerTank: 25,
  otherSeasonCost: 0, upgradedTankExtraCostPerTank: 0, extraFiltrationBudget: 0,
};

// SANDS circular tank: 2 m diameter x 1.2 m physical height. Brimful: ~3,770 L.
// Planning water depth is provisionally 1.0 m (~3,142 L) until SANDS confirms actual fill level.
// SANDS now reports a 50,000 L/h 500 W shared pump at the SAME UGX 1.5m supplier price.
// 5,000 L is proposed working tank size; the extra iron sheet and larger pallet base must be quoted.
export const SANDS_TANK = {
  diameterM: 2, wallHeightM: 1.2, assumedWaterDepthM: 1,
  brimfulLitres: Math.round(Math.PI * 1 * 1 * 1.2 * 1000),
  workingLitres: Math.round(Math.PI * 1 * 1 * 1 * 1000),
  tankCost: 1100000, pumpCost: 1500000, pumpFlowLph: 50000, pumpPowerWatts: 500,
  upgradedWorkingLitres: 5000, extraSheetsPerUpgradedTank: 1, basePalletsPerStandardTank: 4,
  tanksPerPump: 6, targetTurnoversPerHour: 1.25,
  filterCost: 600000, aerationCost: 350000, aerationPowerWatts: 40, pipingInstallCost: 350000,
  catfishHarvestTargetPerTank: 500,
  singleTankPackage: 5000000, multiTankPackagePerTank: 3500000,
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
  // Daily fresh-water replacement is distinct from recirculation.
  // At 20%, 3,142 L working volume needs 628.4 L/day of NEW water.
  // At steady volume, that also means approximately 628.4 L/day discharged.
  const waterExchangePct = clean(inputs.waterExchangePct, 20, 20, 100);
  const dailyFreshWaterLitres = volumeLitres * waterExchangePct / 100;
  const cycleExchangeWaterLitres = dailyFreshWaterLitres * days;
  const initialFillLitres = isExisting ? 0 : volumeLitres;
  const firstCycleFreshWaterLitres = initialFillLitres + cycleExchangeWaterLitres;
  const dailyDischargeLitres = dailyFreshWaterLitres;
  const waterRate = clean(inputs.waterCostPer1000L, 0, 0, 100000);
  const waterExchangeCost = cycleExchangeWaterLitres / 1000 * waterRate;
  const initialFillWaterCost = initialFillLitres / 1000 * waterRate;
  const waterSupplyCost = waterExchangeCost + initialFillWaterCost;
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
    ? isExisting
      ? Math.floor(effectiveVolume / SANDS_TANK.workingLitres * SANDS_TANK.catfishHarvestTargetPerTank)
      : SANDS_TANK.catfishHarvestTargetPerTank * count
    : capacityHarvestCount;
  const fishHarvested = Math.max(0, Math.min(capacityHarvestCount, requestedHarvestCount));
  // Round up starter fish PER tank, so each tank independently has enough
  // fingerlings to achieve its harvest target after modeled mortality.
  const fishStocked = Math.ceil(fishHarvested / count / survival) * count;
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
  const upgradedTank = !isExisting && inputs.species === "catfish" && litresPerTank === SANDS_TANK.upgradedWorkingLitres;
  const isSandsPackage = !isExisting && inputs.species === "catfish" &&
    (litresPerTank === SANDS_TANK.workingLitres || upgradedTank);
  const upgradePricingPending = upgradedTank && inputs.upgradedTankExtraCostPerTank === 0;
  const upgradedTankExtraCost = upgradedTank ? count * clean(inputs.upgradedTankExtraCostPerTank, 0, 0, 10000000) : 0;
  const packageCost = isSandsPackage
    ? (count === 1 ? SANDS_TANK.singleTankPackage : count * SANDS_TANK.multiTankPackagePerTank) + upgradedTankExtraCost
    : 0;
  const standardUnitCost = SANDS_TANK.tankCost + SANDS_TANK.filterCost +
    SANDS_TANK.aerationCost + SANDS_TANK.pipingInstallCost;
  // SANDS now uses a 50,000 L/hour pump (500 W) at the same price across up to SIX
  // tanks. A 5,000 L tank at 1.25 turnovers/hour needs 6,250 L/h;
  // six use 37,500 L/h, leaving nominal 12,500 L/h for the return stage.
  // Add a second pump at seven tanks (distribution layout limit), or sooner if
  // total hydraulic duty exceeds rated flow.
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
  // These SANDS package prices already include tanks, one shared 50,000 L/h pump
  // up to six tanks, filtration, aeration, installation, initial fingerlings,
  // and a starter feed bag per tank. Never bill these components twice.
  // Backup power is listed separately, pending confirmation of its price.
  const backupAllowance = isExisting && inputs.backupPresent ? 0 : provisionalBackupAllowance;
  const baseInfrastructure = isExisting
    ? (inputs.biofilterPresent ? 0 : SANDS_TANK.filterCost * count * relativeTankSize)
      + (inputs.aerationPresent ? 0 : SANDS_TANK.aerationCost * count * relativeTankSize)
      + ((!inputs.biofilterPresent || !inputs.aerationPresent) ? SANDS_TANK.pipingInstallCost * count : 0)
      + backupAllowance
    : isSandsPackage
      ? packageCost + backupAllowance
      : count * standardUnitCost * relativeTankSize
        + pumpUnits * SANDS_TANK.pumpCost
        + backupAllowance;
  // The standard mechanical/biological filter is already INCLUDED in the
  // SANDS package. Only an actual separately quoted improvement belongs here.
  const extraFiltrationBudget = clean(inputs.extraFiltrationBudget, 0, 0, 50000000);
  const infrastructure = baseInfrastructure + extraFiltrationBudget;

  const includedFingerlings = isSandsPackage ? fishStocked : 0;
  // Starter bag is included in the package. Its size remains unconfirmed;
  // 25kg is an editable ILLUSTRATIVE DEFAULT, not a confirmed SANDS bag size.
  const includedStarterFeedKg = isSandsPackage
    ? Math.min(feedKg, count * clean(inputs.starterBagKgPerTank, 25, 0, 100))
    : 0;
  const additionalFeedKg = Math.max(0, feedKg - includedStarterFeedKg);
  const fingerlingsCost = isSandsPackage ? 0 : fishStocked * species.fingerlingPrice;
  const repeatFingerlingsCost = fishStocked * species.fingerlingPrice;
  const feedCost = additionalFeedKg * species.feedPriceKg;
  const repeatFeedCost = feedKg * species.feedPriceKg;
  // Pump input is SANDS-reported 500 W per shared pump; this is separate
  // from the 50,000 L/h nominal hydraulic rating. SANDS reports a 40 W
  // aerator. The model provisionally assumes one 40 W aerator per tank.
  const assumedWatts = clean(inputs.pumpWatts, SANDS_TANK.pumpPowerWatts, 50, 10000) * (isExisting ? 1 : pumpUnits)
    + clean(inputs.aerationWattsPerTank, SANDS_TANK.aerationPowerWatts, 0, 3000) * count;
  const energyCost = (assumedWatts / 1000) * 24 * days *
    clean(inputs.electricityTariff, 850, 100, 2500);
  const supportCost = 400000 + 180000 * count;
  const waterTestingCost = 250000 + 120000 * count;
  const otherSeasonCost = clean(inputs.otherSeasonCost, 0, 0, 100000000);
  const runningCost = fingerlingsCost + feedCost + energyCost + supportCost + waterTestingCost + waterSupplyCost + otherSeasonCost;
  const contingency = (infrastructure + runningCost) * .10;
  const projectTotal = infrastructure + runningCost + contingency;
  const budget = clean(inputs.budget, 15000000, 0, 500000000);
  const projectedSales = harvestKg * clean(inputs.salePriceKg, 10000, 1000, 50000);
  const cycleOperatingMargin = projectedSales - runningCost;
  const warnings: string[] = [];
  if (extraFiltrationBudget === 0 && isSandsPackage && waterExchangePct >= 50) warnings.push("At 50% or higher daily fresh-water replacement, filtration upgrades have NOT been priced. The standard UGX 600,000 per-tank filter is included, but extra media, solids removal or oxygenation must be assessed separately. A zero additional allowance is UNPRICED, not proof that upgrades are unnecessary.");
  if (extraFiltrationBudget > 0) warnings.push("Additional filtration allowance is a user-entered whole-system capital sum above the SANDS package and is included in first-season investment and payback. Technical treatment capacity still requires verification.");
  if (waterExchangePct >= 50) warnings.push("High daily water exchange needs dependable clean source water and controlled effluent handling; verify source water pH, ammonia, oxygen, temperature, pressure and availability.");
  if (otherSeasonCost === 0) warnings.push("Labour, fish harvesting, delivery/marketing, maintenance and other farm expenses have NOT been priced. Add realistic per-cycle costs before treating the payback figures as usable for lending.");
  if (waterRate === 0) warnings.push("Daily 20%-or-higher fresh water replacement is included as a quantity, but water acquisition/discharge costs are UNPRICED (UGX 0/1,000 L). Add the true water cost or own-source pumping/treatment expense.");
  if (waterRate > 0) warnings.push("Water unit cost estimates supply only; separately confirm water treatment, source pumping, wastewater handling and any permits/fees.");
  warnings.push("Daily new-water exchange is additional to internal recirculation; approximately the same volume must be drained or discharged to hold the water level constant.");
  if (isExisting && effectiveFlow < nominalPumpLph) warnings.push("Reported circulation is below the preliminary turnover screen; fish numbers have been reduced. Check pump head and actual flow.");
  if (!isExisting && !isSandsPackage) warnings.push("Nonstandard tank dimensions require a separate supplier quotation; equipment costs are only indicative.");
  if (!isExisting) warnings.push("One nominal 50,000 L/h, 500 W pump costing UGX 1.5m is included in the SANDS catfish package for up to six tanks. Actual flow at head, bypass flow, distribution and oxygenation must be verified.");
  if (isSandsPackage) {
    warnings.push("SANDS catfish package includes the pump, tank, aerator, UGX 600,000 per-tank filtration, piping/install, initial fingerlings, and one starter feed bag per tank. These are not charged twice.");
    if (upgradedTank) warnings.push("PROPOSED 5,000-L TANK: larger circumference needs one extra iron sheet and a base with more than the four pallets used for the standard tank. Price only the extra sheet, pallets, and associated welding/base labour as an uplift.");
    if (upgradePricingPending) warnings.push("5,000-L tank fabricator uplift is UNPRICED (UGX 0 is a placeholder, not a free upgrade). This is a MINIMUM estimate only; enter the extra sheet, pallets and labour quotation before using the payback or funding request.");
    warnings.push("Starter feed bag weight " + clean(inputs.starterBagKgPerTank, 25, 0, 100) + " kg per tank is an UNCONFIRMED example. Confirm actual bag size and fingerling count included in the package.");
    if (count > SANDS_TANK.tanksPerPump) warnings.push("Seven or more tanks need additional shared pump(s); the UGX 3.5m per tank bundle beyond six tanks needs individual supplier verification.");
  }
  if (!isExisting && inputs.species !== "catfish") warnings.push("The UGX 5m/3.5m catfish package pricing has not been confirmed for tilapia; current tilapia installation remains a provisional component estimate.");
  if (!isExisting && provisionalBypassFlowLph > 0) warnings.push("Nominal flow not directed to grow-out tanks (" + Math.round(provisionalBypassFlowLph).toLocaleString("en-UG") + " L/h) is assumed routed to the aerating/filter return. This bypass is not guaranteed additional dissolved oxygen and must not short-circuit treatment.");
  warnings.push("SANDS reports 300 W for each shared circulation pump and 40 W for each aerator. This estimate assumes one aerator per tank; confirm whether aerators are actually shared, and verify actual power draw. Backup power UGX 1,200,000, support, testing and contingency remain unconfirmed allowances.");
  if (inputs.species === "catfish") {
    const density = harvestKg / Math.max(.001, volumeLitres / 1000);
    if (density >= 90) warnings.push("HIGH-INTENSITY DESIGN: " + Math.round(density) + " kg/m3 expected harvest biomass. This is a proposed output target only. SANDS must verify aeration/oxygen transfer, filtration TAN removal, solids, CO2 stripping, backup and water-quality monitoring. No stocking approval is implied.");
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
    dailyFreshWaterLitres, cycleExchangeWaterLitres, initialFillLitres,
    firstCycleFreshWaterLitres, dailyDischargeLitres,
    waterExchangeCost, initialFillWaterCost, waterSupplyCost, otherSeasonCost,
    extraFiltrationBudget,
    infrastructure, isSandsPackage, packageCost, upgradedTank, upgradePricingPending,
    upgradedTankExtraCost, backupAllowance,
    includedFingerlings, includedStarterFeedKg, additionalFeedKg,
    repeatFingerlingsCost, repeatFeedCost,
    fingerlingsCost, feedCost, energyCost, supportCost,
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
