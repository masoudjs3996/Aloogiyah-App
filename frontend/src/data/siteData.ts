import { LuWheat, LuSprout ,LuApple,LuGrape,LuFlower ,LuEgg,LuFlower2,LuTreePine} from "react-icons/lu";

export interface Category {
  title: string;
  slug: string;
  icon: React.ElementType;
  description?: string;
  productCount: number;
}
export const categories: Category[] = [
  { title: "غلات و حبوبات", slug: "grains-cereals", icon: LuWheat,productCount: 60},
  { title: "سبزیجات", slug: "vegetables", icon: LuSprout,productCount: 120,},
  { title: "میوه ها", slug: "fruits", icon: LuApple,productCount: 95,},
  { title: "تاکستان ها", slug: "vineyards", icon: LuGrape,productCount: 25,},
  { title: "گل شاخه ای", slug: "dairy", icon: LuFlower ,productCount: 45,},
  { title: "نهاده (کود,بذر,سم)", slug: "poultry", icon: LuEgg,productCount: 35,},
  { title: "گل ها", slug: "flowers", icon: LuFlower2,productCount: 30,},
  { title: "گل آپارتمانی", slug: "forestry", icon: LuTreePine,productCount: 18, },
];
