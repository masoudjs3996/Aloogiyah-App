export const rewardColors = {
  flowers: { color: "#BE185D", soft: "#FDF2F8", border: "#FBCFE8" },
  indoor: { color: "#6D28D9", soft: "#F5F3FF", border: "#DDD6FE" },
  supplies: { color: "#92400E", soft: "#FFFBEB", border: "#FDE68A" },
  fruit: { color: "#C2410C", soft: "#FFF7ED", border: "#FED7AA" },
  vegetables: { color: "#15803D", soft: "#F0FDF4", border: "#BBF7D0" },
  all: { color: "#0F766E", soft: "#F0FDFA", border: "#99F6E4" },
} as const;

export const allRewardColors = [
  rewardColors.flowers.color,
  rewardColors.indoor.color,
  rewardColors.supplies.color,
  rewardColors.fruit.color,
  rewardColors.vegetables.color,
];

export function rewardCategoryColor(name = "") {
  const normalized = name
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\s\u200c]+/g, "");
  if (normalized.includes("شاخه")) return rewardColors.flowers;
  if (normalized.includes("آپارتمان") || normalized.includes("اپارتمان"))
    return rewardColors.indoor;
  if (normalized.includes("نهاده")) return rewardColors.supplies;
  if (normalized.includes("میوه")) return rewardColors.fruit;
  if (normalized.includes("سبزی")) return rewardColors.vegetables;
  return rewardColors.all;
}
