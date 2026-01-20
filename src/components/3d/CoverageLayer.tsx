'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { Facility } from '@/types';
import { FACILITY_TYPES } from '@/lib/game/facilityManager';
import { EARTH_RADIUS_KM, SCALE_FACTOR, latLongToCartesian } from '@/lib/orbit/calculations';

interface CoverageLayerProps {
  /** 施設データ */
  facilities: Facility[];
  /** 不透明度 */
  opacity?: number;
  /** アニメーション有効 */
  animated?: boolean;
}

/**
 * 施設のカバレッジ範囲を可視化するレイヤー
 * 地上施設：地球表面上に円形エリア
 * 宇宙施設：軌道上にカバレッジ球
 */
export function CoverageLayer({ 
  facilities, 
  opacity = 0.15,
  animated = true 
}: CoverageLayerProps) {
  const operationalFacilities = facilities.filter(
    f => f.operational.status === 'operational'
  );
  
  const groundFacilities = operationalFacilities.filter(f => f.location.type === 'ground');
  const spaceFacilities = operationalFacilities.filter(f => f.location.type === 'space');
  
  return (
    <group name="coverage-layer">
      {/* 地上施設のカバレッジ */}
      {groundFacilities.map(facility => (
        <GroundCoverage 
          key={facility.id} 
          facility={facility} 
          opacity={opacity}
          animated={animated}
        />
      ))}
      
      {/* 宇宙施設のカバレッジ */}
      {spaceFacilities.map(facility => (
        <SpaceCoverage 
          key={facility.id} 
          facility={facility} 
          opacity={opacity}
          animated={animated}
        />
      ))}
      
      {/* カバレッジ境界リング */}
      <CoverageBoundaryRings facilities={operationalFacilities} />
    </group>
  );
}

/**
 * 地上施設のカバレッジ（ドーム型 - より現実的）
 * 地上レーダーは施設上空を半球状にスキャンする
 */
