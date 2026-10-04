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

// Protein references are all expressed as-fed. DM-based means are converted
// using their published mean dry matter, rather than mixed into as-fed values.
const eastAfrica = 'https://www.fao.org/4/ac581e/AC581E07.htm';
const shrimpStudy = 'https://ir-library.ku.ac.ke/server/api/core/bitstreams/83ea0a8a-2c68-4ed0-8d4c-a49e22fd8919/content';
function estimate(index:number,protein:string,url:string,note:string){Object.assign(catalog[index],{protein,source:url,note:`Reference estimate (as-fed): ${note} Editable for your own analysis.`});}
estimate(1,'7.5',eastAfrica,'Kenyan maize-bran reference; milling and grain fractions vary.');
estimate(2,'7.8',source,'Ground maize grain used as a proxy for whole-maize flour; refined flour differs.');
estimate(4,'15',eastAfrica,'Wheat middlings used as a proxy for pollard; mill fractions vary.');
estimate(5,'12',eastAfrica,'Mechanically extracted rice-bran reference.');
estimate(6,'2.5','https://www.feedipedia.org/node/12798','Dried cassava: 2.9% DM protein × 87.6% dry matter, rounded. Processed root flour only.');
estimate(7,'9.4','https://www.feedipedia.org/node/11655','Sorghum: 10.8% DM protein × 87.4% dry matter, rounded.');
estimate(9,'45',eastAfrica,'Soybean oilcake reference; heat treatment and oil extraction affect composition.');
estimate(11,'25.6','https://www.feedipedia.org/node/732','Mechanically extracted sunflower meal: 27.9% DM protein × 91.8% dry matter, rounded.');
estimate(12,'38',eastAfrica,'Cottonseed oilcake reference. Gossypol level must be checked separately.');
estimate(13,'44.6','https://www.feedtables.com/content/groundnut-meal-oil-5-20','Groundnut cake with 5–20% oil; reference average. Check aflatoxin separately.');
estimate(15,'58',eastAfrica,'Dried, ground Lake Victoria mukene/omena (Rastrineobola argentea). Historical East African reference, not a local batch assay.');
estimate(16,'56.1',shrimpStudy,'Caridina nilotica dried meal: 561 g/kg as-fed in the study; batch values vary.');
Object.assign(catalog[16],{fat:'10.5',ash:'9.8',fibre:'7.5',moisture:'8.6'});
estimate(17,'55.6','https://www.feedipedia.org/node/12474','Rendered poultry offal meal: 60.2% DM protein × 92.3% dry matter, rounded. Never use this estimate for fresh offals.');
estimate(18,'73.5',source,'Dried blood meal reference. Processing affects protein availability.');
estimate(19,'37.7','https://www.feedipedia.org/node/27813','Full-fat dried BSF meal (>20% fat): 41.1% DM protein × 91.7% dry matter. Defatted meal differs.');
for(const i of [20,21,24,25,26])estimate(i,'0',source,'Pure oil or mineral ingredient assumed to contribute no protein. Compound products may differ.');
estimate(30,'19.8','https://www.feedipedia.org/node/12803','Dried Azolla: 21.5% DM protein × 91.9% dry matter, rounded. Not fresh Azolla.');

export type Guidance = { ceiling:number; source:string; label:string; detail:string; group?:string };
const catfishGuide='https://www.fao.org/fileadmin/user_upload/affris/docs/North_African_Catfish/English/table_6.htm';
const catfishExamples='https://www.fao.org/fileadmin/user_upload/affris/docs/North_African_Catfish/English/table_7.htm';
export function guidance(name:string,species:string,stage:string):Guidance|null {
 const index=catalog.findIndex(i=>i.name.toLowerCase()===name.trim().toLowerCase());
 if(index<0)return null;
 const growout=stage==='Grower'||stage==='Finisher';
 if(species==='Catfish'&&[14,15].includes(index)&&['Starter','Grower','Finisher'].includes(stage)){
   const ceiling=stage==='Starter'?55:25;
   return {ceiling,source:catfishExamples,label:'Published-example review threshold',group:'fishmeal',detail:`${ceiling}% is the highest fishmeal level in the selected FAO ${stage==='Starter'?'starter':'explicitly labelled grower'} examples. This is not a universal maximum or a toxicity limit. Mukene is treated as fishmeal; combined fishmeal inclusion is checked.`};
 }
 if(!growout)return null;
 if(species==='Catfish'){
  const limits:Record<number,number>={6:10,9:65,11:30,12:30,13:25,21:5};
  if(limits[index]!==undefined)return {ceiling:limits[index],source:catfishGuide,label:'Catfish reference review level',detail:index===6?'FAO lists an optimal cassava inclusion below 10%; 10% or above needs review. Use properly processed cassava.':'Based on the upper end of FAO general catfish guidance, applied here to grow-out only. Processing and the whole diet affect suitability; this is not a batch-specific safety guarantee.'};
 }
 if(species==='Tilapia'){
  const limits:Record<number,number>={0:35,2:35,4:40,7:35,8:35,17:20,18:10,24:3};
  if(limits[index]!==undefined)return {ceiling:limits[index],source:eastAfrica,label:'Omnivorous-fish reference ceiling',group:[0,2].includes(index)?'maize-grain':undefined,detail:'Historical FAO omnivorous-fish guideline, applied to tilapia grow-out. Match processing: soybean meal is solvent-extracted; blood meal is spray-dried; sorghum is low-tannin. Pollard uses wheat middlings as a proxy.'};
 }
 return null;
}
export function referenceWarnings(rows:Ingredient[],species:string,stage:string):{name:string;share:number;guide:Guidance}[]{
 const grouped=new Map<string,{name:string;share:number;guide:Guidance}>();
 for(const row of rows){if(!numeric(row.share)||+row.share<=0)continue;const guide=guidance(row.name,species,stage);if(!guide)continue;const key=guide.group||row.name.trim().toLowerCase();const old=grouped.get(key);grouped.set(key,{name:guide.group==='fishmeal'?'Combined fishmeal / mukene':guide.group==='maize-grain'?'Combined maize grain / flour':row.name,share:(old?.share||0)+ +row.share,guide});}
 return [...grouped.values()].filter(r=>r.share>=r.guide.ceiling);
}
