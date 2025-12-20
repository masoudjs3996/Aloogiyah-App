import { getFeaturedCategories } from "@/lib/actions/categories";
import { CategoryCard } from "@/design-system/molecules/public";
import { BannerSlider } from "@/design-system/organisms/Home";

export default async function Home() {
  const res = await getFeaturedCategories();
  const categories = res?.data;
  console.log(res)
  if (!categories || categories.length === 0) {
    return <p>دسته‌بندی یافت نشد</p>;
  }

  return (
    <>
      <BannerSlider />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <CategoryCard
            key={i}
            name={categories[i % categories.length]?.name}
            imageUrl={categories[i % categories.length]?.imageUrl}
          />
        ))}
      </div>
    </>
  );
}

// "use client";
// import { useEffect, useState } from "react";
// import { getFeaturedCategories } from "@/lib/actions/categories";
// import { CategoryCard } from "@/design-system/molecules/public";
// import axiosInstance from "@/shared/lib/config/axions";
// import { BannerSlider } from "@/design-system/organisms/Home";

// export default function Home() {
//   const [categories, setCategories] = useState<any[]>([]);

//   useEffect(() => {
//     const get = async () => {
//       const res = await getFeaturedCategories();
//       if (res?.data && res.isSuccess) {
//         setCategories(res.data);
//       }
//     };
//     get();
//   }, []);

//   return (
//     <>
//       <BannerSlider />
//       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
//         {Array.from({ length: 10 }).map((_, i) => (
//           <CategoryCard
//             key={i}
//             name={categories[i % categories.length]?.name}
//             imageUrl={categories[i % categories.length]?.imageUrl}
//           />
//         ))}
//       </div>
//     </>
//   );
// }
