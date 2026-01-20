'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

import type { Facility } from '@/types';
import { FACILITY_TYPES } from '@/lib/game/facilityManager';
import { EARTH_RADIUS_KM, SCALE_FACTOR, latLongToCartesian, calculateScaledPosition } from '@/lib/orbit/calculations';

interface FacilitiesProps {
  /** 施設データ */
  facilities: Facility[];
  /** 選択中の施設ID */
  selectedId?: string | null;
  /** 施設選択時のコールバック */
  onSelect?: (facility: Facility) => void;
}

/**
 * 施設の3D表示
 */
export function Facilities({ facilities, selectedId, onSelect }: FacilitiesProps) {
  const groundFacilities = facilities.filter(f => f.location.type === 'ground');
  const spaceFacilities = facilities.filter(f => f.location.type === 'space');
  
  return (
    <group name="facilities">
      {/* 地上施設 */}
      {groundFacilities.map(facility => (
        <GroundFacility
          key={facility.id}
          facility={facility}
          isSelected={selectedId === facility.id}
          onClick={() => onSelect?.(facility)}
        />
      ))}
      
      {/* 宇宙施設 */}
      {spaceFacilities.map(facility => (
        <SpaceFacility
          key={facility.id}
          facility={facility}
          isSelected={selectedId === facility.id}
          onClick={() => onSelect?.(facility)}
        />
      ))}
    </group>
  );
}

/**
 * 地上施設
 */
function GroundFacility({ 
  facility, 
  isSelected,
  onClick 
}: { 
  facility: Facility; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  
  const definition = FACILITY_TYPES[facility.type];
  const isOperational = facility.operational.status === 'operational';
  
  // 位置計算
  const position = useMemo(() => {
    if (facility.location.latitude === undefined || facility.location.longitude === undefined) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    const [x, y, z] = latLongToCartesian(
      facility.location.latitude,
      facility.location.longitude,
      EARTH_RADIUS_KM * SCALE_FACTOR * 1.01 // 地表より少し上
    );
    
    return new THREE.Vector3(x, y, z);
  }, [facility.location.latitude, facility.location.longitude]);
  
  // 監視ビームの方向（上向き）
  const beamDirection = useMemo(() => {
    return position.clone().normalize();
  }, [position]);
  
  // 色の決定
  const color = useMemo(() => {
    if (!isOperational) return '#666666';
    if (isSelected) return '#7c3aed';
    if (definition.monitoring) return '#00d4ff';
    return '#00ff88';
  }, [isOperational, isSelected, definition]);
  
  // アニメーション
  useFrame((state) => {
    if (meshRef.current && isOperational) {
      meshRef.current.rotation.y += 0.01;
    }
    if (beamRef.current && isOperational) {
      const opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });
  
  // 監視範囲の計算
  const beamHeight = useMemo(() => {
    if (!definition.monitoring) return 0;
    return (definition.monitoring.maxAltitude / 1000) * SCALE_FACTOR;
  }, [definition]);
  
  return (
    <group position={position}>
      {/* 施設本体 */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <octahedronGeometry args={[0.015, 0]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isOperational ? 0.5 : 0.1}
        />
      </mesh>
      
      {/* 監視ビーム（運用中の監視施設のみ） */}
      {isOperational && definition.monitoring && (
        <mesh
          ref={beamRef}
          position={beamDirection.clone().multiplyScalar(beamHeight / 2)}
          lookAt={beamDirection.clone().multiplyScalar(beamHeight)}
        >
          <coneGeometry args={[0.1, beamHeight, 16, 1, true]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* ラベル */}
      {isSelected && (
        <Html
          position={[0, 0.05, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="rounded bg-black/80 px-2 py-1 text-xs text-white whitespace-nowrap">
            {facility.name}
            <br />
            <span className="text-gray-400">
              {isOperational ? '稼働中' : '建設中'}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * 宇宙施設（衛星）
 */
function SpaceFacility({ 
  facility, 
  isSelected,
  onClick 
}: { 
  facility: Facility; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  const definition = FACILITY_TYPES[facility.type];
  const isOperational = facility.operational.status === 'operational';
  
  // 軌道位置の計算
  const orbitRadius = useMemo(() => {
    if (!facility.location.orbit) return 1;
    return facility.location.orbit.semiMajorAxis * SCALE_FACTOR;
  }, [facility.location.orbit]);
  
  // 初期位相
  const initialPhase = useMemo(() => {
    if (!facility.location.orbit) return 0;
    return (facility.location.orbit.meanAnomaly * Math.PI) / 180;
  }, [facility.location.orbit]);
  
  // 軌道傾斜角
  const inclination = useMemo(() => {
    if (!facility.location.orbit) return 0;
    return (facility.location.orbit.inclination * Math.PI) / 180;
  }, [facility.location.orbit]);
  
  // 色の決定
  const color = useMemo(() => {
    if (!isOperational) return '#666666';
    if (isSelected) return '#7c3aed';
    if (definition.removal) return '#00ff88';
    return '#00d4ff';
  }, [isOperational, isSelected, definition]);
  
  // 軌道運動
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      const orbitalPeriod = 10 + orbitRadius * 5; // 高度に応じた周期
      const angle = initialPhase + (time * 2 * Math.PI) / orbitalPeriod;
      
      // 軌道面内での位置
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      
      // 軌道傾斜角を適用
      groupRef.current.position.x = x;
      groupRef.current.position.y = z * Math.sin(inclination);
      groupRef.current.position.z = z * Math.cos(inclination);
    }
    
    if (meshRef.current && isOperational) {
      meshRef.current.rotation.y += 0.02;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* 衛星本体 */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <boxGeometry args={[0.02, 0.01, 0.02]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isOperational ? 0.5 : 0.1}
        />
      </mesh>
      
      {/* ソーラーパネル */}
      <mesh position={[0.025, 0, 0]}>
        <boxGeometry args={[0.03, 0.002, 0.015]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      <mesh position={[-0.025, 0, 0]}>
        <boxGeometry args={[0.03, 0.002, 0.015]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      
      {/* 軌道リング（選択時） */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2 - inclination, 0, 0]}>
          <ringGeometry args={[orbitRadius - 0.002, orbitRadius + 0.002, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* ラベル */}
      {isSelected && (
        <Html
          position={[0, 0.04, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="rounded bg-black/80 px-2 py-1 text-xs text-white whitespace-nowrap">
            {facility.name}
            <br />
            <span className="text-gray-400">
              {isOperational ? '稼働中' : '建設中'}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * 施設の監視範囲を可視化
 */
export function FacilityCoverage({ 
  facilities,
  opacity = 0.1
}: { 
  facilities: Facility[];
  opacity?: number;
}) {
  const operationalFacilities = facilities.filter(
    f => f.operational.status === 'operational' && f.capabilities.monitoringRange
  );
  
  return (
    <group name="facility-coverage">
      {operationalFacilities.map(facility => {
        const range = facility.capabilities.monitoringRange!;
        const innerRadius = (EARTH_RADIUS_KM + range.minAltitude) * SCALE_FACTOR;
        const outerRadius = (EARTH_RADIUS_KM + range.maxAltitude) * SCALE_FACTOR;
        
        return (
          <mesh key={facility.id}>
            <sphereGeometry args={[outerRadius, 32, 16]} />
            <meshBasicMaterial 
              color="#00d4ff"
              transparent
              opacity={opacity}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
