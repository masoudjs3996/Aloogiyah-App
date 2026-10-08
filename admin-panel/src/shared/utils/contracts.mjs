// Keep wire property names camelCase, preserving dictionary keys and nested values.
export function normalize(value) {
 if(Array.isArray(value)) return value.map(normalize);
 if(value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k.charAt(0).toLowerCase()+k.slice(1),normalize(v)]));
 return value;
}
export function unwrap(raw) {
 const value=normalize(raw);
 if(value?.isSuccess===false) throw new Error(value.message || 'عملیات ناموفق بود');
 if(value && Object.prototype.hasOwnProperty.call(value,'data')) return value.data;
 return value;
}
export function collection(data, pageSize=20) {
 if(Array.isArray(data)) return {items:data,total:null,hasNext:data.length===pageSize};
 const items=(data?.items ?? data?.files ?? []).map(row=>({...row,code:row.code??row.fileCode}));
 return {items,total:data?.totalCount ?? null,hasNext:data?.totalPages!=null ? data.pageNumber<data.totalPages : data?.totalCount!=null ? (data.pageNumber ?? 1)*pageSize<data.totalCount : items.length===pageSize};
}
export function resolvePath(path, values) {
 return path.replace(/\{(\w+)\}/g, (_,key)=>{
  if(values[key]===undefined || values[key]==='') throw new Error('کد رکورد الزامی است');
  return encodeURIComponent(String(values[key]));
 });
}
export function csv(rows, columns) {
 const cell=v=>'"'+String(v??'').replaceAll('"','""').replace(/^[=+@-]/,"'$&")+'"';
 return '\ufeff'+[columns.map(cell).join(','),...rows.map(row=>columns.map(key=>cell(typeof row[key]==='object'?JSON.stringify(row[key]):row[key])).join(','))].join('\r\n');
}
export function serializeFields(fields,values,schemas={}) {
 const result={};
 for(const f of fields) {
  let v=values[f.name];
  if(v===undefined||v===null||v==='') {if(f.required && f.type==='boolean')result[f.name]=false;continue;}
  if(f.type==='number') {v=Number(v);if(!Number.isFinite(v))throw new Error('عدد نامعتبر');}
  if(f.type==='boolean') v=v===true||v==='true';
  if(f.type==='json' && typeof v==='string') v=JSON.parse(v);
  if(f.csType==='List<string>'&&Array.isArray(v))v=v.map(item=>String(item).trim()).filter(Boolean);
  if(f.type==='json'){const name=f.csType?.match(/(?:List<)?(\w+Dto)/)?.[1];if(name&&schemas[name])v=Array.isArray(v)?v.map(item=>serializeFields(schemas[name],item,schemas)):serializeFields(schemas[name],v,schemas);}
  if(f.type==='date') {const d=new Date(v);if(Number.isNaN(d.getTime()))throw new Error('تاریخ نامعتبر');v=d.toISOString();}
  result[f.name]=v;
 }
 return result;
}
export function appendForm(form,key,value){
 if(value==null||value==='')return;
 if(typeof FileList!=='undefined'&&value instanceof FileList){Array.from(value).forEach(file=>form.append(key,file));return;}
 if(value instanceof Blob){form.append(key,value);return;}
 if(Array.isArray(value)){value.forEach((item,index)=>appendForm(form,`${key}[${index}]`,item));return;}
 if(typeof value==='object'){Object.entries(value).forEach(([name,item])=>appendForm(form,`${key}.${name}`,item));return;}
 form.append(key,String(value));
}
