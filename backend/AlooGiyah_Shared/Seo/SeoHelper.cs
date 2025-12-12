
namespace AlooGiyah_Shared.Seo
{
    public static class SeoHelper
    {
        public static string GenerateSlug(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            return text.Toslug().Trim('-');
        }

        public static string GenerateMetaTitle(string name)
        {
            return name; // می‌توانی برند یا توضیح کوتاه اضافه کنی
        }

        public static string GenerateMetaDescription(string name)
        {
            return $"دسته بندی {name} – محصولات مرتبط و تازه در فروشگاه کشاورزی";
        }

        public static string GenerateMetaKeywords(string name)
        {
            return $"{name}, محصولات کشاورزی, دسته بندی";
        }
    }

}
