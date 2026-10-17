# SANDS Farm Finance simulator: calibration and outstanding inputs

**Owner-provided figures (17 October 2026)**. These replace earlier demonstration numbers and remain subject to final supplier quotation and engineering approval.

## Standard catfish unit

| Parameter | Value | Source/notes |
| --- | ---: | --- |
| Circular tank dimensions | 2.0 m diameter x 1.2 m wall height | SANDS |
| Brimful capacity | 3,770 L | Derived from cylinder |
| Provisional working water depth | 1.0 m | **To confirm**; implies 3,142 L working volume |
| Tank price | UGX 1,100,000 | SANDS |
| One shared pump price | UGX 1,500,000 | SANDS |
| Pump nominal/delivered flow reported | 30,000 L/hour | SANDS; confirm at filter/manifold head |
| Pumps needed | One per **up to six** standard tanks | SANDS layout; confirm duty |
| Mechanical/biological filtration allowance | UGX 600,000 | SANDS; assumed per tank until confirmed; **not proof of 500 kg/tank capability** |
| Aeration equipment allowance | UGX 350,000 | SANDS; assumed per tank until confirmed |
| Piping and installation | UGX 350,000 | SANDS; assumed per tank until confirmed |
| Expected harvest | 500 catfish **per tank** | SANDS production goal, not a stocking clearance |
| Average harvest fish size | 1.0 kg | SANDS updated goal |
| Feed | UGX 3,000/kg | SANDS |
| Fish sales | UGX 15,000/kg | SANDS assumed realized sales price |
| Fingerlings | UGX 500/fish | **Unconfirmed**, carried from previous model |
| FCR | 1.3 | **Unconfirmed**, retained |
| Survival | 85% | **Unconfirmed**, retained |
| Fingerling initial weight | 25 g | **Unconfirmed**, retained |
| Production cycle | 180 days | **Unconfirmed**, retained |
| Feed budget cushion | 8% | **Unconfirmed**, retained |
| Energy tariff | UGX 850/kWh | **Unconfirmed**, retained |
| Pump electric draw | 1,500 W per shared pump | **Unconfirmed**, not deducible from 30,000 L/h |
| Aeration electric draw | 100 W/tank | **Unconfirmed**, retained |
| Backup power | UGX 1,200,000/install | **Unconfirmed** allowance |
| Training/support | UGX 400,000 + 180,000 per tank/cycle | **Unconfirmed** allowance |
| Water tests and supplies | UGX 250,000 + 120,000 per tank/cycle | **Unconfirmed** allowance |
| Contingency | 10% | Planning allowance |

## Water circulation

SANDS uses a shared pump with flow controlled through a manifold. Tank inlets receive the specified share; nominal leftover water is returned through an aerating/final filtration stage. This return is **not** proof of oxygenation or filtration and cannot short-circuit solids removal/biofilter treatment.

Preliminary per-tank flow = 3,142 L x 1.25 turnovers/hour = about **3,928 L/h**; six tanks together = **23,565 L/h**, leaving **6,435 L/h** of nominal 30,000 L/h capacity for the return route. These figures presume the full 30,000 L/h is delivered at actual installed head; verify pump curve, pipe resistance, filter head and actual water delivery.

One pump is priced per six standard tanks, and a second pump is added at the seventh tank. Bigger/nonstandard tank volumes may need an extra pump sooner if the required flow exceeds 30,000 L/h.

## Mortality and output

Per standard tank at 85% assumed survival:
- Target **500 harvested** x **1.0 kg** = **500 kg** sales biomass.
- Stock **ceil(500 / 0.85) = 589** fingerlings **per tank**.
- Working-volume harvest density = **~159 kg/m3** at 3,142 L, an extremely intensive target requiring verified gas transfer, TAN removal, solids handling, backup and feed loading. A pump flow rating alone cannot validate safe stocking.
- Feed estimate = (500 - 589 x 0.025) x 1.3 x 1.08 = **~681 kg** per tank.
- Sales potential = **UGX 7,500,000/tank** at UGX 15,000/kg, *not guaranteed*.

## Still needed to validate lender PDF

1. Normal operating water depth rather than assumed 1.0 m; actual flow to EACH tank after distribution and filter head.
2. Actual pump electrical input (W/kW), aerator input (W), operating pattern, electricity tariff, backup power type and price.
3. Whether UGX 600k filtration / UGX 350k aeration / UGX 350k piping are **per tank** or **shared system** prices and what they physically include.
4. Actual TAN nitrification and suspended-solids loading capacity of the filter at peak feed. Oxygen transfer at demand, CO2 stripping, alkalinity/pH control and the flow layout for bypass return.
5. Actual fingerling price and starting weight, observed survival, FCR at 1 kg, duration to reach 1 kg, and whether 500 kg in this standard tank has already been demonstrated.
6. Transport, labor, feed distribution, water replacement, repairs, permits, harvest handling, mortalities and buyer deductions, plus realized farm-gate selling price.

No bank, investor, or customer should interpret the model as a certified RAS design or guaranteed returns.
