/**
 * 監視カバレッジ計算
 * 施設の配置に基づいてデブリの監視カバー率を計算する
 */

import type { Debris, Facility } from '@/types';
import { FACILITY_TYPES } from './facilityManager';
import { EARTH_RADIUS_KM, calculateScaledPosition } from '@/lib/orbit/calculations';

/**
 * カバレッジ計算結果
 */
export interface CoverageResult {
  /** 全体のカバー率 (0-1) */
  totalCoverage: number;
  /** 追跡されているデブリ数 */
  trackedCount: number;
  /** 追跡されていないデブリ数 */
  untrackedCount: number;
  /** 軌道帯ごとのカバー率 */
  byRegion: {
    'LEO-Lower': number;
    'LEO-Upper': number;
    'MEO': number;
    'GEO': number;
  };
  /** 各デブリの追跡状態 */
  debrisTracking: Map<string, string[]>; // debrisId -> facilityIds
}

/**
 * デブリの高度を計算
 */
function getDebrisAltitude(debris: Debris): number {
  return debris.orbit.semiMajorAxis - EARTH_RADIUS_KM;
}

/**
 * デブリのサイズをcmに変換
 */
function getDebrisSizeCm(debris: Debris): number {
  switch (debris.physical.size) {
    case 'large': return 100;
    case 'medium': return 30;
    case 'small': return 5;
    default: return 10;
  }
}

/**
 * 軌道帯を判定
 */
function getOrbitalRegion(altitude: number): 'LEO-Lower' | 'LEO-Upper' | 'MEO' | 'GEO' {
  if (altitude < 600) return 'LEO-Lower';
  if (altitude < 2000) return 'LEO-Upper';
  if (altitude < 35786) return 'MEO';
  return 'GEO';
}

/**
 * 簡易ハッシュ関数（デブリIDと施設IDから決定的な値を生成）
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash);
}

/**
 * 施設がデブリを追跡できるか判定
 * 決定的な判定（同じ施設とデブリの組み合わせは常に同じ結果）
 */
function canTrackDebris(facility: Facility, debris: Debris): boolean {
  // 運用中でなければ追跡不可
  if (facility.operational.status !== 'operational') {
    return false;
  }
  
  // 監視能力がなければ追跡不可
  const monitoring = facility.capabilities.monitoringRange;
  if (!monitoring) {
    return false;
  }
  
  const altitude = getDebrisAltitude(debris);
  const sizeCm = getDebrisSizeCm(debris);
  
  // 高度範囲チェック
  if (altitude < monitoring.minAltitude || altitude > monitoring.maxAltitude) {
    return false;
  }
  
  // サイズチェック
  if (sizeCm < monitoring.minSize) {
    return false;
  }
  
  // 決定的なカバレッジ判定（施設IDとデブリIDから決定）
  const definition = FACILITY_TYPES[facility.type];
  const coverage = definition.monitoring?.coverage || 0;
  
  // ハッシュ値から0-1の値を生成（決定的）
  const hashValue = simpleHash(`${facility.id}-${debris.id}`) % 1000 / 1000;
  
  // 施設位置に基づく追加の可視性判定（簡略版）
  let effectiveCoverage = coverage;
  if (facility.location.type === 'ground' && facility.location.latitude !== undefined) {
    // 軌道傾斜角と施設緯度の関係
    const inclination = debris.orbit.inclination;
    const latitude = Math.abs(facility.location.latitude);
    
    // 施設の緯度より低い傾斜角の軌道は見えにくい
    if (inclination < latitude * 0.8) {
      effectiveCoverage = coverage * 0.5;
    }
  }
  
  // カバレッジ値を上げて追跡しやすくする（ゲームバランス調整）
  // 施設を建設したらある程度の効果を実感できるように
  const adjustedCoverage = Math.min(1, effectiveCoverage * 3);
  
  return hashValue < adjustedCoverage;
}

/**
 * カバレッジを計算
 */
