"use client";

import { useMemo, useState } from "react";
import { DEFAULTS, SPECIES, simulateFarm, ugx, quantity, type FarmInputs, type Species } from "../../lib/farm-finance";

const moneyNumber = (n: number) => Number.isFinite(n) ? Math.round(n) : 0;
const Numeric = ({ value, min = 0, max = 999999, step = 1, onChange, id }: {
  value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void; id?: string
}) => <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step}
  value={value} onChange={(e) => onChange(Number(e.target.value))} />;

export default function FinanceCalculator() {
  const [inputs, setInputs] = useState<FarmInputs>(DEFAULTS);
  const set = (update: Partial<FarmInputs>) => setInputs(current => ({ ...current, ...update }));
  const result = useMemo(() => simulateFarm(inputs), [inputs]);
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
              set({ species, fcr: SPECIES[species].defaultFcr, harvestKgEach: SPECIES[species].defaultHarvestKg });
            }}>
              <option value="catfish">African catfish</option><option value="tilapia">Tilapia</option>
            </select>
          </div>

          {isNew ? (
            <div className="financeField">
              <label htmlFor="newTankVolume">Preferred tank size</label>
              <select id="newTankVolume" value={inputs.tankLitres} onChange={(e) => set({ tankLitres: Number(e.target.value) })}>
                <option value={2000}>2,000 litres per tank</option>
                <option value={3000}>3,000 litres per tank</option>
                <option value={5000}>5,000 litres per tank</option>
              </select>
              <small>The slider finds the largest complete first-cycle setup that fits your budget, using provisional per-tank equipment allowances.</small>
            </div>
          ) : (
            <>
              <div className="financeTwoCol">
                <div className="financeField"><label htmlFor="existingVolume">Litres per tank</label>
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
            </div>
            <p className="financeMuted">Default survival, densities, energy use and capital prices are screening assumptions, not guarantees. Current fingerling and feed price references are UGX 500/fish and {ugx(profile.feedPriceKg)}/kg.</p>
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
            <div><small>Fingerlings to stock</small><strong>{quantity(result.fishStocked)}</strong><span>{quantity(result.fishHarvested)} estimated survivors</span></div>
            <div><small>Harvest biomass</small><strong>{quantity(result.harvestKg, 1)} kg</strong><span>At {inputs.harvestKgEach} kg/fish</span></div>
            <div><small>Full-cycle feed</small><strong>{quantity(result.feedKg, 1)} kg</strong><span>FCR {inputs.fcr} plus 8% buffer</span></div>
          </div>

          <div className="financePanel">
            <h3>Where the money goes</h3>
            <div className="financeCost"><span>{isNew ? "Tanks, RAS, installation & backup" : "Provisional missing equipment upgrades"}</span><b>{ugx(result.infrastructure)}</b></div>
            <div className="financeCost"><span>Fingerlings</span><b>{ugx(result.fingerlingsCost)}</b></div>
            <div className="financeCost"><span>Feed for one cycle</span><b>{ugx(result.feedCost)}</b></div>
            <div className="financeCost"><span>Estimated power</span><b>{ugx(result.energyCost)}</b></div>
            <div className="financeCost"><span>Support and training allowance</span><b>{ugx(result.supportCost)}</b></div>
            <div className="financeCost"><span>Water testing and supplies</span><b>{ugx(result.waterTestingCost)}</b></div>
            <div className="financeCost"><span>10% contingency</span><b>{ugx(result.contingency)}</b></div>
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
              <div><small>Preliminary circulation check</small><strong>{quantity(result.nominalPumpLph)} L/hour</strong></div>
              <div><small>Estimated oxygen demand</small><strong>{quantity(result.oxygenKgDay, 2)} kg/day</strong></div>
            </div>
            <p className="financeMuted">Planning factors: 2% peak-day feeding rate, 40 g TAN/kg feed, 0.6 kg O₂/kg feed, and a 1.25× tank-volume/hour circulation screen. These are <strong>not</strong> equipment ratings or safe-stock guarantees. SANDS must size the solids filter, biofilter media, aeration, CO₂ removal and backup power for the actual site.</p>
          </div>

          <div className="financePanel">
            <h3>Possible sales — and the real cost</h3>
            <div className="financeCost"><span>Projected fish sales</span><b>{ugx(result.projectedSales)}</b></div>
            <div className="financeCost"><span>Less cycle running costs</span><b>− {ugx(result.runningCost)}</b></div>
            <div className="financeTotal"><span>Illustrative operating margin</span><strong className={result.cycleOperatingMargin < 0 ? "financeNegative" : ""}>{ugx(result.cycleOperatingMargin)}</strong></div>
            <p className="financeMuted">Before installation cost recovery, financing repayments, taxes, land, transport, salaries outside the allowance, depreciation or unexpected losses. First-cycle cash position after all modeled setup costs and contingency: <strong>{ugx(result.firstCycleCashResult)}</strong>. The business case must consider repeated cycles.</p>
          </div>

          <div className="financeCautions">
            <strong>Important planning checks</strong>
            <ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </div>
          <a className="financeRequest" href={inquiryUrl} target="_blank" rel="noreferrer">Request a detailed SANDS quotation →</a>
          <p className="financeFinePrint">Your selections are sent to WhatsApp only if you open the request. No Equity Bank application or loan approval is submitted from this page. Equipment and electricity assumptions need confirmed quotations. A loan product would be added only after a bank partnership is agreed.</p>
        </section>
      </div>
    </main>
  );
}
