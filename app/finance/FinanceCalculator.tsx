"use client";

import { useMemo, useState } from "react";
import { DEFAULTS, SPECIES, SANDS_TANK, simulateFarm, ugx, quantity, type FarmInputs, type Species } from "../../lib/farm-finance";
import { evaluateInvestment } from "../../lib/farm-investment";

const moneyNumber = (n: number) => Number.isFinite(n) ? Math.round(n) : 0;
const Numeric = ({ value, min = 0, max = 999999, step = 1, onChange, id }: {
  value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void; id?: string
}) => <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step}
  value={value} onChange={(e) => onChange(Number(e.target.value))} />;

export default function FinanceCalculator() {
  const [inputs, setInputs] = useState<FarmInputs>(DEFAULTS);
  const [applicant, setApplicant] = useState({
    name: "", projectName: "", location: "", contact: "", financier: "", notes: "", contribution: 0,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [proposalError, setProposalError] = useState("");
  const set = (update: Partial<FarmInputs>) => setInputs(current => ({ ...current, ...update }));
  const setApplicantField = (field: keyof typeof applicant, value: string | number) =>
    setApplicant(current => ({ ...current, [field]: value }));
  const result = useMemo(() => simulateFarm(inputs), [inputs]);
  const investment = useMemo(() => evaluateInvestment(inputs, result), [inputs, result]);
  async function downloadProposal() {
    setProposalError("");
    setIsDownloading(true);
    try {
      const response = await fetch("/api/finance-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, applicant }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "The proposal could not be generated.");
      }
      const pdfBlob = await response.blob();
      if (pdfBlob.type !== "application/pdf") throw new Error("Unexpected document response.");
      const url = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "SANDS-Fish-Farm-Funding-Proposal.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      setProposalError(error instanceof Error ? error.message : "Could not download proposal.");
    } finally {
      setIsDownloading(false);
    }
  }
  const isNew = inputs.mode === "new";
  const profile = SPECIES[inputs.species];
  const request = [
    "Hello SANDS, I used the fish farm budget simulator.",
    "Project type: " + (isNew ? "New RAS installation" : "Existing tanks"),
    "Species: " + profile.label,
    "Budget: " + ugx(inputs.budget),
    "Tank(s): " + result.tanks + " x " + quantity(inputs.tankLitres) + " L",
    ...(result.upgradedTank ? ["Upgrade price: " + (result.upgradePricingPending ? "NOT YET QUOTED" : ugx(result.upgradedTankExtraCost))] : []),
    "Estimated fingerlings: " + quantity(result.fishStocked),
    "Estimated feed: " + quantity(result.feedKg, 1) + " kg",
    "Complete SANDS package price: " + ugx(result.packageCost),
    "Starter feed included (estimated): " + quantity(result.includedStarterFeedKg, 1) + " kg",
    "Daily fresh water exchange: " + inputs.waterExchangePct + "% (" + quantity(result.dailyFreshWaterLitres) + " L/day)",
    "Estimated project cost: " + ugx(result.projectTotal),
    "Requested: on-site assessment and itemised quote.",
  ].join("\n");
  const inquiryUrl = "https://wa.me/256756188061?text=" + encodeURIComponent(request);
  const budgetUsedPercent = result.projectTotal / Math.max(1, inputs.budget) * 100;
  return (
    <main className="financePage">
      <header className="financeHeader">
        <div className="container financeHeaderInner">
          <a href="/" aria-label="SANDS Fish Farm home"><img src="/sands-logo.jpeg" alt="SANDS Fish Farm" /></a>
          <nav aria-label="Finance page navigation"><a href="/">Home</a><a href="/enquire">Prices & enquiries</a></nav>
        </div>
      </header>
      <section className="financeHero">
        <div className="container">
          <span className="financeEyebrow">SANDS FISH FARM · TANK IN A BOX</span>
          <h1>What fish farm can your budget build?</h1>
          <p>Move the budget slider or tell us what tanks you already have. See a complete first-cycle estimate — fish, feed, filtration load and running costs — before requesting a quote.</p>
          <span className="financeTag">Early planning estimate · Not a final quotation or loan approval</span>
        </div>
      </section>

      <div className="container financeLayout">
        <section className="financeControls" aria-labelledby="configure-title">
          <h2 id="configure-title">Design your farm</h2>
          <div className="financeMode" role="group" aria-label="Select simulator mode">
            <button type="button" className={isNew ? "selected" : ""} aria-pressed={isNew}
              onClick={() => set({ mode: "new" })}>Build a new farm</button>
            <button type="button" className={!isNew ? "selected" : ""} aria-pressed={!isNew}
              onClick={() => set({ mode: "existing" })}>I already have tanks</button>
          </div>

          <div className="financeBudget">
            <label htmlFor="farmBudget">Available project budget</label>
            <strong>{ugx(inputs.budget)}</strong>
            <input id="farmBudget" type="range" min="3000000" max="100000000" step="500000"
              value={inputs.budget} onChange={(e) => set({ budget: Number(e.target.value) })} />
            <div className="financeScale"><span>UGX 3m</span><span>UGX 100m</span></div>
            <p>You don't need to disclose your budget to SANDS. Calculations happen in your browser; nothing is submitted until you contact us.</p>
          </div>

          <div className="financeField">
            <label htmlFor="fishSpecies">Fish species</label>
            <select id="fishSpecies" value={inputs.species} onChange={(e) => {
              const species = e.target.value as Species;
              set({ species, fcr: SPECIES[species].defaultFcr, harvestKgEach: SPECIES[species].defaultHarvestKg, salePriceKg: SPECIES[species].defaultSalePriceKg });
            }}>
              <option value="catfish">African catfish</option><option value="tilapia">Tilapia</option>
            </select>
          </div>

          <div className="financeField">
            <label htmlFor="waterExchangePct">Daily NEW water exchange (% of operating volume)</label>
            <div className="financeMode" role="group" aria-label="Daily water exchange presets">
              <button type="button" className={inputs.waterExchangePct === 20 ? "selected" : ""} aria-pressed={inputs.waterExchangePct === 20} onClick={() => set({ waterExchangePct: 20 })}>20% · Baseline</button>
              <button type="button" className={inputs.waterExchangePct === 50 ? "selected" : ""} aria-pressed={inputs.waterExchangePct === 50} onClick={() => set({ waterExchangePct: 50 })}>50% · High exchange</button>
            </div>
            <Numeric id="waterExchangePct" value={inputs.waterExchangePct} min={20} max={100} step={5} onChange={(waterExchangePct) => set({ waterExchangePct })}/>
            <small>SANDS minimum: 20% new water per day. Try 50% with the same tanks, then compare new-water demand and additional expenses below. Fresh replacement is separate from the recirculating pump. Extra wastewater needs safe handling.</small>
          </div>
          {isNew ? (
            <div className="financeField">
              <label htmlFor="newTankSize">SANDS circular tank option</label>
              <select id="newTankSize" value={inputs.tankLitres} onChange={e => set({ tankLitres: Number(e.target.value) })}>
                <option value={SANDS_TANK.workingLitres}>Existing SANDS: approximately 3,142 L working water</option>
                <option value={SANDS_TANK.upgradedWorkingLitres}>Proposed larger tank: 5,000 L working water</option>
              </select>
              {inputs.tankLitres === SANDS_TANK.upgradedWorkingLitres ? (
                <p>The proposed 5,000 L option uses one additional iron sheet and more pallet-supported base material than the standard four-pallet tank. <strong>Only the incremental sheet, pallets and fabrication labour are to be added</strong> to the existing complete-package rate. The exact materials quotation is still required.</p>
              ) : (
                <p><strong>{SANDS_TANK.diameterM} m diameter × {SANDS_TANK.wallHeightM} m high</strong> — about {quantity(SANDS_TANK.brimfulLitres)} L at the rim; this model uses <strong>{quantity(SANDS_TANK.workingLitres)} L</strong> at a provisional {SANDS_TANK.assumedWaterDepthM.toFixed(1)} m water depth.</p>
              )}
              <small>At 5,000 L working capacity, 500 kg of harvested catfish equals 100 kg/m³. Exact upgraded-tank dimensions, base support and oxygen/filtration capacities require confirmation.</small>
            </div>
          ) : (
            <>
              <div className="financeTwoCol">
                <div className="financeField"><label htmlFor="existingVolume">Working litres per tank</label>
                  <Numeric id="existingVolume" value={inputs.tankLitres} min={500} max={100000}
                    step={100} onChange={(tankLitres) => set({ tankLitres })} /></div>
                <div className="financeField"><label htmlFor="existingCount">Number of tanks</label>
                  <Numeric id="existingCount" value={inputs.tankCount} min={1} max={100}
                    onChange={(tankCount) => set({ tankCount })} /></div>
              </div>
              <div className="financeField"><label htmlFor="actualFlow">Actual recirculation flow (litres/hour)</label>
                <Numeric id="actualFlow" value={inputs.actualFlowLph} min={0} max={3000000} step={100}
                  onChange={(actualFlowLph) => set({ actualFlowLph })} />
                <small>Enter delivered pump flow through your filtration system, not just the pump's advertised maximum. Fresh water supply and daily water exchange are separate checks.</small>
              </div>
              <div className="financeChecks" aria-label="Equipment already installed">
                <label><input type="checkbox" checked={inputs.biofilterPresent} onChange={(e) => set({ biofilterPresent: e.target.checked })} /> Biofilter installed</label>
                <label><input type="checkbox" checked={inputs.aerationPresent} onChange={(e) => set({ aerationPresent: e.target.checked })} /> Aeration installed</label>
                <label><input type="checkbox" checked={inputs.backupPresent} onChange={(e) => set({ backupPresent: e.target.checked })} /> Backup power available</label>
              </div>
            </>
          )}

          <details className="financeAdvanced">
            <summary>Adjust production and price assumptions</summary>
            <div className="financeTwoCol">
              <div className="financeField"><label htmlFor="fcr">Feed conversion ratio (FCR)</label><Numeric id="fcr" value={inputs.fcr} min={1} max={2.8} step={.05} onChange={(fcr) => set({ fcr })}/></div>
              <div className="financeField"><label htmlFor="survival">Survival (%)</label><Numeric id="survival" value={moneyNumber(inputs.survival * 100)} min={50} max={98} onChange={(survival) => set({ survival: survival / 100 })}/></div>
              <div className="financeField"><label htmlFor="harvestWeight">Target fish weight (kg)</label><Numeric id="harvestWeight" value={inputs.harvestKgEach} min={.3} max={2} step={.1} onChange={(harvestKgEach) => set({ harvestKgEach })}/></div>
              <div className="financeField"><label htmlFor="salePrice">Selling price (UGX/kg)</label><Numeric id="salePrice" value={inputs.salePriceKg} min={1000} max={50000} step={500} onChange={(salePriceKg) => set({ salePriceKg })}/></div>
              <div className="financeField"><label htmlFor="cycleDays">Cycle length (days)</label><Numeric id="cycleDays" value={inputs.cycleDays} min={90} max={365} step={10} onChange={(cycleDays) => set({ cycleDays })}/></div>
              <div className="financeField"><label htmlFor="powerTariff">Electricity (UGX/kWh)</label><Numeric id="powerTariff" value={inputs.electricityTariff} min={100} max={2500} step={50} onChange={(electricityTariff) => set({ electricityTariff })}/></div>
              <div className="financeField"><label htmlFor="pumpWatts">Shared pump electrical draw (W per pump)</label><Numeric id="pumpWatts" value={inputs.pumpWatts} min={50} max={10000} step={50} onChange={(pumpWatts) => set({ pumpWatts })}/><small>SANDS-reported alternative: 50,000 L/hour at 500 W, same UGX 1.5m price. One shared pump for up to six tanks pending actual flow at operating head.</small></div>
              <div className="financeField"><label htmlFor="aerationWatts">Aerator electrical draw (W per aerator; assumes one per tank)</label><Numeric id="aerationWatts" value={inputs.aerationWattsPerTank} min={0} max={3000} step={5} onChange={(aerationWattsPerTank) => set({ aerationWattsPerTank })}/><small>SANDS-reported aerator rating: 40 W. The calculator currently budgets one aerator per tank; confirm if the aeration units are shared between tanks.</small></div>
              {isNew && inputs.tankLitres === SANDS_TANK.upgradedWorkingLitres && <div className="financeField"><label htmlFor="upgradeExtraCost">Extra sheet + extra pallets + extra fabrication labour (UGX PER 5,000 L tank)</label><Numeric id="upgradeExtraCost" value={inputs.upgradedTankExtraCostPerTank} min={0} max={10000000} step={50000} onChange={(upgradedTankExtraCostPerTank) => set({ upgradedTankExtraCostPerTank })}/><small>Enter the quoted additional materials/labour cost ABOVE the original complete 3,142 L package. UGX 0 means UNPRICED, not a free upgrade. Current base uses four pallets; extra pallet count/price are awaiting SANDS confirmation.</small></div>}
              <div className="financeField"><label htmlFor="starterBag">Starter bag included with each new catfish tank (kg, assumed)</label><Numeric id="starterBag" value={inputs.starterBagKgPerTank} min={0} max={100} step={1} onChange={(starterBagKgPerTank) => set({ starterBagKgPerTank })}/><small>The package includes one bag per tank. Bag weight is NOT YET CONFIRMED; 25 kg is an editable example. Only this quantity is deducted from the additional feed purchased.</small></div>
              <div className="financeField"><label htmlFor="extraFilter">ADDITIONAL upgraded filtration budget for the entire system (UGX)</label><Numeric id="extraFilter" value={inputs.extraFiltrationBudget} min={0} max={50000000} step={50000} onChange={(extraFiltrationBudget) => set({ extraFiltrationBudget })}/><small>Only price upgrades BEYOND the mechanical/biological filters already included in the SANDS package (UGX 600,000 per tank). Enter a verified extra cost for improved solids removal, larger media, filtration plumbing or oxygenation. Zero means NOT QUOTED, not that upgrades are unnecessary.</small></div>
              <div className="financeField"><label htmlFor="seasonOtherCost">Other running costs per season (UGX)</label><Numeric id="seasonOtherCost" value={inputs.otherSeasonCost} min={0} max={100000000} step={100000} onChange={(otherSeasonCost) => set({ otherSeasonCost })}/><small>Add labour, harvesting, delivery, marketing, repairs and other costs not already covered by the training/testing allowances. Zero means these expenses are UNPRICED, not that they don't exist. They are deducted from every season, including the first.</small></div>
              <div className="financeField"><label htmlFor="waterRate">Source water cost (UGX/1,000 L)</label><Numeric id="waterRate" value={inputs.waterCostPer1000L} min={0} max={100000} step={500} onChange={(waterCostPer1000L) => set({ waterCostPer1000L })}/><small>UGX 0 means not priced, NOT free. Enter a real water cost for the profitability estimate.</small></div>
            </div>
            <p className="financeMuted">SANDS new catfish package: one tank {ugx(SANDS_TANK.singleTankPackage)}; two or more {ugx(SANDS_TANK.multiTankPackagePerTank)} per tank, including initial fingerlings and one starter bag each. The 25 kg starter-bag size is only an example. Stocking covers mortality for the intended harvest. Survival, starter weight, FCR, working depth and safe filtration capacity need checking. Repeat-cycle fingerlings are provisionally valued at UGX 500/fish; feed is {ugx(profile.feedPriceKg)}/kg.</p>
          </details>
        </section>

        <section className="financeResults" aria-live="polite" aria-label="Estimated farm result">
          <div className="financeResultsTop">
            <span className="financeEyebrow">YOUR FIRST-CYCLE ESTIMATE</span>
            <h2>{result.feasible ? (isNew ? "Suggested setup" : "Existing-tank estimate") : "Budget or system needs review"}</h2>
            <p>{result.feasible ? "Based on the figures you selected:" : "The proposed project is outside your budget or current circulation capacity."}</p>
          </div>
          <div className="financeFigures">
            <div><small>Culture tanks</small><strong>{quantity(result.tanks)}</strong><span>{quantity(inputs.tankLitres)} L each</span></div>
            <div><small>Fingerlings to stock (mortality included)</small><strong>{quantity(result.fishStocked)}</strong><span>Target: {quantity(result.fishHarvested)} fish harvested at {(inputs.survival * 100).toFixed(0)}% survival</span></div>
            <div><small>Harvest biomass</small><strong>{quantity(result.harvestKg, 1)} kg</strong><span>At {inputs.harvestKgEach} kg/fish</span></div>
            <div><small>Full-cycle feed</small><strong>{quantity(result.feedKg, 1)} kg</strong><span>FCR {inputs.fcr} plus 8% buffer</span></div>
          </div>

          {inputs.species === "catfish" && result.harvestKg / Math.max(0.001, result.volumeLitres / 1000) >= 90 && <div className="financeCautions"><strong>High-intensity production target — engineering review required</strong><p>{quantity(result.fishHarvested)} harvest fish × {inputs.harvestKgEach} kg means {quantity(result.harvestKg, 1)} kg across {quantity(result.volumeLitres)} working litres ({quantity(result.harvestKg / (result.volumeLitres / 1000), 1)} kg/m³). This target is NOT approval to stock. A SANDS site assessment must verify oxygen transfer, pump duty, biofilter ammonia-removal capacity, solids/CO₂ removal, backup power and water quality before a financing proposal can become a final quotation.</p></div>}

          <div className="financePanel">
            <h3>Where the money goes</h3>
            {result.isSandsPackage ? <>
              <div className="financeCost"><span>SANDS inclusive RAS package{result.tanks === 1 ? " (single-tank rate)" : " (multi-tank rate)"}</span><b>{ugx(result.packageCost)}{result.upgradePricingPending ? " (MINIMUM)" : ""}</b></div>
              {result.upgradedTank && <div className="financeCost"><span>Extra sheet, pallets and fabrication ({quantity(result.tanks)} tanks)</span><b>{result.upgradePricingPending ? "NOT QUOTED" : ugx(result.upgradedTankExtraCost)}</b></div> }
              <div className="financeCost"><span>Fingerlings supplied in package</span><b>{quantity(result.includedFingerlings)} included · no extra charge</b></div>
              <div className="financeCost"><span>Starter feed supplied in package</span><b>{quantity(result.includedStarterFeedKg, 1)} kg assumed · included</b></div>
              <div className="financeCost"><span>Additional feed for first season ({quantity(result.additionalFeedKg, 1)} kg)</span><b>{ugx(result.feedCost)}</b></div>
              <div className="financeCost"><span>Provisional additional backup power (NOT in package)</span><b>{ugx(result.backupAllowance)}</b></div>
            </> : <>
              <div className="financeCost"><span>{isNew ? "Provisional equipment and installation" : "Provisional missing equipment upgrades"}</span><b>{ugx(result.infrastructure)}</b></div>
              <div className="financeCost"><span>Initial fingerlings</span><b>{ugx(result.fingerlingsCost)}</b></div>
              <div className="financeCost"><span>First season feed</span><b>{ugx(result.feedCost)}</b></div>
            </>}
            {result.extraFiltrationBudget > 0 && <div className="financeCost"><span>Additional filtration upgrade (ABOVE package)</span><b>{ugx(result.extraFiltrationBudget)}</b></div>}
            <div className="financeCost"><span>Estimated power</span><b>{ugx(result.energyCost)}</b></div>
            <div className="financeCost"><span>Support and training allowance</span><b>{ugx(result.supportCost)}</b></div>
            <div className="financeCost"><span>Water testing and supplies</span><b>{ugx(result.waterTestingCost)}</b></div>
            <div className="financeCost"><span>Fresh water supply, initial fill + exchange</span><b>{ugx(result.waterSupplyCost)}{inputs.waterCostPer1000L === 0 ? " (unpriced)" : ""}</b></div>
            <div className="financeCost"><span>Other per-season operating expenses</span><b>{ugx(result.otherSeasonCost)}{inputs.otherSeasonCost === 0 ? " (unpriced)" : ""}</b></div>
            <div className="financeCost"><span>10% contingency</span><b>{ugx(result.contingency)}</b></div>
            {result.isSandsPackage && <p className="financeMuted">SANDS package prices: {ugx(SANDS_TANK.singleTankPackage)} for one tank, or {ugx(SANDS_TANK.multiTankPackagePerTank)} per tank for two or more. The package includes tanks, one shared 50,000 L/h, 500 W pump for up to six tanks, mechanical/biological filtration valued at UGX 600,000 per tank, aeration, installation, mortality-adjusted fingerlings and one starter feed bag per tank. The starter bag is assumed {quantity(inputs.starterBagKgPerTank)} kg until confirmed. Backup power, electricity, extra feed, testing/support, water and contingency are listed separately. For 5,000 L tanks, the calculated package total includes ONLY a quoted extra materials charge if supplied; until then it is a minimum, NOT a complete price. The technical suitability of 500 kg harvest per tank remains unverified.</p>}
            <div className="financeTotal"><span>{result.upgradePricingPending ? "MINIMUM estimated project (larger tank fabrication unpriced)" : "Total estimated project"}</span><strong>{ugx(result.projectTotal)}</strong></div>
            <div className="financeMeter" aria-label="Percentage of your budget used"><span style={{ width: Math.min(100, budgetUsedPercent) + "%" }} /></div>
            <p className={result.amountRemaining < 0 ? "financeShortfall" : "financeMuted"}>
              {result.amountRemaining >= 0 ? "Estimated unallocated budget: " + ugx(result.amountRemaining) : "Estimated extra budget required: " + ugx(-result.amountRemaining)}
            </p>
          </div>

          <div className="financePanel">
            <h3>What your filtration must handle</h3>
            <div className="financeMetrics">
              <div><small>Peak daily feed</small><strong>{quantity(result.peakFeedKgDay, 2)} kg/day</strong></div>
              <div><small>Ammonia nitrogen (TAN)</small><strong>{quantity(result.tanGramsDay, 1)} g/day</strong></div>
              <div><small>Total flow allocated to tanks</small><strong>{quantity(result.nominalPumpLph)} L/hour</strong></div>
              <div><small>Estimated oxygen demand</small><strong>{quantity(result.oxygenKgDay, 2)} kg/day</strong></div>
            </div>
            {isNew && <div className="financeMetrics">
              <div><small>Installed shared pump units</small><strong>{quantity(result.pumpUnits)} × {quantity(SANDS_TANK.pumpFlowLph)} L/h</strong></div>
              <div><small>Allocated to each tank</small><strong>{quantity(result.flowPerTankLph)} L/h</strong></div>
              <div><small>Nominal bypass / aerating return</small><strong>{quantity(result.provisionalBypassFlowLph)} L/h</strong></div>
            </div>}
            <p className="financeMuted">One 50,000 L/h, 500 W pump is shared between up to six SANDS tanks at the same UGX 1.5m equipment price. Water goes through a distribution manifold; excess nominal capacity may recirculate via the final filtration/aeration stage. The bypass must not short-circuit waste treatment, and does not itself certify oxygen delivery. All flow figures require measurement at operating head. Planning factors: 2% peak-day feeding rate, 40 g TAN/kg feed, 0.6 kg O₂/kg feed, and a 1.25× tank-volume/hour circulation screen. SANDS must size the solids filter, biofilter media, oxygenation, CO₂ removal and backup power for the actual site.</p>
          </div>

          <div className="financePanel">
            <h3>Fresh water supply and daily exchange</h3>
            <div className="financeMetrics">
              <div><small>New water replacement</small><strong>{quantity(inputs.waterExchangePct)}% per day</strong></div>
              <div><small>Fresh make-up water</small><strong>{quantity(result.dailyFreshWaterLitres)} L/day</strong></div>
              <div><small>Equivalent discharge</small><strong>{quantity(result.dailyDischargeLitres)} L/day</strong></div>
              <div><small>Exchange water for full season</small><strong>{quantity(result.cycleExchangeWaterLitres)} L</strong></div>
              <div><small>Initial tank fill (new systems)</small><strong>{quantity(result.initialFillLitres)} L</strong></div>
              <div><small>Total first-season NEW water</small><strong>{quantity(result.firstCycleFreshWaterLitres)} L</strong></div>
            </div>
            <h4>Same tanks — compare 20% and 50% new-water exchange</h4>
            <div className="financeScenarioTable">
              <div className="financeScenarioHeading"><span>Daily replacement</span><span>Litres per day</span><span>Litres per season</span></div>
              {[20, 50].map(pct => (
                <div className="financeScenarioRow" key={pct}>
                  <span>{pct}%{inputs.waterExchangePct === pct ? " (selected)" : ""}</span>
                  <span>{quantity(result.volumeLitres * pct / 100)} L</span>
                  <strong>{quantity(result.volumeLitres * pct / 100 * inputs.cycleDays)} L</strong>
                </div>
              ))}
            </div>
            <p className="financeMuted">Choosing 50% instead of 20% adds {quantity(result.volumeLitres * .30)} L/day and {quantity(result.volumeLitres * .30 * inputs.cycleDays)} L per season at the same tank size. The incremental water-source charge would be {inputs.waterCostPer1000L === 0 ? "UNPRICED (enter UGX per 1,000 L above)" : ugx(result.volumeLitres * .30 * inputs.cycleDays / 1000 * inputs.waterCostPer1000L)}; treatment, water pumping and discharge charges may be additional. The 50,000 L/hour shared RAS pump only circulates existing system water; it does not provide this new supply. Extra filtration does not guarantee the 500 kg/tank harvest: check biofilter TAN capacity, solids capture, oxygen transfer and CO₂ removal.</p>
          </div>

          <div className="financePanel">
            <h3>First harvest: did I recover my startup investment?</h3>
            <p className="financeMuted">This calculation subtracts the complete first-season farm purchase (including all tanks, pump and filtration supplied in the package), plus additional feed, electricity, support, water testing, estimated water charges and contingency.</p>
            <div className="financeCost"><span>Harvest sales (estimated)</span><b>{ugx(result.projectedSales)}</b></div>
            <div className="financeCost"><span>Less: full first-season investment INCLUDING tanks and installation</span><b>− {ugx(investment.initialCapital)}</b></div>
            <div className="financeTotal"><span>{investment.firstCycleCashResult >= 0 ? "Cash left after recovering all modeled startup costs" : "Unrecovered investment after first harvest"}</span><strong className={investment.firstCycleCashResult < 0 ? "financeNegative" : ""}>{ugx(investment.firstCycleCashResult)}</strong></div>
            <p className="financeMuted">{result.upgradePricingPending ? "The proposed larger tank's extra sheet, pallet and fabrication expenses have NOT been priced, so this projected net cash is an optimistic lower-cost example, NOT a financing-ready result. " : ""}A negative amount means the farmer has NOT recovered the startup investment. A positive amount means modeled first-season cash receipts exceed ALL entered costs, not that SANDS guarantees profit. Actual water-source expense, labour, transport, harvesting and engineering compliance costs must still be verified and entered where not already included. Loan financing costs are not yet modeled.</p>
          </div>

          <div className="financePanel">
            <h3>Investment recovery & payback</h3>
            <div className="financeMetrics">
              <div><small>First season: entire setup + running costs</small><strong>{ugx(investment.initialCapital)}</strong></div>
              <div><small>Net after first-season harvest</small><strong>{ugx(investment.firstCycleCashResult)}</strong></div>
              <div><small>Cash left in later seasons, before prior losses</small><strong>{ugx(investment.cashSurplusPerCycle)}</strong></div>
              <div><small>First season with all startup money recovered</small><strong>{investment.paybackSeasons === null ? "Not recovered" : "Season " + investment.paybackSeasons}</strong></div>
              <div><small>Approximate elapsed time</small><strong>{investment.paybackMonths === null ? "Not recovered" : investment.paybackMonths + " months"}</strong></div>
            </div>
            <p className="financeMuted">Payback is the number of complete {inputs.cycleDays}-day production cycles until cumulative cash flow turns positive. The first season counts the inclusive package and only additional feed; later seasons must purchase new fingerlings and ALL feed. Includes a 10% allowance and excludes loan interest, tax, land, significant repairs and unpriced costs. Feed conversion and stocking density remain unverified.</p>
            <h4>Season-by-season recovery (expected case)</h4>
            <div className="financeScenarioTable">
              <div className="financeScenarioHeading"><span>Season</span><span>Season net cash</span><span>Cumulative net cash</span></div>
              {investment.cashFlow.map(s => (
                <div className="financeScenarioRow" key={s.season}>
                  <span>{s.season === 1 ? "1 (includes all setup)" : String(s.season)}</span>
                  <span className={s.seasonCashResult < 0 ? "financeNegative" : ""}>{ugx(s.seasonCashResult)}</span>
                  <strong className={s.cumulativeCash < 0 ? "financeNegative" : ""}>{ugx(s.cumulativeCash)}</strong>
                </div>
              ))}
            </div>
            <p className="financeMuted">The cumulative figure includes the original purchase price in Season 1. Later seasons are charged for new fingerlings, full feed and other recurring costs. Positive cumulative cash first appears when the investment has been recovered. Assumes equivalent uninterrupted seasons with a full harvest each time.</p>
            <h4>What if survival, feed conversion or selling price change?</h4>
            <div className="financeScenarioTable">
              <div className="financeScenarioHeading"><span>Scenario</span><span>First-season cash after setup</span><span>Payback</span></div>
              {investment.scenarios.map(s => (
                <div key={s.label} className="financeScenarioRow">
                  <span>{s.label}</span>
                  <span className={s.firstCycleCashResult < 0 ? "financeNegative" : ""}>{ugx(s.firstCycleCashResult)}</span>
                  <strong>{s.paybackSeasons === null ? "Not reached" : s.paybackSeasons + " seasons"}</strong>
                </div>
              ))}
            </div>
            <p className="financeMuted">Conservative: lower survival, higher FCR and selling price 10% lower. Optimistic: slightly higher survival, better FCR and selling price 10% higher. These are illustrative sensitivities, not validated probabilities or guarantees.</p>
          </div>

          <div className="financeCautions">
            <strong>Important planning checks</strong>
            <ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </div>
          <div className="financeProposal" id="prepare-proposal">
            <h3>Turn your estimate into a funding proposal</h3>
            <p>Generate a personalised PDF you can download, print or send to a bank, investor, farmer group or other potential funder. Your assumptions, fish plan, cost breakdown, filtration screening, risk cases and payback analysis are included automatically.</p>
            <div className="financeField">
              <label htmlFor="proposalName">Applicant or organisation (optional)</label>
              <input id="proposalName" type="text" maxLength={100} placeholder="Name or organisation"
                value={applicant.name} onChange={e => setApplicantField("name", e.target.value)} />
            </div>
            <div className="financeField">
              <label htmlFor="proposalProject">Project title (optional)</label>
              <input id="proposalProject" type="text" maxLength={120} placeholder="e.g. Kanyanya Catfish Enterprise"
                value={applicant.projectName} onChange={e => setApplicantField("projectName", e.target.value)} />
            </div>
            <div className="financeTwoCol">
              <div className="financeField">
                <label htmlFor="proposalLocation">Proposed farm location</label>
                <input id="proposalLocation" type="text" maxLength={120} placeholder="District, town"
                  value={applicant.location} onChange={e => setApplicantField("location", e.target.value)} />
              </div>
              <div className="financeField">
                <label htmlFor="proposalContact">Contact (optional)</label>
                <input id="proposalContact" type="text" maxLength={100} placeholder="Email or phone"
                  value={applicant.contact} onChange={e => setApplicantField("contact", e.target.value)} />
              </div>
            </div>
            <div className="financeField">
              <label htmlFor="proposalFinancier">Who will receive the funding request? (optional)</label>
              <input id="proposalFinancier" type="text" maxLength={120} placeholder="e.g. Equity Bank Uganda / investor"
                value={applicant.financier} onChange={e => setApplicantField("financier", e.target.value)} />
            </div>
            <div className="financeField">
              <label htmlFor="proposalContribution">Your own contribution (UGX)</label>
              <Numeric id="proposalContribution" min={0} max={100000000} step={100000}
                value={applicant.contribution}
                onChange={v => setApplicantField("contribution", Math.max(0, Math.min(result.projectTotal, v)))} />
              <small>Funding gap: {ugx(Math.max(0, result.projectTotal - applicant.contribution))} of the estimated {ugx(result.projectTotal)} project cost. This is a financing request, not an approved facility.</small>
            </div>
            <div className="financeField">
              <label htmlFor="proposalNotes">Notes for a funder (optional)</label>
              <textarea id="proposalNotes" maxLength={700} rows={3} placeholder="Land or premises available, experience, possible buyers, etc."
                value={applicant.notes} onChange={e => setApplicantField("notes", e.target.value)} />
            </div>
            <button type="button" className="financeDownload" disabled={isDownloading} onClick={downloadProposal}>
              {isDownloading ? "Preparing PDF..." : "Download My Funding Proposal (PDF) ↓"}
            </button>
            <p className="financeSampleLink"><a href="/api/finance-proposal?sample=1">Download an example proposal (PDF)</a></p>
            {proposalError && <p role="alert" className="financeShortfall">{proposalError}</p>}
            <p className="financeMuted">PDF figures are recalculated by SANDS' server when you download. Details are used to generate the PDF and are not saved to a SANDS customer database. This proposal is an early estimate, not a bank application or final quotation.</p>
          </div>
          <a className="financeRequest" href={inquiryUrl} target="_blank" rel="noreferrer">Request a detailed SANDS quotation →</a>
          <p className="financeFinePrint">Your selections are sent to WhatsApp only if you open the request. No Equity Bank application or loan approval is submitted from this page. Equipment and electricity assumptions need confirmed quotations. A loan product would be added only after a bank partnership is agreed.</p>
        </section>
      </div>
    </main>
  );
}
