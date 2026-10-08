import schemas from '../../shared/types/schemas.json';import type {Field,Resource} from '../../shared/types';import FormField from './FormField';import Button from '../atoms/Button';
const models=schemas as Record<string,Field[]>;
export function structuredModel(f:Field){const match=f.csType?.match(/(?:List<)?(\w+Dto)/);return match&&models[match[1]]?models[match[1]]:null;}
export default function StructuredField({field,value,onChange,resource}:{field:Field;value:any;onChange:(v:any)=>void;resource?:Resource}){
 const children=structuredModel(field)!;const array=field.csType?.startsWith('List<');let current=value;
 if(typeof value==='string'&&value){try{current=JSON.parse(value);}catch{current=null;}}
 const items=array?(Array.isArray(current)?current:[]):current?[current]:[];
 return <div className="structured"><div className="toolbar"><Button type="button" variant="secondary" onClick={()=>onChange(array?[...items,{}]:current?undefined:{})}>{array?'افزودن ردیف':current?'حذف این بخش':'افزودن اطلاعات'}</Button></div>{items.map((item,index)=><div className="nested" key={index}><div className="form-grid">{children.map(child=><FormField key={child.name} field={{...child,name:child.name}} value={item[child.name]} onChange={v=>{const updated={...item,[child.name]:v};onChange(array?items.map((r,i)=>i===index?updated:r):updated);}} resource={resource}/>)}</div>{array&&<Button variant="ghost" type="button" onClick={()=>onChange(items.filter((_,i)=>i!==index))}>حذف ردیف</Button>}</div>)}</div>;
}