export function calculateCoverage(
  facilities: Facility[],
  debris: Debris[]
): CoverageResult {
  const debrisTracking = new Map<string, string[]>();
  
  // 軌道帯ごとのカウント
  const regionCounts = {
    'LEO-Lower': { total: 0, tracked: 0 },
    'LEO-Upper': { total: 0, tracked: 0 },
    'MEO': { total: 0, tracked: 0 },
    'GEO': { total: 0, tracked: 0 },
  };
  
  // 運用中の監視施設のみを対象
  const operationalFacilities = facilities.filter(
    f => f.operational.status === 'operational' && f.capabilities.monitoringRange
  );
  
  // 各デブリについて追跡可能な施設を判定
  for (const d of debris) {
    if (d.status !== 'active') continue;
    
    const trackingFacilities: string[] = [];
    
    for (const f of operationalFacilities) {
      if (canTrackDebris(f, d)) {
        trackingFacilities.push(f.id);
      }
    }
    
    debrisTracking.set(d.id, trackingFacilities);
    
    // 軌道帯ごとにカウント
    const altitude = getDebrisAltitude(d);
    const region = getOrbitalRegion(altitude);
    regionCounts[region].total++;
    if (trackingFacilities.length > 0) {
      regionCounts[region].tracked++;
    }
  }
  
  // 結果を集計
  const trackedCount = Array.from(debrisTracking.values()).filter(f => f.length > 0).length;
  const activeDebris = debris.filter(d => d.status === 'active').length;
  const untrackedCount = activeDebris - trackedCount;
  
  return {
    totalCoverage: activeDebris > 0 ? trackedCount / activeDebris : 0,
    trackedCount,
    untrackedCount,
    byRegion: {
      'LEO-Lower': regionCounts['LEO-Lower'].total > 0 
        ? regionCounts['LEO-Lower'].tracked / regionCounts['LEO-Lower'].total 
        : 0,
      'LEO-Upper': regionCounts['LEO-Upper'].total > 0 
        ? regionCounts['LEO-Upper'].tracked / regionCounts['LEO-Upper'].total 
        : 0,
      'MEO': regionCounts['MEO'].total > 0 
        ? regionCounts['MEO'].tracked / regionCounts['MEO'].total 
        : 0,
      'GEO': regionCounts['GEO'].total > 0 
        ? regionCounts['GEO'].tracked / regionCounts['GEO'].total 
        : 0,
    },
    debrisTracking,
  };
}

/**
 * 施設を追加した場合のカバレッジ増加を予測
 */
export function predictCoverageIncrease(
  existingFacilities: Facility[],
  newFacility: Facility,
  debris: Debris[]
): {
  currentCoverage: number;
  predictedCoverage: number;
  increase: number;
} {
  const currentResult = calculateCoverage(existingFacilities, debris);
  
  // 新施設を運用中としてシミュレート
  const simulatedFacility: Facility = {
    ...newFacility,
    operational: {
      ...newFacility.operational,
      status: 'operational',
    },
  };
  
  const predictedResult = calculateCoverage(
    [...existingFacilities, simulatedFacility],
    debris
  );
  
  return {
    currentCoverage: currentResult.totalCoverage,
    predictedCoverage: predictedResult.totalCoverage,
    increase: predictedResult.totalCoverage - currentResult.totalCoverage,
  };
}

/**
 * カバレッジが不足している軌道帯を特定
 */
export function identifyGaps(
  coverageResult: CoverageResult,
  targetCoverage: number = 0.8
): ('LEO-Lower' | 'LEO-Upper' | 'MEO' | 'GEO')[] {
  const gaps: ('LEO-Lower' | 'LEO-Upper' | 'MEO' | 'GEO')[] = [];
  
  for (const [region, coverage] of Object.entries(coverageResult.byRegion)) {
    if (coverage < targetCoverage) {
      gaps.push(region as 'LEO-Lower' | 'LEO-Upper' | 'MEO' | 'GEO');
    }
  }
  
  return gaps;
}

/**
 * 推奨施設タイプを取得
 */
export function getRecommendedFacilityTypes(
  gaps: ('LEO-Lower' | 'LEO-Upper' | 'MEO' | 'GEO')[]
): string[] {
  const recommendations: string[] = [];
  
  for (const gap of gaps) {
    switch (gap) {
      case 'LEO-Lower':
      case 'LEO-Upper':
        if (!recommendations.includes('radar_sband')) {
          recommendations.push('radar_sband');
        }
        if (!recommendations.includes('radar_cband')) {
          recommendations.push('radar_cband');
        }
        break;
      case 'MEO':
        if (!recommendations.includes('radar_cband')) {
          recommendations.push('radar_cband');
        }
        if (!recommendations.includes('surveillance_satellite')) {
          recommendations.push('surveillance_satellite');
        }
        break;
      case 'GEO':
        if (!recommendations.includes('optical_telescope')) {
          recommendations.push('optical_telescope');
        }
        if (!recommendations.includes('surveillance_satellite')) {
          recommendations.push('surveillance_satellite');
        }
        break;
    }
  }
  
  return recommendations;
}
