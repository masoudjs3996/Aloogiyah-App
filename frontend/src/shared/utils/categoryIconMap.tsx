import { IconType } from "react-icons";
import { MdLocalFlorist } from "react-icons/md";
import { GiFlowerPot, GiSummits, GiCabbage } from "react-icons/gi";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { GiShinyApple } from "react-icons/gi";
export const categoryIconMap: Record<string, IconType> = {
  "branched-flower": MdLocalFlorist,
  "Houseplants-flowers": GiFlowerPot,
  fruit: GiShinyApple,
  "Seed-fertilizer-poison": GiCabbage,
  "Vegetables-summer-vegetables": GiSummits,
};

export const getCategoryIcon = (slug?: string | null): IconType => {
  if (!slug) return AiOutlineQuestionCircle;
  return categoryIconMap[slug] ?? AiOutlineQuestionCircle;
};
