export const saleUnits = [{value:'Kilogram',label:'کیلوگرم'},{value:'Package',label:'بسته'},{value:'Piece',label:'عدد'}];
export const saleUnitLabel=(unit?:string|null)=>saleUnits.find(u=>u.value===unit)?.label ?? 'واحد مشخص‌نشده';
export const saleUnitGuide='کیلوگرم: میوه، غلات و محصولات وزنی؛ بسته: گل شاخه‌بریده یا کالای چندتایی؛ عدد: گلدان و نهال. قیمت، موجودی و تولید روزانه همگی بر اساس همین واحد هستند. مقدار خرید فعلاً عدد صحیح است. برای بسته، محتویات هر بسته را در توضیحات محصول بنویسید.';
export const saleDigits=(value:string)=>value.replace(/[۰-۹٠-٩]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.includes(d)?'۰۱۲۳۴۵۶۷۸۹'.indexOf(d):'٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[,٬\s]/g,'');
