import { NextRequest, NextResponse } from 'next/server';
import { SANDS_SUPABASE_URL, SANDS_SUPABASE_PUBLISHABLE_KEY } from '../../../lib/feeding-public-config';
export async function POST(request: NextRequest) {
 const origin=request.headers.get('origin');
 if (origin && origin!==request.nextUrl.origin) return NextResponse.json({error:'Please submit from the SANDS website.'},{status:403});
 if(Number(request.headers.get('content-length')||0)>20000)return NextResponse.json({error:'Please shorten your enquiry.'},{status:413});
 try {
 const raw=await request.text(); if(raw.length>20000)return NextResponse.json({error:'Please shorten your enquiry.'},{status:413});
 const b=JSON.parse(raw);
 const clean=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
 if(b.website || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.id||'') || !['Training','Fingerlings','Fish feeds','Tanks & recycling','Something else'].includes(b.topic) || !clean(b.customer_name,160)||!clean(b.location,300)||!/^\+?[0-9 ()-]{7,25}$/.test(b.phone||'')||!clean(b.message,10000)||!b.details||typeof b.details!=='object'||Array.isArray(b.details)||JSON.stringify(b.details).length>12000) return NextResponse.json({error:'Please check your name, phone number and enquiry details.'},{status:400});
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Kampala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(b.preferred_date && (!/^\d{4}-\d{2}-\d{2}$/.test(b.preferred_date)||b.preferred_date<today))return NextResponse.json({error:'Please choose today or a future date.'},{status:400});
 const response=await fetch(`${SANDS_SUPABASE_URL}/rest/v1/customer_enquiries`,{method:'POST',headers:{apikey:SANDS_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({id:b.id,topic:b.topic,customer_name:b.customer_name.trim(),phone:b.phone.trim(),location:b.location.trim(),preferred_date:b.preferred_date||null,details:b.details,message:b.message}),signal:AbortSignal.timeout(10000)});
 if(!response.ok){const err=await response.json().catch(()=>({}));if(err.code!=='23505')return NextResponse.json({error:'We could not save your enquiry. Please retry, or send it directly on WhatsApp.'},{status:503});}
 return NextResponse.json({saved:true,reference:b.id},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'We could not save your enquiry. Please retry, or use WhatsApp.'},{status:503});}
}
