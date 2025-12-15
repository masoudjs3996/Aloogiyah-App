using AlooGiyah_Domain.Entities;

namespace AlooGiyah_Application.Utils
{
    public static class CategoryExtensions
    {

        /// برمی‌گرداند بالاترین دسته پدر (Root Parent)
        /// اگر خودش پدر باشه، خودش رو برمی‌گردونه
        public static Category GetRootParent(this Category category)
        {
            if (category == null) throw new ArgumentNullException(nameof(category));

            Category current = category;
            while (current.ParentCategory != null)
            {
                current = current.ParentCategory;
            }
            return current;
        }


        /// برمی‌گرداند لیست همه پدرها تا ریشه (از نزدیک به دور)
        public static List<Category> GetAllParents(this Category category)
        {
            if (category == null) throw new ArgumentNullException(nameof(category));

            var parents = new List<Category>();
            var current = category.ParentCategory;
            while (current != null)
            {
                parents.Add(current);
                current = current.ParentCategory;
            }
            return parents;
        }

        /// برمی‌گرداند نام کامل مسیر دسته‌بندی (مثل میوه > سیب > سیب قرمز)
        public static string GetFullPathName(this Category category, string separator = " > ")
        {
            if (category == null) return string.Empty;

            var path = new List<string> { category.Name };
            var current = category.ParentCategory;
            while (current != null)
            {
                path.Insert(0, current.Name);
                current = current.ParentCategory;
            }
            return string.Join(separator, path);
        }
    }
}
