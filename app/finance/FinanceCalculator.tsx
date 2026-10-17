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
    "Estimated fingerlings: " + quantity(result.fishStocked),
    "Estimated feed: " + quantity(result.feedKg, 1) + " kg",
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
            <Numeric id="waterExchangePct" value={inputs.waterExchangePct} min={20} max={100} step={5} onChange={(waterExchangePct) => set({ waterExchangePct })}/>
            <small>SANDS minimum: 20% per day. Fresh water is separate from recirculating pump flow.</small>
          </div>
          {isNew ? (
            <div className="financeField">
              <label>SANDS standard circular tank</label>
              <p><strong>{SANDS_TANK.diameterM} m diameter × {SANDS_TANK.wallHeightM} m high</strong> — about {quantity(SANDS_TANK.brimfulLitres)} L at the rim; this estimate uses <strong>{quantity(SANDS_TANK.workingLitres)} L</strong> at a provisional {SANDS_TANK.assumedWaterDepthM.toFixed(1)} m operating depth.</p>
              <small>Current tank equipment pricing applies to this standard tank. We must verify actual operating water depth and the complete filtration design before quoting.</small>
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
              <div className="financeField"><label htmlFor="pumpWatts">Shared pump electrical draw (W per pump)</label><Numeric id="pumpWatts" value={inputs.pumpWatts} min={50} max={10000} step={50} onChange={(pumpWatts) => set({ pumpWatts })}/><small>SANDS-reported rating: 300 W per pump, shared across up to six standard tanks. Not 300 W per tank.</small></div>
              <div className="financeField"><label htmlFor="aerationWatts">Aerator electrical draw (W per aerator; assumes one per tank)</label><Numeric id="aerationWatts" value={inputs.aerationWattsPerTank} min={0} max={3000} step={5} onChange={(aerationWattsPerTank) => set({ aerationWattsPerTank })}/><small>SANDS-reported aerator rating: 40 W. The calculator currently budgets one aerator per tank; confirm if the aeration units are shared between tanks.</small></div>
              <div className="financeField"><label htmlFor="waterRate">Source water cost (UGX/1,000 L)</label><Numeric id="waterRate" value={inputs.waterCostPer1000L} min={0} max={100000} step={500} onChange={(waterCostPer1000L) => set({ waterCostPer1000L })}/><small>UGX 0 means not priced, NOT free. Enter a real water cost for the profitability estimate.</small></div>
            </div>
            <p className="financeMuted">SANDS catfish feed/equipment costs and sales target were updated from supplied figures. Stocking is now reverse-calculated from the target HARVEST count to include mortality. Survival, starting weight, FCR, pump wattage, operating depth, and high-intensity filtration capacity still need confirmation. Fingerlings remain UGX 500/fish pending confirmation; feed is {ugx(profile.feedPriceKg)}/kg.</p>
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

          {inputs.species === "catfish" && result.harvestKg / Math.max(0.001, result.volumeLitres / 1000) > 100 && <div className="financeCautions"><strong>High-intensity production target — engineering review required</strong><p>{quantity(result.fishHarvested)} harvest fish × {inputs.harvestKgEach} kg means {quantity(result.harvestKg, 1)} kg across {quantity(result.volumeLitres)} working litres ({quantity(result.harvestKg / (result.volumeLitres / 1000), 1)} kg/m³). This target is NOT approval to stock. A SANDS site assessment must verify oxygen transfer, pump duty, biofilter ammonia-removal capacity, solids/CO₂ removal, backup power and water quality before a financing proposal can become a final quotation.</p></div>}

          <div className="financePanel">
            <h3>Where the money goes</h3>
            <div className="financeCost"><span>{isNew ? "Tanks, RAS, installation & backup" : "Provisional missing equipment upgrades"}</span><b>{ugx(result.infrastructure)}</b></div>
            <div className="financeCost"><span>Fingerlings</span><b>{ugx(result.fingerlingsCost)}</b></div>
            <div className="financeCost"><span>Feed for one cycle</span><b>{ugx(result.feedCost)}</b></div>
            <div className="financeCost"><span>Estimated power</span><b>{ugx(result.energyCost)}</b></div>
            <div className="financeCost"><span>Support and training allowance</span><b>{ugx(result.supportCost)}</b></div>
            <div className="financeCost"><span>Water testing and supplies</span><b>{ugx(result.waterTestingCost)}</b></div>
            <div className="financeCost"><span>Fresh water supply, initial fill + exchange</span><b>{ugx(result.waterSupplyCost)}{inputs.waterCostPer1000L === 0 ? " (unpriced)" : ""}</b></div>
            <div className="financeCost"><span>10% contingency</span><b>{ugx(result.contingency)}</b></div>
            {isNew && <p className="financeMuted">SANDS component prices PER TANK: tank {ugx(SANDS_TANK.tankCost)}, mechanical + biological filter {ugx(SANDS_TANK.filterCost)} (confirmed per tank), aeration {ugx(SANDS_TANK.aerationCost)}, piping/installation {ugx(SANDS_TANK.pipingInstallCost)}. <strong>{quantity(result.pumpUnits)} shared pump(s)</strong> are costed at {ugx(SANDS_TANK.pumpCost)} each, with one nominal 30,000 L/h pump for up to six standard tanks. Backup power {ugx(1200000)} is only a provisional allowance. The standard UGX 600,000 filtration package is NOT yet certified for a 500 kg/tank production target. Electricity uses SANDS-reported ratings of {quantity(inputs.pumpWatts)} W per shared water pump and {quantity(inputs.aerationWattsPerTank)} W per aerator, provisionally assuming one aerator per tank. Actual duty and safe oxygen-delivery capacity must be verified before promising payback figures.</p>}
            <div className="financeTotal"><span>Total estimated project</span><strong>{ugx(result.projectTotal)}</strong></div>
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
            <p className="financeMuted">One 30,000 L/h pump is shared between up to six SANDS standard tanks. Water goes through a distribution manifold; excess nominal capacity may recirculate via the final filtration/aeration stage. The bypass must not short-circuit waste treatment, and does not itself certify oxygen delivery. All flow figures require measurement at operating head. Planning factors: 2% peak-day feeding rate, 40 g TAN/kg feed, 0.6 kg O₂/kg feed, and a 1.25× tank-volume/hour circulation screen. SANDS must size the solids filter, biofilter media, oxygenation, CO₂ removal and backup power for the actual site.</p>
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
            <p className="financeMuted">A 20% exchange for a 3,142 L working tank is approximately 628 L/day of new water (and an equal amount removed to keep the level constant). The pump's 30,000 L/hour internal flow does not count as new water. Water quality and reliable source capacity must be verified. Evaporation, cleaning and spills require additional top-ups. {inputs.waterCostPer1000L === 0 ? "Water supply is currently UNPRICED. Set the per-1,000-litre water price in advanced settings; UGX 0 does not mean the water is free." : "Water source charges at " + ugx(inputs.waterCostPer1000L) + " per 1,000 L are included in running costs, but treatment, source pumping and wastewater charges still need checking."}</p>
          </div>

          <div className="financePanel">
            <h3>Possible sales — and the real cost</h3>
            <div className="financeCost"><span>Projected fish sales</span><b>{ugx(result.projectedSales)}</b></div>
            <div className="financeCost"><span>Less cycle running costs</span><b>− {ugx(result.runningCost)}</b></div>
            <div className="financeTotal"><span>Illustrative operating margin</span><strong className={result.cycleOperatingMargin < 0 ? "financeNegative" : ""}>{ugx(result.cycleOperatingMargin)}</strong></div>
            <p className="financeMuted">Before installation cost recovery, financing repayments, taxes, land, transport, salaries outside the allowance, depreciation or unexpected losses. First-cycle cash position after all modeled setup costs and contingency: <strong>{ugx(result.firstCycleCashResult)}</strong>. The business case must consider repeated cycles.</p>
          </div>

          <div className="financePanel">
            <h3>Investment recovery & payback</h3>
            <div className="financeMetrics">
              <div><small>Initial capital to recover</small><strong>{ugx(investment.initialCapital)}</strong></div>
              <div><small>Expected net cash / season</small><strong>{ugx(investment.cashSurplusPerCycle)}</strong></div>
              <div><small>Payback in full seasons</small><strong>{investment.paybackSeasons === null ? "No payback" : investment.paybackSeasons + " season(s)"}</strong></div>
              <div><small>Approximate elapsed time</small><strong>{investment.paybackMonths === null ? "Not recovered" : investment.paybackMonths + " months"}</strong></div>
            </div>
            <p className="financeMuted">Payback counts complete {inputs.cycleDays}-day production cycles required to recover initial setup costs from estimated repeat-cycle net cash, including a 10% cost allowance. It excludes loan interest, tax, land, significant repairs and costs not priced here.</p>
            <div className="financeScenarioTable">
              <div className="financeScenarioHeading"><span>Scenario</span><span>Net per season</span><span>Payback</span></div>
              {investment.scenarios.map(s => (
                <div key={s.label} className="financeScenarioRow">
                  <span>{s.label}</span>
                  <span className={s.cashSurplus < 0 ? "financeNegative" : ""}>{ugx(s.cashSurplus)}</span>
                  <strong>{s.paybackSeasons === null ? "Not reached" : s.paybackSeasons + " seasons"}</strong>
                </div>
              ))}
            </div>
            <p className="financeMuted">Conservative: lower survival, higher FCR and selling price 10% lower. Optimistic: slightly higher survival, better FCR and selling price 10% higher. Even the optimistic case is not a guarantee.</p>
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
