/**
 * 施設管理
 * 施設の定義、配置、運用を管理する
 */

import type { Facility, FacilityType, FacilityLocation, OrbitalElements } from '@/types';
import { altitudeToRadius } from '@/lib/orbit/calculations';

/**
 * 施設タイプの定義
 */
export interface FacilityTypeDefinition {
  type: FacilityType;
  name: string;
  description: string;
  category: 'ground' | 'space';
  
  // コスト
  constructionCost: number;  // 建設コスト ($M)
  monthlyCost: number;       // 月間維持費 ($M)
  
  // 建設期間（ターン数）
  constructionTime: number;
  
  // 監視能力（監視施設の場合）
  monitoring?: {
    minAltitude: number;     // 最小監視高度 (km)
    maxAltitude: number;     // 最大監視高度 (km)
    minSize: number;         // 検出可能最小サイズ (cm)
    coverage: number;        // カバー率 (0-1)
  };
  
  // 除去能力（除去施設の場合）
  removal?: {
    annualCapacity: number;  // 年間除去可能数
    method: 'magnetic' | 'net' | 'laser' | 'harpoon';
    targetSize: ('small' | 'medium' | 'large')[];
  };
}

/**
 * 施設タイプカタログ
 * 建設時間は短縮済み（地上: 1-3ターン、宇宙: 4-8ターン）
 */
export const FACILITY_TYPES: Record<FacilityType, FacilityTypeDefinition> = {
  // 地上監視施設
  radar_sband: {
    type: 'radar_sband',
    name: 'Sバンドレーダー',
    description: 'LEO帯の10cm以上のデブリを監視。天候影響が小さい。',
    category: 'ground',
    constructionCost: 50,
    monthlyCost: 0.5,
    constructionTime: 1,  // 即戦力として使いやすく
    monitoring: {
      minAltitude: 200,
      maxAltitude: 2000,
      minSize: 10,
      coverage: 0.25,  // カバレッジ向上
    },
  },
  
  radar_cband: {
    type: 'radar_cband',
    name: 'Cバンドレーダー',
    description: 'LEO〜MEO帯の5cm以上のデブリを高精度追跡。',
    category: 'ground',
    constructionCost: 100,
    monthlyCost: 1,
    constructionTime: 3,  // 6 → 3
    monitoring: {
      minAltitude: 200,
      maxAltitude: 20000,
      minSize: 5,
      coverage: 0.35,  // カバレッジ向上
    },
  },
  
  optical_telescope: {
    type: 'optical_telescope',
    name: '光学望遠鏡',
    description: 'MEO〜GEO帯を監視。夜間・晴天時のみ稼働。',
    category: 'ground',
    constructionCost: 30,
    monthlyCost: 0.3,
    constructionTime: 1,  // 2 → 1
    monitoring: {
      minAltitude: 2000,
      maxAltitude: 40000,
      minSize: 50,
      coverage: 0.2,  // カバレッジ向上
    },
  },
  
  laser_ranging: {
    type: 'laser_ranging',
    name: 'レーザー測距局',
    description: 'mm精度の軌道決定が可能。協力的な対象のみ。',
    category: 'ground',
    constructionCost: 80,
    monthlyCost: 0.8,
    constructionTime: 2,  // 4 → 2
    monitoring: {
      minAltitude: 200,
      maxAltitude: 40000,
      minSize: 1,
      coverage: 0.15,  // カバレッジ向上
    },
  },
  
  // 宇宙監視施設
  surveillance_satellite: {
    type: 'surveillance_satellite',
    name: '監視衛星',
    description: '宇宙空間から全方位を監視。軌道維持にΔVが必要。',
    category: 'space',
    constructionCost: 150,
    monthlyCost: 2,
    constructionTime: 6,  // 12 → 6
    monitoring: {
      minAltitude: 200,
      maxAltitude: 40000,
      minSize: 5,
      coverage: 0.4,  // 宇宙からの監視は高カバレッジ
    },
  },
  
  // 除去施設
  removal_magnetic: {
    type: 'removal_magnetic',
    name: '除去衛星（磁石式）',
    description: '磁力でデブリを捕獲。金属製デブリのみ対応。',
    category: 'space',
    constructionCost: 200,
    monthlyCost: 3,
    constructionTime: 6,  // 12 → 6
    removal: {
      annualCapacity: 5,
      method: 'magnetic',
      targetSize: ['medium', 'large'],
    },
  },
  
  removal_net: {
    type: 'removal_net',
    name: '除去衛星（網式）',
    description: 'ネットでデブリを捕獲。不規則形状にも対応。',
    category: 'space',
    constructionCost: 180,
    monthlyCost: 2.5,
    constructionTime: 5,  // 10 → 5
    removal: {
      annualCapacity: 3,
      method: 'net',
      targetSize: ['small', 'medium', 'large'],
    },
  },
  
  removal_laser: {
    type: 'removal_laser',
    name: '除去衛星（レーザー）',
    description: 'レーザーで小型デブリを蒸発。高効率だが高コスト。',
    category: 'space',
    constructionCost: 300,
    monthlyCost: 5,
    constructionTime: 8,  // 18 → 8
    removal: {
      annualCapacity: 20,
      method: 'laser',
      targetSize: ['small'],
    },
  },
};

