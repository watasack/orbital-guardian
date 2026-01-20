/**
 * 軌道計算ユーティリティ
 * ケプラー軌道要素から3D位置を計算する
 */

import type { OrbitalElements } from '@/types';

/** 地球の半径 (km) */
export const EARTH_RADIUS_KM = 6371;

/** 3D表示用のスケールファクター（地球半径を1とする） */
export const SCALE_FACTOR = 1 / EARTH_RADIUS_KM;

/** 重力定数 × 地球質量 (km³/s²) */
export const GM = 398600.4418;

/**
 * 度をラジアンに変換
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * ラジアンを度に変換
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 軌道周期を計算 (秒)
 * T = 2π√(a³/GM)
 */
export function calculateOrbitalPeriod(semiMajorAxis: number): number {
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / GM);
}

/**
 * 平均運動を計算 (rad/s)
 * n = √(GM/a³)
 */
export function calculateMeanMotion(semiMajorAxis: number): number {
  return Math.sqrt(GM / Math.pow(semiMajorAxis, 3));
}

/**
 * ケプラー方程式を解いて離心近点角を求める
 * M = E - e*sin(E)
 * ニュートン法で反復計算
 */
export function solveKeplerEquation(
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-8,
  maxIterations: number = 100
): number {
  let E = meanAnomaly; // 初期値

  for (let i = 0; i < maxIterations; i++) {
    const dE = (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
    E -= dE;

    if (Math.abs(dE) < tolerance) {
      break;
    }
  }

  return E;
}

/**
 * 離心近点角から真近点角を計算
 */
export function eccentricToTrueAnomaly(E: number, eccentricity: number): number {
  const sinV = (Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E)) / (1 - eccentricity * Math.cos(E));
  const cosV = (Math.cos(E) - eccentricity) / (1 - eccentricity * Math.cos(E));
  return Math.atan2(sinV, cosV);
}

/**
 * 軌道要素から3D位置を計算
 * @param elements 軌道要素
 * @param time 元期からの経過時間（秒）
 * @returns [x, y, z] 位置（km）
 */
export function calculatePosition(
  elements: OrbitalElements,
  time: number = 0
): [number, number, number] {
  const { semiMajorAxis, eccentricity, inclination, raan, argumentOfPeriapsis, meanAnomaly } = elements;

  // 角度をラジアンに変換
  const i = degToRad(inclination);
  const Ω = degToRad(raan);
  const ω = degToRad(argumentOfPeriapsis);

  // 平均運動
  const n = calculateMeanMotion(semiMajorAxis);

  // 現在の平均近点角
  const M = degToRad(meanAnomaly) + n * time;

  // ケプラー方程式を解いて離心近点角を求める
  const E = solveKeplerEquation(M, eccentricity);

  // 真近点角
  const v = eccentricToTrueAnomaly(E, eccentricity);

  // 軌道面内の距離
  const r = semiMajorAxis * (1 - eccentricity * Math.cos(E));

  // 軌道面内の位置
  const xOrbit = r * Math.cos(v);
  const yOrbit = r * Math.sin(v);

  // 3D空間への変換（回転行列の適用）
  const cosΩ = Math.cos(Ω);
  const sinΩ = Math.sin(Ω);
  const cosω = Math.cos(ω);
  const sinω = Math.sin(ω);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);

  const x = (cosΩ * cosω - sinΩ * sinω * cosi) * xOrbit + (-cosΩ * sinω - sinΩ * cosω * cosi) * yOrbit;
  const y = (sinΩ * cosω + cosΩ * sinω * cosi) * xOrbit + (-sinΩ * sinω + cosΩ * cosω * cosi) * yOrbit;
  const z = (sinω * sini) * xOrbit + (cosω * sini) * yOrbit;

  return [x, y, z];
}

/**
 * 軌道要素から3D位置を計算（スケール済み、地球半径=1）
 */
export function calculateScaledPosition(
  elements: OrbitalElements,
  time: number = 0
): [number, number, number] {
  const [x, y, z] = calculatePosition(elements, time);
  return [x * SCALE_FACTOR, y * SCALE_FACTOR, z * SCALE_FACTOR];
}

/**
 * 緯度経度から3Dデカルト座標に変換
 * @param latitude 緯度（度）
 * @param longitude 経度（度）
 * @param radius 半径（スケール済み）
 * @returns [x, y, z] 座標
 */
export function latLongToCartesian(
  latitude: number,
  longitude: number,
  radius: number
): [number, number, number] {
  const latRad = degToRad(latitude);
  const lonRad = degToRad(longitude);
  
  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);
  
  return [x, y, z];
}

/**
 * 高度から軌道半径を計算
 */
export function altitudeToRadius(altitudeKm: number): number {
  return EARTH_RADIUS_KM + altitudeKm;
}

/**
 * 軌道半径から高度を計算
 */
export function radiusToAltitude(radiusKm: number): number {
  return radiusKm - EARTH_RADIUS_KM;
}

/**
 * 軌道の近地点高度を計算
 */
export function calculatePeriapsis(semiMajorAxis: number, eccentricity: number): number {
  return semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS_KM;
}

/**
 * 軌道の遠地点高度を計算
 */
export function calculateApoapsis(semiMajorAxis: number, eccentricity: number): number {
  return semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS_KM;
}

/**
 * 軌道帯を判定
 */
export function determineOrbitalRegion(altitudeKm: number): 'LEO-Lower' | 'LEO-Upper' | 'MEO' | 'GEO' | 'HEO' {
  if (altitudeKm < 600) return 'LEO-Lower';
  if (altitudeKm < 2000) return 'LEO-Upper';
  if (altitudeKm < 35786) return 'MEO';
  if (altitudeKm < 36000) return 'GEO';
  return 'HEO';
}

/**
 * 軌道全体の点列を生成（軌道線の描画用）
 */
export function generateOrbitPoints(
  elements: OrbitalElements,
  numPoints: number = 100
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const period = calculateOrbitalPeriod(elements.semiMajorAxis);

  for (let i = 0; i <= numPoints; i++) {
    const time = (i / numPoints) * period;
    points.push(calculateScaledPosition(elements, time));
  }

  return points;
}
