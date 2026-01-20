'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

import { EARTH_RADIUS_KM, SCALE_FACTOR } from '@/lib/orbit/calculations';

interface OrbitalRegionsProps {
  /** 表示する軌道帯 */
  showRegions?: ('LEO-Lower' | 'LEO-Upper' | 'MEO' | 'GEO')[];
  /** 透明度 */
  opacity?: number;
}

/**
 * 軌道帯の定義
 */
const REGIONS = {
  'LEO-Lower': {
    minAltitude: 200,
    maxAltitude: 600,
    color: '#22d3ee',
    label: 'LEO (Lower)',
  },
  'LEO-Upper': {
    minAltitude: 600,
    maxAltitude: 1200,
    color: '#06b6d4',
    label: 'LEO (Upper)',
  },
  'MEO': {
    minAltitude: 2000,
    maxAltitude: 20000,
    color: '#8b5cf6',
    label: 'MEO',
  },
  'GEO': {
    minAltitude: 35700,
    maxAltitude: 35900,
    color: '#f59e0b',
    label: 'GEO',
  },
} as const;

/**
 * 軌道帯の可視化コンポーネント
 * 各軌道帯を半透明の球殻として表示
 */
export function OrbitalRegions({
  showRegions = ['LEO-Lower', 'LEO-Upper'],
  opacity = 0.1,
}: OrbitalRegionsProps) {
  return (
    <group>
      {showRegions.map((regionName) => {
        const region = REGIONS[regionName];
        return (
          <OrbitalRegionShell
            key={regionName}
            minRadius={(EARTH_RADIUS_KM + region.minAltitude) * SCALE_FACTOR}
            maxRadius={(EARTH_RADIUS_KM + region.maxAltitude) * SCALE_FACTOR}
            color={region.color}
            opacity={opacity}
          />
        );
      })}
    </group>
  );
}

interface OrbitalRegionShellProps {
  minRadius: number;
  maxRadius: number;
  color: string;
  opacity: number;
}

/**
 * 単一の軌道帯シェル
 */
function OrbitalRegionShell({ minRadius, maxRadius, color, opacity }: OrbitalRegionShellProps) {
  return (
    <group>
      {/* 外側の球 */}
      <mesh>
        <sphereGeometry args={[maxRadius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* 内側の球（逆向き） */}
      <mesh>
        <sphereGeometry args={[minRadius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.5}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * 軌道帯の境界リング
 */
export function OrbitalRegionRings({
  showRegions = ['LEO-Lower', 'LEO-Upper', 'GEO'],
  opacity = 0.3,
}: OrbitalRegionsProps) {
  return (
    <group>
      {showRegions.map((regionName) => {
        const region = REGIONS[regionName];
        const innerRadius = (EARTH_RADIUS_KM + region.minAltitude) * SCALE_FACTOR;
        const outerRadius = (EARTH_RADIUS_KM + region.maxAltitude) * SCALE_FACTOR;
        
        return (
          <group key={regionName}>
            {/* 内側リング */}
            <OrbitRing radius={innerRadius} color={region.color} opacity={opacity} />
            {/* 外側リング */}
            <OrbitRing radius={outerRadius} color={region.color} opacity={opacity * 0.5} />
          </group>
        );
      })}
    </group>
  );
}

interface OrbitRingProps {
  radius: number;
  color: string;
  opacity: number;
  segments?: number;
}

/**
 * 軌道リング（赤道面）
 */
function OrbitRing({ radius, color, opacity, segments = 128 }: OrbitRingProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    return pts;
  }, [radius, segments]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

/**
 * 高度グリッド（球面上のグリッド線）
 */
export function AltitudeGrid({ altitudes = [400, 800, 1200], opacity = 0.1 }: { altitudes?: number[]; opacity?: number }) {
  return (
    <group>
      {altitudes.map((altitude) => {
        const radius = (EARTH_RADIUS_KM + altitude) * SCALE_FACTOR;
        return (
          <group key={altitude}>
            {/* 赤道リング */}
            <OrbitRing radius={radius} color="#4a5568" opacity={opacity} />
            
            {/* 経度線（4本） */}
            {[0, 45, 90, 135].map((angle) => (
              <LongitudeLine
                key={angle}
                radius={radius}
                longitude={angle}
                color="#4a5568"
                opacity={opacity * 0.5}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

interface LongitudeLineProps {
  radius: number;
  longitude: number;
  color: string;
  opacity: number;
}

/**
 * 経度線
 */
function LongitudeLine({ radius, longitude, color, opacity }: LongitudeLineProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const lonRad = (longitude * Math.PI) / 180;
    
    for (let i = 0; i <= 64; i++) {
      const lat = ((i / 64) * Math.PI) - Math.PI / 2;
      pts.push(new THREE.Vector3(
        Math.cos(lat) * Math.cos(lonRad) * radius,
        Math.sin(lat) * radius,
        Math.cos(lat) * Math.sin(lonRad) * radius
      ));
    }
    return pts;
  }, [radius, longitude]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}
