/**
 * デブリデータ生成ロジック
 * シミュレーション用のデブリデータを生成する
 */

import type { Debris, OrbitalElements, DebrisSize, DebrisType, DangerLevel, OrbitalRegionName } from '@/types';
import { altitudeToRadius, EARTH_RADIUS_KM } from '@/lib/orbit/calculations';

/**
 * ランダムな値を生成（min以上max未満）
 */
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 配列からランダムに選択
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 正規分布に従うランダム値を生成（Box-Muller法）
 */
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/**
 * 軌道帯ごとの高度範囲
 */
const ORBITAL_REGIONS = {
  'LEO-Lower': { min: 200, max: 600 },
  'LEO-Upper': { min: 600, max: 1200 },
  'MEO': { min: 2000, max: 20000 },
  'GEO': { min: 35700, max: 35900 },
} as const;

/**
 * 軌道帯ごとのデブリ分布比率
 */
const REGION_DISTRIBUTION = {
  'LEO-Lower': 0.35,
  'LEO-Upper': 0.45,
  'MEO': 0.15,
  'GEO': 0.05,
};

/**
 * デブリサイズの分布
 */
const SIZE_DISTRIBUTION: { size: DebrisSize; weight: number }[] = [
  { size: 'small', weight: 0.7 },
  { size: 'medium', weight: 0.25 },
  { size: 'large', weight: 0.05 },
];

/**
 * デブリタイプの分布
 */
const TYPE_DISTRIBUTION: { type: DebrisType; weight: number }[] = [
  { type: 'fragment', weight: 0.6 },
  { type: 'rocket_body', weight: 0.15 },
  { type: 'payload', weight: 0.15 },
  { type: 'unknown', weight: 0.1 },
];

/**
 * 重み付きランダム選択
 */
function weightedChoice<T>(items: { value: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.value;
    }
  }
  
  return items[items.length - 1].value;
}

/**
 * ランダムな軌道要素を生成
 */
function generateRandomOrbitalElements(region: OrbitalRegionName): OrbitalElements {
  const { min, max } = ORBITAL_REGIONS[region];
  const altitude = randomRange(min, max);
  const semiMajorAxis = altitudeToRadius(altitude);

  // 離心率（LEOは円軌道に近い、GEOはほぼ円軌道）
  let eccentricity: number;
  if (region === 'GEO') {
    eccentricity = randomRange(0, 0.01);
  } else if (region.startsWith('LEO')) {
    eccentricity = randomRange(0, 0.1);
  } else {
    eccentricity = randomRange(0, 0.3);
  }

  // 軌道傾斜角（LEOは様々、GEOは赤道面に近い）
  let inclination: number;
  if (region === 'GEO') {
    inclination = randomRange(0, 5);
  } else {
    // 一般的な軌道傾斜角の分布をシミュレート
    const inclinationTypes = [
      { value: randomRange(0, 30), weight: 0.2 },      // 低傾斜
      { value: randomRange(45, 60), weight: 0.3 },    // 中傾斜
      { value: randomRange(80, 100), weight: 0.35 },  // 極軌道
      { value: randomRange(28, 32), weight: 0.15 },   // ISS軌道付近
    ];
    inclination = weightedChoice(inclinationTypes.map(i => ({ value: i.value, weight: i.weight })));
  }

  return {
    semiMajorAxis,
    eccentricity,
    inclination,
    raan: randomRange(0, 360),
    argumentOfPeriapsis: randomRange(0, 360),
    meanAnomaly: randomRange(0, 360),
    epoch: new Date(),
  };
}

/**
 * 危険度を計算
 */
function calculateDangerLevel(debris: {
  size: DebrisSize;
  altitude: number;
  eccentricity: number;
}): DangerLevel {
  let score = 0;

  // サイズによるスコア
  if (debris.size === 'large') score += 3;
  else if (debris.size === 'medium') score += 2;
  else score += 1;

  // 高度によるスコア（LEOが最も危険）
  if (debris.altitude < 600) score += 2;
  else if (debris.altitude < 1200) score += 1.5;
  else if (debris.altitude < 2000) score += 1;

  // 離心率によるスコア（楕円軌道は他の軌道と交差しやすい）
  if (debris.eccentricity > 0.1) score += 1;

  // スコアを危険度に変換
  if (score >= 5) return 5;
  if (score >= 4) return 4;
  if (score >= 3) return 3;
  if (score >= 2) return 2;
  return 1;
}

/**
 * 単一のデブリを生成
 */
