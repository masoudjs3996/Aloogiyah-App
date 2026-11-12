export const amountDigits = (value: string) => value.replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[^0-9]/g, "");
export const formatAmount = (value: string) => amountDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