function GroundCoverage({ 
  facility, 
  opacity,
  animated
}: { 
  facility: Facility; 
  opacity: number;
  animated: boolean;
}) {
  const domeRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  const definition = FACILITY_TYPES[facility.type];
  
  // 位置計算
  const { position, normal } = useMemo(() => {
    if (facility.location.latitude === undefined || facility.location.longitude === undefined) {
      return { 
        position: new THREE.Vector3(0, 0, 0), 
        normal: new THREE.Vector3(0, 1, 0) 
      };
    }
    
    const earthRadius = EARTH_RADIUS_KM * SCALE_FACTOR;
    const [x, y, z] = latLongToCartesian(
      facility.location.latitude,
      facility.location.longitude,
      earthRadius
    );
    
    const pos = new THREE.Vector3(x, y, z);
    const norm = pos.clone().normalize();
    
    return { position: pos, normal: norm };
  }, [facility.location.latitude, facility.location.longitude]);
  
  // カバレッジ範囲の計算（ドーム半径 = 最大監視高度）
  const { domeRadius, innerRadius, outerRadius } = useMemo(() => {
    if (!definition.monitoring) {
      return { domeRadius: 0, innerRadius: 0, outerRadius: 0 };
    }
    
    // 監視範囲の高度（km → スケール済み単位）
    const maxAltitudeKm = definition.monitoring.maxAltitude;
    const minAltitudeKm = definition.monitoring.minAltitude;
    
    // ドーム半径 = 最大監視高度
    const outer = maxAltitudeKm * SCALE_FACTOR;
    const inner = minAltitudeKm * SCALE_FACTOR;
    
    return { 
      domeRadius: outer, 
      innerRadius: inner,
      outerRadius: outer 
    };
  }, [definition]);
  
  // カバレッジ色
  const color = useMemo(() => {
    return '#00d4ff'; // シアン
  }, []);
  
  // アニメーション
  useFrame((state) => {
    if (!animated) return;
    
    if (domeRef.current) {
      const material = domeRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.5;
      material.opacity = opacity * (0.5 + pulse * 0.5);
    }
  });
  
  if (domeRadius === 0) return null;
  
  // 向きを計算（法線方向に向ける）
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    return q;
  }, [normal]);
  
  return (
    <group position={position} quaternion={quaternion}>
      {/* カバレッジドーム（半球 - 上空を覆う） */}
      <mesh ref={domeRef}>
        <sphereGeometry args={[domeRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* 内側の境界（最小監視高度） */}
      {innerRadius > 0 && (
        <mesh>
          <sphereGeometry args={[innerRadius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity * 0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* 地表のカバレッジ円（施設位置） */}
      <mesh ref={ringRef} position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.05, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* ドーム境界のリング（水平面との交線） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[domeRadius - 0.003, domeRadius + 0.003, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * 宇宙施設のカバレッジ（球状の監視範囲）
 */
function SpaceCoverage({ 
  facility, 
  opacity,
  animated
}: { 
  facility: Facility; 
  opacity: number;
  animated: boolean;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const definition = FACILITY_TYPES[facility.type];
  
  // 軌道パラメータ
  const { orbitRadius, inclination, initialPhase } = useMemo(() => {
    if (!facility.location.orbit) {
      return { orbitRadius: 1, inclination: 0, initialPhase: 0 };
    }
    
    return {
      orbitRadius: facility.location.orbit.semiMajorAxis * SCALE_FACTOR,
      inclination: (facility.location.orbit.inclination * Math.PI) / 180,
      initialPhase: (facility.location.orbit.meanAnomaly * Math.PI) / 180,
    };
  }, [facility.location.orbit]);
  
  // カバレッジ半径
  const coverageRadius = useMemo(() => {
    if (!definition.monitoring) return 0.1;
    
    // 監視範囲を球の半径として表現
    const range = definition.monitoring.maxAltitude / 1000 * SCALE_FACTOR;
    return Math.min(range, 0.5); // 最大0.5に制限
  }, [definition]);
  
  // カバレッジ色
  const color = useMemo(() => {
    if (definition.removal) return '#00ff88'; // 緑（除去衛星）
    return '#00d4ff'; // シアン（監視衛星）
  }, [definition]);
  
  // 軌道運動とアニメーション
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      const orbitalPeriod = 10 + orbitRadius * 5;
      const angle = initialPhase + (time * 2 * Math.PI) / orbitalPeriod;
      
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      
      groupRef.current.position.x = x;
      groupRef.current.position.y = z * Math.sin(inclination);
      groupRef.current.position.z = z * Math.cos(inclination);
    }
    
    if (animated && sphereRef.current) {
      const material = sphereRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
      material.opacity = opacity * (0.3 + pulse * 0.7);
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* カバレッジ球 */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[coverageRadius, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      
      {/* カバレッジ境界リング */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[coverageRadius - 0.005, coverageRadius + 0.005, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * カバレッジ境界を示すリング（高度帯）
 */
function CoverageBoundaryRings({ facilities }: { facilities: Facility[] }) {
  // 監視範囲の最大高度を取得
  const maxAltitudes = useMemo(() => {
    const altitudes = new Set<number>();
    
    facilities.forEach(f => {
      const def = FACILITY_TYPES[f.type];
      if (def.monitoring) {
        altitudes.add(def.monitoring.maxAltitude);
      }
    });
    
    return Array.from(altitudes);
  }, [facilities]);
  
  if (maxAltitudes.length === 0) return null;
  
  return (
    <group>
      {maxAltitudes.map((altitude, index) => {
        const radius = (EARTH_RADIUS_KM + altitude) * SCALE_FACTOR;
        
        return (
          <mesh 
            key={altitude} 
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[radius - 0.002, radius + 0.002, 128]} />
            <meshBasicMaterial
              color="#00d4ff"
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * カバレッジのヒートマップ（地球表面のカバー率を可視化）
 */
export function CoverageHeatmap({ 
  facilities,
  resolution = 32 
}: { 
  facilities: Facility[];
  resolution?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // カバレッジを計算してテクスチャ生成
  const texture = useMemo(() => {
    const size = resolution;
    const data = new Uint8Array(size * size * 4);
    
    // 各グリッドセルでカバレッジを計算
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const lat = ((y / size) - 0.5) * 180;
        const lon = ((x / size) - 0.5) * 360;
        
        // この位置をカバーする施設があるかチェック
        let covered = false;
        for (const f of facilities) {
          if (f.operational.status !== 'operational') continue;
          if (f.location.type !== 'ground') continue;
          
          const fLat = f.location.latitude || 0;
          const fLon = f.location.longitude || 0;
          
          // 簡易的な距離計算
          const dLat = lat - fLat;
          const dLon = lon - fLon;
          const dist = Math.sqrt(dLat * dLat + dLon * dLon);
          
          // 施設の監視範囲内かチェック（約30度の範囲）
          if (dist < 30) {
            covered = true;
            break;
          }
        }
        
        const i = (y * size + x) * 4;
        if (covered) {
          // カバー済み：シアン
          data[i] = 0;
          data[i + 1] = 212;
          data[i + 2] = 255;
          data[i + 3] = 80;
        } else {
          // 未カバー：透明
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
        }
      }
    }
    
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }, [facilities, resolution]);
  
  const earthRadius = EARTH_RADIUS_KM * SCALE_FACTOR;
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[earthRadius * 1.001, 64, 32]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
