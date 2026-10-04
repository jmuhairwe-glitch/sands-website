export const nutrientFields = ['protein','fat','fibre','ash','moisture','calcium','phosphorus','lysine','methionine'] as const;
export type Nutrient = typeof nutrientFields[number];
export type CatalogItem = { name:string; category:string; price:string; source:string; note:string } & Partial<Record<Nutrient,string>>;
export type Ingredient = { id:string; name:string; price:string; protein:string; share:string; max?:string; source?:string; note?:string } & Partial<Record<Nutrient,string>>;
const source = 'https://www.fao.org/4/u4173e/u4173e00.htm';
const reference = 'Historical FAO reference, as-fed basis; not a Ugandan batch analysis. Replace with supplier or laboratory values.';
function ref(name:string,category:string,values:string[]):CatalogItem { const [moisture,protein,fat,fibre,ash,calcium,phosphorus]=values; return {name,category,price:'',source,note:reference,moisture,protein,fat,fibre,ash,calcium,phosphorus}; }
function unknown(name:string,category:string,note='Enter supplier or laboratory analysis on an as-fed basis.'):CatalogItem{return {name,category,price:'',source:'',note};}
export const catalog:CatalogItem[] = [
 ref('Maize grain, ground','Energy',['12','7.8','3.8','1.9','1.2','0.04','0.24']),
 unknown('Maize bran','Energy'), unknown('Maize flour','Energy'),
 ref('Wheat bran','Energy',['11.6','12.8','3.1','8.6','4.5','0.10','0.89']),
 unknown('Wheat pollard','Energy','Pollard composition varies by mill. Do not assume it is identical to wheat bran.'),
 unknown('Rice bran','Energy'),unknown('Cassava flour, processed','Energy'),unknown('Sorghum, ground','Energy'),
 ref('Soybean meal','Plant protein',['9.3','40.8','5.7','5.3','6.3','0.22','0.56']),
 unknown('Soybean cake','Plant protein'),
 ref('Sunflower seed meal','Plant protein',['7.3','31.6','8.9','24','6.4','0.26','1.16']),
 unknown('Sunflower cake','Plant protein'),unknown('Cottonseed cake','Plant protein','Obtain composition and gossypol information; suitability depends on species and processing.'),unknown('Groundnut cake','Plant protein'),
 unknown('Fishmeal, supplier-labelled 65% CP','Animal protein','65% is the product grade, not an independent analysis. Confirm supplier analysis.'),
 unknown('Mukene meal (silverfish)','Animal protein'),unknown('Caridina shrimp meal','Animal protein'),
 unknown('Poultry by-product meal, rendered','Animal protein','Use analysis for the rendered meal. Fresh chicken offals have a different moisture content and are not interchangeable.'),
 unknown('Blood meal','Animal protein'),unknown('Black soldier fly meal','Animal protein'),
 unknown('Vegetable oil, feed grade','Oil'),unknown('Fish oil','Oil'),
 unknown('Fish vitamin-mineral premix','Additives','Use the manufacturer’s species-specific inclusion rate; do not infer a rate from the ingredient name.'),
 unknown('Poultry vitamin-mineral premix','Additives','Use the manufacturer’s species-specific inclusion rate.'),
 unknown('Dicalcium phosphate (DCP)','Additives'),unknown('Limestone, feed grade','Additives'),unknown('Salt, feed grade','Additives'),unknown('Lysine supplement','Additives'),unknown('Methionine supplement','Additives'),
 unknown('Poultry concentrate','Concentrates','Use the exact product label and mixing instructions.'),unknown('Azolla meal, dried','Other'),unknown('Pistia meal, dried','Other')
];
catalog.find(i=>i.name.startsWith('Fishmeal,'))!.protein='65';
export const examples = [
 {name:'Fishmeal–soy base mix',species:'Catfish',note:'Editable costing example, not a complete grower feed. It omits premix and other nutrient corrections; review before feeding.',parts:[[14,30],[8,35],[0,20],[3,15]] as [number,number][]},
 {name:'Plant-heavy fish base mix',species:'Tilapia',note:'Editable comparison example, not a feeding recommendation. Check amino acids, energy, minerals and premix requirements before use.',parts:[[14,15],[8,30],[0,30],[3,25]] as [number,number][]},
 {name:'Three-ingredient screenshot example',species:'Catfish',note:'Recreates the 29 kg fishmeal + 20 kg poultry by-product meal + 25 kg maize flour screenshot for comparison only. Not a validated ration.',parts:[[14,29/74*100],[17,20/74*100],[2,25/74*100]] as [number,number][]}
];
export function numeric(s:unknown):s is string{return typeof s==='string' && s.trim()!=='' && Number.isFinite(Number(s)) && Number(s)>=0;}
export function weighted(rows:Ingredient[],field:Nutrient|'price'):number|null{
 const active=rows.filter(r=>numeric(r.share)&&+r.share>0);
 const total=active.reduce((s,r)=>s + +r.share,0);
 if(!total || active.some(r=>!numeric(r[field]))) return null;
 const result=active.reduce((s,r)=>s + +r[field]! * +r.share/total,0);
 return Number.isFinite(result)?result:null;
}
// RFC-style quoted CSV, including escaped quotes, commas and newlines in cells.
export function parseCsv(text:string):CatalogItem[]{
 const records:string[][]=[];let row:string[]=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))records.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('Unclosed quote in CSV.');row.push(cell);if(row.some(v=>v.trim()))records.push(row);
 const headers=records.shift()?.map(h=>h.trim().toLowerCase());
 if(!headers?.includes('name'))throw new Error('CSV needs a name column. Download the template for the supported columns.');
 if(new Set(headers).size!==headers.length)throw new Error('Duplicate CSV column names.');
 if(!records.length||records.length>500)throw new Error('Upload between 1 and 500 ingredients.');
 return records.map((cells,index)=>{if(cells.length!==headers.length)throw new Error(`Row ${index+2}: column count does not match the header.`);const r=Object.fromEntries(headers.map((h,j)=>[h,cells[j].trim()]));if(!r.name||r.name.length>150)throw new Error(`Row ${index+2}: ingredient name is missing or too long.`);
 for(const f of ['price',...nutrientFields])if(r[f] && (!numeric(r[f])||(f!=='price'&&+r[f]>100)))throw new Error(`Row ${index+2}: ${f} must be ${f==='price'?'a non-negative UGX value':'between 0 and 100'}.`);
 return {name:r.name,category:r.category||'Imported',price:r.price||'',source:'User CSV',note:'Imported by you; confirm as-fed basis and supplier analysis.',...Object.fromEntries(nutrientFields.map(f=>[f,r[f]||'']))};});
}
