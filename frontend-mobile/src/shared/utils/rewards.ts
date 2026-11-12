import type { CategoryOption, Reward } from "../types/platform";

export const rewardPalettes = {
  flowers: {
    color: "#BE185D",
    soft: "#FDF2F8",
    border: "#FBCFE8",
    icon: "flower-outline",
  },
  indoor: {
    color: "#6D28D9",
    soft: "#F5F3FF",
    border: "#DDD6FE",
    icon: "leaf-outline",
  },
  supplies: {
    color: "#92400E",
    soft: "#FFFBEB",
    border: "#FDE68A",
    icon: "construct-outline",
  },
  fruit: {
    color: "#C2410C",
    soft: "#FFF7ED",
    border: "#FED7AA",
    icon: "nutrition-outline",
  },
  vegetables: {
    color: "#15803D",
    soft: "#F0FDF4",
    border: "#BBF7D0",
    icon: "leaf-outline",
  },
  all: {
    color: "#0F766E",
    soft: "#F0FDFA",
    border: "#99F6E4",
    icon: "grid-outline",
  },
} as const;
export type RewardPalette =
  (typeof rewardPalettes)[keyof typeof rewardPalettes];
export const categoryColors = [
  rewardPalettes.flowers.color,
  rewardPalettes.indoor.color,
  rewardPalettes.supplies.color,
  rewardPalettes.fruit.color,
  rewardPalettes.vegetables.color,
];

export function rewardPalette(name = ""): RewardPalette {
  const normalized = name
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\s\u200c]+/g, "");
  if (normalized.includes("شاخه")) return rewardPalettes.flowers;
  if (normalized.includes("آپارتمان") || normalized.includes("اپارتمان"))
    return rewardPalettes.indoor;
  if (normalized.includes("نهاده")) return rewardPalettes.supplies;
  if (normalized.includes("میوه")) return rewardPalettes.fruit;
  if (normalized.includes("سبزی")) return rewardPalettes.vegetables;
  return rewardPalettes.all;
}

export function rewardCategoryCodes(reward: Pick<Reward, "rootCategoryCodes">) {
  return (reward.rootCategoryCodes ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

export function matchesRewardCategory(reward: Reward, code: string) {
  return !code || rewardCategoryCodes(reward).includes(code);
}

export function rewardCategoryNames(
  reward: Reward,
  categories: CategoryOption[],
) {
  const codes = rewardCategoryCodes(reward);
  const names = codes
    .map((code) => categories.find((category) => category.code === code)?.name)
    .filter((name): name is string => !!name);
  return names.length
    ? names
    : (reward.rootCategoryNames ?? "")
        .split("،")
        .map((name) => name.trim())
        .filter(Boolean);
}

export function rewardAvailability(reward: Reward, now = Date.now()) {
  const end = reward.endDate ? Date.parse(reward.endDate) : NaN;
  const start = reward.startDate ? Date.parse(reward.startDate) : NaN;
  const daysLeft = Number.isFinite(end)
    ? Math.max(0, Math.ceil((end - now) / 86400000))
    : null;
  const remainingUsage =
    reward.maxUsage == null
      ? null
      : Math.max(0, reward.maxUsage - reward.usageCount);
  const expired = Number.isFinite(end) && end <= now;
  const upcoming = Number.isFinite(start) && start > now;
  return {
    daysLeft,
    remainingUsage,
    expired,
    upcoming,
    usable: reward.isActive && !expired && !upcoming && remainingUsage !== 0,
  };
}
