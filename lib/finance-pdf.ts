import { ugx, quantity, SPECIES, SANDS_TANK, type FarmInputs, type FarmResult } from "./farm-finance";
import { type InvestmentAnalysis } from "./farm-investment";

export type ApplicantDetails = {
  name: string;
  projectName: string;
  location: string;
  contact: string;
  financier: string;
  contribution: number;
  notes: string;
};

const PAGE_W = 595;
const PAGE_H = 842;
const M = 47;

function printable(input: string) {
  return String(input).normalize("NFKD").replace(/[^\x20-\x7e]/g, " ").replace(/\s+/g, " ").trim();
}
function pdfEscape(text: string) {
  return printable(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function wrap(text: string, maxChars: number) {
  const words = printable(text).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + word.length + 1 > maxChars) {
      lines.push(line);
      line = word;
    } else line = line ? line + " " + word : word;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

class PDFWriter {
  pages: string[][] = [];
  y = 0;
  constructor() { this.newPage(); }
  command(text: string) { this.pages[this.pages.length - 1].push(text); }
  draw(x: number, y: number, text: string, size = 10, bold = false, color = "0.12 0.20 0.27") {
    this.command("BT " + color + " rg /F" + (bold ? "2" : "1") + " " + size +
      " Tf 1 0 0 1 " + x.toFixed(1) + " " + y.toFixed(1) + " Tm (" +
      pdfEscape(text) + ") Tj ET");
  }
  newPage() {
    this.pages.push([]);
    this.command("0.03 0.19 0.28 rg 0 " + (PAGE_H - 94) + " " + PAGE_W + " 94 re f");
    this.draw(M, PAGE_H - 43, "SANDS FISH FARM (U) LIMITED", 15, true, "1 1 1");
    this.draw(M, PAGE_H - 63, "AQUACULTURE ENTERPRISE | UGANDA", 9, false, ".73 .90 .87");
    this.draw(M, PAGE_H - 81, "Indicative project assessment - not an approved loan or supplier quote", 8.3, false, ".82 .91 .95");
    this.y = PAGE_H - 119;
  }
  ensure(height: number) { if (this.y - height < 60) this.newPage(); }
  heading(text: string) {
    this.ensure(43);
    this.y -= 13;
    this.command("0.07 0.45 0.36 rg " + M + " " + (this.y - 4).toFixed(1) + " 4 18 re f");
    this.draw(M + 13, this.y, text, 13, true, "0.04 0.25 0.31");
    this.y -= 19;
  }
  paragraph(text: string) {
    const lines = wrap(text, 97);
    for (const line of lines) { this.ensure(17); this.draw(M, this.y, line, 9.8); this.y -= 15; }
    this.y -= 7;
  }
  item(label: string, value: string) {
    this.ensure(23);
    this.draw(M, this.y, label.slice(0, 57), 9.3, false, ".28 .39 .44");
    const v = printable(value);
    const x = Math.max(365, PAGE_W - M - v.length * 5.3);
    this.draw(x, this.y, v, 9.3, true, ".08 .24 .30");
    this.command(".87 .91 .93 RG .5 w " + M + " " + (this.y - 7) +
      " m " + (PAGE_W - M) + " " + (this.y - 7) + " l S");
    this.y -= 23;
  }
  note(text: string) {
    const lines = wrap(text, 106);
    for (const line of lines) {
      this.ensure(14);
      this.draw(M, this.y, line, 8.2, false, ".38 .44 .49");
      this.y -= 13;
    }
    this.y -= 6;
  }
  build(): Buffer {
    // Add footer after all pagination is settled.
    this.pages.forEach((page, i) => {
      page.push(".80 .85 .88 RG .5 w " + M + " 48 m " + (PAGE_W - M) + " 48 l S");
      page.push("BT .4 .47 .52 rg /F1 8 Tf 1 0 0 1 " + M + " 31 Tm (SANDS Fish Farm | sands.co.ug | james@sands.co.ug) Tj ET");
      page.push("BT .4 .47 .52 rg /F1 8 Tf 1 0 0 1 506 31 Tm (Page " + (i + 1) +
        " / " + this.pages.length + ") Tj ET");
    });
    const objects: string[] = ["", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
    const children: number[] = [];
    for (const page of this.pages) {
      const source = page.join("\n") + "\n";
      const streamId = objects.length + 1;
      objects.push("<< /Length " + Buffer.byteLength(source, "latin1") +
        " >>\nstream\n" + source + "endstream");
      const pageId = objects.length + 1;
      objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PAGE_W + " " + PAGE_H +
        "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + streamId + " 0 R >>");
      children.push(pageId);
    }
    objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[1] = "<< /Type /Pages /Kids [" + children.map(n => n + " 0 R").join(" ") +
      "] /Count " + children.length + " >>";
    const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%SANDS\n", "latin1")];
    const offsets = [0];
    let length = chunks[0].length;
    objects.forEach((obj, index) => {
      offsets.push(length);
      const block = Buffer.from((index + 1) + " 0 obj\n" + obj + "\nendobj\n", "latin1");
      chunks.push(block);
      length += block.length;
    });
    const startXref = length;
    let xref = "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i++) xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    xref += "trailer\n<< /Size " + (objects.length + 1) +
      " /Root 1 0 R >>\nstartxref\n" + startXref + "\n%%EOF\n";
    chunks.push(Buffer.from(xref, "latin1"));
    return Buffer.concat(chunks);
  }
}

export function generateFarmProposal(
  input: FarmInputs, farm: FarmResult, investment: InvestmentAnalysis, applicant: ApplicantDetails
): Buffer {
  const writer = new PDFWriter();
  const title = applicant.projectName || "Fish farming enterprise";
  const contribution = Math.max(0, Math.min(farm.projectTotal, applicant.contribution));
  const requested = Math.max(0, farm.projectTotal - contribution);
  const payback = (n: number | null, months: number | null) =>
    n === null ? "Not achieved in model" :
    n + " season(s) / approximately " + months + " months";
  const days = input.cycleDays;
  const profile = SPECIES[input.species];
  const firstStage = input.mode === "new" ? "New installation" : "Existing tank upgrade";

  writer.heading("FISH FARM FUNDING PROPOSAL");
  writer.paragraph("Prepared " + new Date().toLocaleDateString("en-GB", {
    timeZone: "Africa/Kampala", day: "2-digit", month: "long", year: "numeric",
  }) + ". Preliminary model generated from applicant selections in the SANDS online simulator.");
  writer.item("Project name", title);
  writer.item("Applicant / group", applicant.name || "To be provided");
  writer.item("Project location", applicant.location || "To be assessed");
  writer.item("Contact", applicant.contact || "To be provided");
  writer.item("Intended financing partner", applicant.financier || "To be selected");
  writer.item("Project type", firstStage);

  writer.heading("1. EXECUTIVE SUMMARY");
  writer.paragraph("This proposal requests support for a fish farm growing " + profile.label + ", with " +
    quantity(farm.tanks) + " tank(s), each holding " + quantity(input.tankLitres) +
    " litres. Under the current screening assumptions, the project starts with approximately " +
    quantity(farm.fishStocked) + " fingerlings and aims for " + quantity(farm.harvestKg, 1) +
    " kg of fish at harvest over a " + days + "-day production cycle. SANDS may provide system design, supply, installation, inputs, farmer training and technical advice, subject to an approved quotation.");
  writer.item("Total initial project budget", ugx(farm.projectTotal));
  writer.item("Applicant contribution", ugx(contribution));
  writer.item("Funding requested", ugx(requested));
  writer.item("Expected repeat-season cash surplus", ugx(investment.cashSurplusPerCycle));
  writer.item("Estimated equipment-investment payback", payback(investment.paybackSeasons, investment.paybackMonths));

  writer.heading("2. PROJECT DESIGN & STOCKING");
  writer.item("Species", profile.label);
  writer.item("Number of tanks", quantity(farm.tanks));
  writer.item("Total working culture water", quantity(farm.volumeLitres) + " litres");
  if (input.mode === "new") {
    if (farm.upgradedTank) {
      writer.item("Proposed larger tank", "5,000 L WORKING water per tank");
      writer.item("Incremental fabrication materials", "One extra iron sheet + extra base pallets");
      writer.item("Extra fabrication cost (all tanks)", farm.upgradePricingPending ? "UNPRICED" : ugx(farm.upgradedTankExtraCost));
      writer.note("Working volume of larger tank is a design target; new tank diameter, safe pallet/base count and loading strength are not confirmed.");
    } else {
      writer.item("SANDS standard tank geometry", "2.0 m diameter x 1.2 m high");
      writer.item("Brimful volume per tank", quantity(SANDS_TANK.brimfulLitres) + " litres");
      writer.item("Assumed working fill height", "1.0 m - verify on site");
    }
  }
  writer.item("Fingerlings needed", quantity(farm.fishStocked));
  writer.item("Assumed survival", (input.survival * 100).toFixed(1) + "%");
  writer.item("Estimated fish harvested", quantity(farm.fishHarvested));
  writer.item("Average harvest weight", input.harvestKgEach.toFixed(2) + " kg/fish");
  writer.item("Planned harvest biomass", quantity(farm.harvestKg, 1) + " kg");
  writer.item("Cycle duration", days + " days");

  writer.heading("3. SETUP & FIRST-SEASON COSTS");
  if (farm.isSandsPackage) {
    writer.item("Inclusive SANDS tank package(s)", ugx(farm.packageCost) + (farm.upgradePricingPending ? " - MINIMUM" : ""));
    if (farm.upgradedTank) writer.item("Upgrade sheet/base/pallet price", farm.upgradePricingPending ? "UNPRICED - request supplier quote" : ugx(farm.upgradedTankExtraCost));
    writer.item("Fish supplied (no extra charge)", quantity(farm.includedFingerlings) + " fingerlings");
    writer.item("Starter feed bag(s) included", quantity(farm.includedStarterFeedKg, 1) + " kg - bag size unconfirmed");
    writer.item("Additional first-season feed", quantity(farm.additionalFeedKg, 1) + " kg / " + ugx(farm.feedCost));
    writer.item("Extra backup power allowance", ugx(farm.backupAllowance));
  } else {
    writer.item(input.mode === "new" ? "Provisional RAS installation" : "Provisional missing equipment", ugx(farm.infrastructure));
    writer.item("Initial fingerlings", ugx(farm.fingerlingsCost));
    writer.item("Full first-season feed", ugx(farm.feedCost));
  }
  writer.item("Electricity estimate", ugx(farm.energyCost));
  writer.item("SANDS-reported shared pump power", quantity(input.pumpWatts) + " W per pump");
  writer.item("SANDS-reported aerator rating", quantity(input.aerationWattsPerTank) + " W per aerator");
  writer.item("Support and training allowance", ugx(farm.supportCost));
  writer.item("Water testing and supplies", ugx(farm.waterTestingCost));
  writer.item("Other operating costs per season", ugx(farm.otherSeasonCost) + (input.otherSeasonCost === 0 ? " - UNPRICED" : ""));
  writer.item("Fresh water (first fill + exchange)", ugx(farm.waterSupplyCost) + (input.waterCostPer1000L === 0 ? " - unpriced" : ""));
  writer.item("Contingency (10%)", ugx(farm.contingency));
  writer.item("Total first-cycle financing need", ugx(farm.projectTotal));
  if (farm.isSandsPackage) {
    writer.note("SANDS standard CATFISH package: one tank UGX 5,000,000; for two or more tanks UGX 3,500,000 per tank. Inclusive package covers tanks, shared 50,000 L/h, 500 W pump for up to six tanks, UGX 600,000 filtration per tank, aeration, installation, initial fingerlings including survival allowance, and one starter feed bag PER TANK. Bag weight currently assumed " + input.starterBagKgPerTank + " kg (NOT YET CONFIRMED). The package price is not broken down and none of these included items is billed again. New feed supply is modeled at UGX 2,500/kg. Extra backup power UGX 1,200,000, water and support allowances, and feed FCR are subject to verification. Bank/project quotation is conditional on safe 500 kg/tank design.");
  } else {
    writer.note("Existing-tank/other-species equipment costs are provisional component estimates. The UGX 5m/3.5m packages have only been confirmed for standard new catfish systems. Feed and fingerling costs and engineering requirements must be verified for the selected species.");
  }

  writer.heading("4. FEED & FILTRATION ENGINEERING SCREEN");
  writer.item("Feed conversion ratio (FCR)", input.fcr.toFixed(2));
  writer.item("Total feed needed (incl. buffer)", quantity(farm.feedKg, 1) + " kg");
  if (farm.isSandsPackage) writer.item("Already included starter feed", quantity(farm.includedStarterFeedKg, 1) + " kg - assumed");
  writer.item("Peak daily feed (screening)", quantity(farm.peakFeedKgDay, 2) + " kg/day");
  writer.item("Indicative ammonia nitrogen load", quantity(farm.tanGramsDay, 1) + " g TAN/day");
  writer.item("Indicative oxygen demand", quantity(farm.oxygenKgDay, 2) + " kg O2/day");
  writer.item("Total flow allocated to tanks", quantity(farm.nominalPumpLph) + " litres/hour");
  writer.item("NEW water exchanged daily", input.waterExchangePct.toFixed(0) + "% of working volume");
  writer.item("Fresh makeup water per day", quantity(farm.dailyFreshWaterLitres) + " litres");
  writer.item("Wastewater discharge per day", quantity(farm.dailyDischargeLitres) + " litres");
  writer.item("Exchange water over full season", quantity(farm.cycleExchangeWaterLitres) + " litres");
  writer.item("Initial system fill (new installations)", quantity(farm.initialFillLitres) + " litres");
  writer.item("First-season new water total", quantity(farm.firstCycleFreshWaterLitres) + " litres");
  writer.item("Water cost used", ugx(input.waterCostPer1000L) + "/1,000 L" + (input.waterCostPer1000L === 0 ? " - UNPRICED" : ""));

  if (input.mode === "new") {
    writer.item("Shared pumps provisionally costed", quantity(farm.pumpUnits) + " unit(s)");
    writer.item("Reported nominal pump flow", quantity(farm.nominalInstalledFlowLph) + " litres/hour");
    writer.item("Water to each tank (planning)", quantity(farm.flowPerTankLph) + " litres/hour");
    writer.item("Nominal bypass/aerating return", quantity(farm.provisionalBypassFlowLph) + " litres/hour");
  }
  if (input.mode === "existing") {
    writer.item("Reported delivered flow", quantity(input.actualFlowLph) + " litres/hour");
    writer.item("Existing biofilter reported", input.biofilterPresent ? "Yes - requires assessment" : "No");
    writer.item("Existing aeration reported", input.aerationPresent ? "Yes - requires assessment" : "No");
  }
  writer.paragraph("The standard SANDS circular tank is 2 m diameter x 1.2 m high (~3,770 L brimful), with ~3,142 L at assumed 1.0 m working depth. The proposed 5,000 L WORKING tank requires one extra iron sheet and extra pallet-base materials, with dimensions and fabrication costs to be verified. A minimum 20% of working water is replaced with NEW water each day, with equivalent wastewater discharge; this is entirely separate from internal pump circulation. A 50,000 L/h, 500 W nominal pump is shared across up to six tanks, with the excess routed to the filter/aeration return; measured head, actual delivery and safe treatment capacity must be verified. A 20% water exchange does NOT establish safe stocking at this proposed biomass. Verify oxygen transfer, TAN conversion, solids, CO2, source quality and reliability, discharge compliance, pH, alkalinity and power backup.");

  writer.heading("5. ESTIMATED INCOME & INVESTMENT RECOVERY");
  writer.item("Proposed sales price", ugx(input.salePriceKg) + " per kg");
  writer.item("Projected fish sales", ugx(farm.projectedSales));
  writer.item("Total first-season cash outlay", ugx(investment.initialCapital) + (farm.upgradePricingPending ? " - MINIMUM ONLY" : ""));
  if (farm.upgradePricingPending) writer.paragraph("COST NOT INCLUDED: the extra iron sheet, additional pallet base and fabrication labour for each proposed 5,000 L tank are currently UNPRICED. The resulting first-season total and payback are only MINIMUM estimates; do not use for a lending commitment until a real fabrication quote is included.");
  writer.item("Fish sales at first harvest", ugx(farm.projectedSales));
  writer.item("First-season net after ALL setup costs", ugx(investment.firstCycleCashResult));
  writer.item("Repeat-season cost incl. reserve", ugx(investment.recurringCycleOutlay));
  writer.item("Repeat-season cash result", ugx(investment.cashSurplusPerCycle));
  writer.item("Cumulative cash break-even season", payback(investment.paybackSeasons, investment.paybackMonths));
  writer.heading("SEASON-BY-SEASON CAPITAL RECOVERY");
  investment.cashFlow.forEach(s => {
    writer.paragraph("Season " + s.season + (s.season === 1 ? " (includes original package)" : " (repeat inputs)") +
      ": sales " + ugx(s.sales) + "; total season costs " + ugx(s.totalOutlay) +
      "; season net " + ugx(s.seasonCashResult) + "; cumulative net " + ugx(s.cumulativeCash) +
      (s.recovered ? " (startup recovered)" : " (startup not yet recovered)") + ".");
  });
  writer.paragraph("First-season net is fish sales LESS the full tank/equipment package, any separate backup power, additional feed after the bundled starter bag, electricity, testing, support, priced water and contingency. Repeat seasons must buy replacement fingerlings and ALL feed. Payback is reached only when the cumulative cash balance becomes nonnegative. It excludes loan interest/repayments, taxes, major repairs, land, any labour, harvest, transport or other costs not entered, and any water cost not entered. The assumed 1.3 FCR and 500kg/tank output must be validated before lender use.");

  writer.heading("6. PRICE & PRODUCTION SENSITIVITY");
  investment.scenarios.forEach(s => {
    writer.paragraph(s.label + ": " + (s.survival * 100).toFixed(1) +
      "% survival, FCR " + s.fcr.toFixed(2) + ", sale price " + ugx(s.priceKg) +
      "/kg; harvest " + quantity(s.harvestKg, 1) + " kg; revenue " + ugx(s.sales) +
      "; first-season cash net " + ugx(s.firstCycleCashResult) + "; repeat-season cash surplus " + ugx(s.cashSurplus) +
      "; cumulative recovery " + payback(s.paybackSeasons, s.paybackMonths) + ".");
  });

  writer.heading("7. PROPOSED FUNDING ARRANGEMENT");
  writer.item("Project budget requested for consideration", ugx(farm.projectTotal));
  writer.item("Applicant contribution", ugx(contribution));
  writer.item("Requested external financing", ugx(requested));
  writer.paragraph("Subject to independent lender assessment, funds may be paid to the approved equipment and service provider in verified stages: equipment supply, installation and testing, stocking, then scheduled input and support delivery. The financial institution alone determines lending eligibility, disbursements, interest rate, security and repayment timing. Seasonal repayment terms must be negotiated in writing.");

  writer.heading("8. IMPLEMENTATION & MARKET PLAN");
  writer.paragraph("Stage A: site survey, confirm water and grid/backup power, obtain supplier quotation and complete permissions. Stage B: install and test tanks, solids filtration, biofiltration and aeration. Stage C: train the operator and stock healthy fingerlings. Stage D: deliver feed in stages, log water parameters, growth and mortality, and provide support. Stage E: grade, harvest and market fish through agreed buyers, SANDS Market or an independently negotiated off-take agreement.");
  writer.paragraph("SANDS may facilitate buyer introductions or make conditional purchase offers. No guaranteed fish purchase, sales price, production yield or credit approval is implied by this document.");

  writer.heading("9. CONDITIONS, GAPS & VERIFICATION");
  if (farm.warnings.length) farm.warnings.forEach(w => writer.paragraph("- " + w));
  if (!farm.feasible) writer.paragraph("BUDGET / TECHNICAL ALERT: The selected configuration does not fit the available budget or fails an initial circulation screen. A revised system or financing plan is required.");
  if (applicant.notes) writer.paragraph("Applicant's notes: " + applicant.notes);
  writer.paragraph("Required before funding: signed itemised quotation; site, water and electricity assessment; engineering and biosecurity review; verified feed and fingerling supply; project cash-flow schedule; market demand/off-take validation; eligibility and permits; independent credit approval.");

  writer.heading("SANDS CONTACT");
  writer.paragraph("SANDS Fish Farm (U) Limited | Plot 3A Drake Lane, Kanyanya, Kampala, Uganda | sands.co.ug | james@sands.co.ug | WhatsApp +256 756 188061");
  writer.note("This is a customer-generated planning document, not a signed offer by SANDS, a certified engineering design, or a lender credit decision.");
  return writer.build();
}