export function generateDebris(id: string, region?: OrbitalRegionName): Debris {
  // 軌道帯を決定
  const selectedRegion = region || weightedChoice(
    Object.entries(REGION_DISTRIBUTION).map(([r, w]) => ({
      value: r as OrbitalRegionName,
      weight: w,
    }))
  );

  // 軌道要素を生成
  const orbit = generateRandomOrbitalElements(selectedRegion);

  // サイズを決定
  const size = weightedChoice(
    SIZE_DISTRIBUTION.map(s => ({ value: s.size, weight: s.weight }))
  );

  // タイプを決定
  const type = weightedChoice(
    TYPE_DISTRIBUTION.map(t => ({ value: t.type, weight: t.weight }))
  );

  // 質量を推定（サイズに基づく）
  const massRanges = {
    small: [0.001, 1],
    medium: [1, 100],
    large: [100, 10000],
  };
  const [minMass, maxMass] = massRanges[size];
  const estimatedMass = randomRange(minMass, maxMass);

  // 高度を計算
  const altitude = orbit.semiMajorAxis - EARTH_RADIUS_KM;

  // 危険度を計算
  const dangerLevel = calculateDangerLevel({
    size,
    altitude,
    eccentricity: orbit.eccentricity,
  });

  // 衝突確率（簡易計算）
  const collisionProbability = (dangerLevel / 5) * 0.001 * (size === 'large' ? 2 : size === 'medium' ? 1.5 : 1);

  return {
    id,
    catalogNumber: `SIM-${id.padStart(5, '0')}`,
    name: `Debris ${id}`,
    orbit,
    physical: {
      size,
      estimatedMass,
      type,
    },
    risk: {
      collisionProbability,
      dangerLevel,
      trackedBy: [],
    },
    status: 'active',
  };
}

/**
 * 複数のデブリを生成
 * @param count デブリ数
 * @param dangerousRatio 危険度3以上のデブリの割合 (0-1)
 */
export function generateDebrisField(count: number, dangerousRatio: number = 0.2): Debris[] {
  const debris: Debris[] = [];

  for (let i = 0; i < count; i++) {
    const d = generateDebris(String(i + 1));
    
    // 危険度の調整（dangerousRatio に基づいて危険度を上げる）
    if (Math.random() < dangerousRatio) {
      // 危険度を3以上に上げる
      const newDangerLevel = Math.min(5, Math.max(3, d.risk.dangerLevel + Math.floor(Math.random() * 3))) as DangerLevel;
      d.risk.dangerLevel = newDangerLevel;
      d.risk.collisionProbability = (newDangerLevel / 5) * 0.002; // 衝突確率も上げる
    }
    
    debris.push(d);
  }

  return debris;
}

/**
 * 特定の軌道帯にデブリを集中生成
 */
export function generateDebrisInRegion(
  count: number,
  region: OrbitalRegionName
): Debris[] {
  const debris: Debris[] = [];

  for (let i = 0; i < count; i++) {
    debris.push(generateDebris(`${region}-${i + 1}`, region));
  }

  return debris;
}

/**
 * 衝突イベントによるデブリ雲を生成
 */
export function generateCollisionDebris(
  baseOrbit: OrbitalElements,
  count: number,
  spreadFactor: number = 0.1
): Debris[] {
  const debris: Debris[] = [];

  for (let i = 0; i < count; i++) {
    // 元の軌道から少しずれた軌道を生成
    const orbit: OrbitalElements = {
      semiMajorAxis: baseOrbit.semiMajorAxis * (1 + randomNormal(0, spreadFactor * 0.01)),
      eccentricity: Math.max(0, Math.min(0.9, baseOrbit.eccentricity + randomNormal(0, spreadFactor * 0.1))),
      inclination: baseOrbit.inclination + randomNormal(0, spreadFactor * 2),
      raan: baseOrbit.raan + randomNormal(0, spreadFactor * 5),
      argumentOfPeriapsis: baseOrbit.argumentOfPeriapsis + randomNormal(0, spreadFactor * 10),
      meanAnomaly: randomRange(0, 360), // 軌道上にランダムに分布
      epoch: new Date(),
    };

    const id = `collision-${Date.now()}-${i}`;
    debris.push({
      id,
      catalogNumber: `COL-${id}`,
      name: `Collision Fragment ${i + 1}`,
      orbit,
      physical: {
        size: weightedChoice([
          { value: 'small' as DebrisSize, weight: 0.8 },
          { value: 'medium' as DebrisSize, weight: 0.18 },
          { value: 'large' as DebrisSize, weight: 0.02 },
        ]),
        estimatedMass: randomRange(0.001, 10),
        type: 'fragment',
      },
      risk: {
        collisionProbability: randomRange(0.0001, 0.001),
        dangerLevel: randomChoice([1, 2, 3] as DangerLevel[]),
        trackedBy: [],
      },
      status: 'active',
    });
  }

  return debris;
}

/**
 * 難易度に応じたデブリ数を取得
 */
export function getDebrisCountForDifficulty(difficulty: 'beginner' | 'standard' | 'advanced' | 'expert'): number {
  const counts = {
    beginner: 100,
    standard: 500,
    advanced: 2000,
    expert: 5000,
  };
  return counts[difficulty];
}