/**
 * 地上施設の候補地（主要な宇宙監視施設の位置を参考）
 */
export const GROUND_SITE_CANDIDATES = [
  { name: 'アラスカ', latitude: 64.8, longitude: -147.7, country: 'USA' },
  { name: 'ハワイ', latitude: 19.8, longitude: -155.5, country: 'USA' },
  { name: 'カリフォルニア', latitude: 34.0, longitude: -118.2, country: 'USA' },
  { name: 'マサチューセッツ', latitude: 42.4, longitude: -71.1, country: 'USA' },
  { name: 'イギリス', latitude: 51.5, longitude: -0.1, country: 'UK' },
  { name: 'ドイツ', latitude: 52.5, longitude: 13.4, country: 'Germany' },
  { name: 'オーストラリア', latitude: -33.9, longitude: 151.2, country: 'Australia' },
  { name: '日本（上齋原）', latitude: 35.2, longitude: 133.8, country: 'Japan' },
  { name: '日本（美星）', latitude: 34.7, longitude: 133.5, country: 'Japan' },
  { name: 'チリ', latitude: -33.4, longitude: -70.6, country: 'Chile' },
  { name: '南アフリカ', latitude: -33.9, longitude: 18.4, country: 'South Africa' },
  { name: 'インド', latitude: 13.0, longitude: 77.6, country: 'India' },
];

/**
 * 施設IDを生成
 */
export function generateFacilityId(): string {
  return `facility-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 新しい施設を作成
 */
export function createFacility(
  type: FacilityType,
  location: FacilityLocation,
  name?: string
): Facility {
  const definition = FACILITY_TYPES[type];
  const id = generateFacilityId();
  
  return {
    id,
    type,
    name: name || `${definition.name} #${id.slice(-4)}`,
    location,
    capabilities: {
      monitoringRange: definition.monitoring ? {
        minAltitude: definition.monitoring.minAltitude,
        maxAltitude: definition.monitoring.maxAltitude,
        minSize: definition.monitoring.minSize,
      } : undefined,
      removalCapacity: definition.removal?.annualCapacity,
      removalMethod: definition.removal?.method,
    },
    operational: {
      status: 'constructing',
      constructionTurns: definition.constructionTime,
      constructionRemaining: definition.constructionTime,
      health: 100,
      fuel: definition.category === 'space' ? 100 : undefined,
    },
    cost: {
      construction: definition.constructionCost,
      monthly: definition.monthlyCost,
    },
  };
}

/**
 * 宇宙施設の軌道を生成
 */
export function generateSpaceFacilityOrbit(
  altitude: number,
  inclination: number = 45
): OrbitalElements {
  return {
    semiMajorAxis: altitudeToRadius(altitude),
    eccentricity: 0.001,
    inclination,
    raan: Math.random() * 360,
    argumentOfPeriapsis: 0,
    meanAnomaly: Math.random() * 360,
    epoch: new Date(),
  };
}

/**
 * 施設の建設を進める（1ターン）
 */
export function advanceConstruction(facility: Facility): Facility {
  if (facility.operational.status !== 'constructing') {
    return facility;
  }
  
  const remaining = (facility.operational.constructionRemaining || 0) - 1;
  
  if (remaining <= 0) {
    return {
      ...facility,
      operational: {
        ...facility.operational,
        status: 'operational',
        constructionRemaining: 0,
      },
    };
  }
  
  return {
    ...facility,
    operational: {
      ...facility.operational,
      constructionRemaining: remaining,
    },
  };
}

/**
 * 施設のカテゴリでフィルタリング
 */
export function getFacilitiesByCategory(
  facilities: Facility[],
  category: 'ground' | 'space'
): Facility[] {
  return facilities.filter(f => FACILITY_TYPES[f.type].category === category);
}

/**
 * 監視施設のみを取得
 */
export function getMonitoringFacilities(facilities: Facility[]): Facility[] {
  return facilities.filter(f => f.capabilities.monitoringRange !== undefined);
}

/**
 * 除去施設のみを取得
 */
export function getRemovalFacilities(facilities: Facility[]): Facility[] {
  return facilities.filter(f => f.capabilities.removalCapacity !== undefined);
}
