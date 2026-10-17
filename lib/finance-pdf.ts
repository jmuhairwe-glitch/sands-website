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
  writer.item("Expected cash surplus / season", ugx(investment.cashSurplusPerCycle));
  writer.item("Estimated equipment-investment payback", payback(investment.paybackSeasons, investment.paybackMonths));

  writer.heading("2. PROJECT DESIGN & STOCKING");
  writer.item("Species", profile.label);
  writer.item("Number of tanks", quantity(farm.tanks));
  writer.item("Total working culture water", quantity(farm.volumeLitres) + " litres");
  if (input.mode === "new") {
    writer.item("SANDS standard tank geometry", "2.0 m diameter x 1.2 m high");
    writer.item("Brimful volume per tank", quantity(SANDS_TANK.brimfulLitres) + " litres");
    writer.item("Assumed working fill height", "1.0 m - verify on site");
  }
  writer.item("Fingerlings needed", quantity(farm.fishStocked));
  writer.item("Assumed survival", (input.survival * 100).toFixed(1) + "%");
  writer.item("Estimated fish harvested", quantity(farm.fishHarvested));
  writer.item("Average harvest weight", input.harvestKgEach.toFixed(2) + " kg/fish");
  writer.item("Planned harvest biomass", quantity(farm.harvestKg, 1) + " kg");
  writer.item("Cycle duration", days + " days");

  writer.heading("3. SETUP & FIRST-SEASON COSTS");
  writer.item(input.mode === "new" ? "RAS equipment and installation" : "Provisional missing equipment", ugx(farm.infrastructure));
  writer.item("Fingerlings", ugx(farm.fingerlingsCost));
  writer.item("Full production cycle feed", ugx(farm.feedCost));
  writer.item("Electricity estimate", ugx(farm.energyCost));
  writer.item("Provisional pump electrical input", quantity(input.pumpWatts) + " W per pump");
  writer.item("Provisional aeration electrical input", quantity(input.aerationWattsPerTank) + " W per tank");
  writer.item("Support and training allowance", ugx(farm.supportCost));
  writer.item("Testing and water-supply allowance", ugx(farm.waterTestingCost));
  writer.item("Contingency (10%)", ugx(farm.contingency));
  writer.item("Total first-cycle financing need", ugx(farm.projectTotal));
  writer.note("SANDS-reported standard equipment prices (UGX): tank 1,100,000; 30,000 L/hour pump 1,500,000; filter 600,000; aeration 350,000; piping/installation 350,000. Pump capacity is shared provisionally across tanks and requires on-site verification. Backup power UGX 1,200,000 and energy/support/testing allowances remain unconfirmed. Feed price: " + ugx(profile.feedPriceKg) + "/kg. Fingerlings UGX 500 each are still provisional. These are not contractual quotations.");

  writer.heading("4. FEED & FILTRATION ENGINEERING SCREEN");
  writer.item("Feed conversion ratio (FCR)", input.fcr.toFixed(2));
  writer.item("Total feed, with 8% allowance", quantity(farm.feedKg, 1) + " kg");
  writer.item("Peak daily feed (screening)", quantity(farm.peakFeedKgDay, 2) + " kg/day");
  writer.item("Indicative ammonia nitrogen load", quantity(farm.tanGramsDay, 1) + " g TAN/day");
  writer.item("Indicative oxygen demand", quantity(farm.oxygenKgDay, 2) + " kg O2/day");
  writer.item("Total flow allocated to tanks", quantity(farm.nominalPumpLph) + " litres/hour");
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
  writer.paragraph("The SANDS circular tank is 2 m diameter x 1.2 m high (~3,770 L brimful); planning uses ~3,142 L per tank at 1.0 m assumed water depth. One reported 30,000 L/h pump is provisionally shared across up to six standard tanks. A manifold directs the required flow to tanks and surplus nominal flow through a return to the final filter/aeration stage. These are NOT measured flows or certified oxygenation. Bypass must not short-circuit biological/solids treatment. Tank turnover and fish-density calculations are screening checks only. Before stocking, verify delivered flow at head, actual fill depth, dissolved-oxygen transfer, biofilter TAN conversion, CO2 removal, backup power, water availability and site conditions.");

  writer.heading("5. ESTIMATED INCOME & INVESTMENT RECOVERY");
  writer.item("Proposed sales price", ugx(input.salePriceKg) + " per kg");
  writer.item("Projected fish sales", ugx(farm.projectedSales));
  writer.item("Recurring cost including 10% reserve", ugx(investment.recurringCycleOutlay));
  writer.item("Expected season cash surplus", ugx(investment.cashSurplusPerCycle));
  writer.item("Initial capital including 10% reserve", ugx(investment.initialCapital));
  writer.item("Initial cycle net cash after total setup", ugx(farm.firstCycleCashResult));
  writer.item("Estimated payback period", payback(investment.paybackSeasons, investment.paybackMonths));
  writer.paragraph("Payback here means recovery of modeled initial equipment/setup spending from recurring season cash surpluses. It is based on rounded complete seasons, with no recovery shown if a scenario has zero or negative season cash surplus. It is not a guaranteed return and does not include loan interest, repayments, tax, major capital replacement, depreciation, land rent or unmodeled labour.");

  writer.heading("6. PRICE & PRODUCTION SENSITIVITY");
  investment.scenarios.forEach(s => {
    writer.paragraph(s.label + ": " + (s.survival * 100).toFixed(1) +
      "% survival, FCR " + s.fcr.toFixed(2) + ", sale price " + ugx(s.priceKg) +
      "/kg; harvest " + quantity(s.harvestKg, 1) + " kg; revenue " + ugx(s.sales) +
      "; season cash surplus " + ugx(s.cashSurplus) +
      "; equipment payback " + payback(s.paybackSeasons, s.paybackMonths) + ".");
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
