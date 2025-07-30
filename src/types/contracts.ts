export interface ClimateProject {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  beneficiary: string;
  targetAmount: bigint;
  deadline: number;
  isActive: boolean;
  isCompleted: boolean;
  donorCount: number;
}

export interface ProjectStats {
  donorCount: number;
  publicProgress: number;
}

export interface NFTMetadata {
  donationTier: number;
  climateTheme: string;
  timestamp: number;
}

export interface DonationFormData {
  amount: string;
  message?: string;
}

export type ClimateTheme = 'FOREST' | 'OCEAN' | 'RENEWABLE' | 'CARBON';

export interface ClimateThemeInfo {
  name: string;
  colors: string[];
  attributes: string[];
  rarity: string;
  description: string;
}

export const CLIMATE_THEMES: Record<ClimateTheme, ClimateThemeInfo> = {
  FOREST: {
    name: "森林保护",
    colors: ["#228B22", "#32CD32", "#90EE90"],
    attributes: ["碳吸收", "生物多样性", "氧气生产"],
    rarity: "common",
    description: "通过植树造林和森林保护，增加碳吸收能力",
  },
  OCEAN: {
    name: "海洋保护",
    colors: ["#0077BE", "#4682B4", "#87CEEB"],
    attributes: ["海洋清洁", "珊瑚保护", "海洋生物"],
    rarity: "uncommon",
    description: "保护海洋生态系统，减少海洋污染",
  },
  RENEWABLE: {
    name: "可再生能源",
    colors: ["#FFD700", "#FFA500", "#FF6347"],
    attributes: ["太阳能", "风能", "清洁电力"],
    rarity: "rare",
    description: "推广清洁能源，减少化石燃料依赖",
  },
  CARBON: {
    name: "碳中和",
    colors: ["#696969", "#A9A9A9", "#D3D3D3"],
    attributes: ["碳捕获", "减排", "净零排放"],
    rarity: "epic",
    description: "通过技术创新实现碳中和目标",
  },
};

export const getDonationTier = (amount: number): number => {
  if (amount >= 0.1) return 5; // 钻石级
  if (amount >= 0.05) return 4; // 黄金级
  if (amount >= 0.01) return 3; // 白银级
  if (amount >= 0.005) return 2; // 青铜级
  return 1; // 基础级
};

export const getTierName = (tier: number): string => {
  const tiers = ["基础级", "青铜级", "白银级", "黄金级", "钻石级"];
  return tiers[tier - 1] || "未知";
};

export const getTierColor = (tier: number): string => {
  const colors = ["#8B4513", "#CD7F32", "#C0C0C0", "#FFD700", "#B9F2FF"];
  return colors[tier - 1] || "#000000";
};