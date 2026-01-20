'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { Debris as DebrisType, DangerLevel } from '@/types';
import { calculateScaledPosition } from '@/lib/orbit/calculations';

interface DebrisFieldProps {
  /** デブリデータの配列 */
  debris: DebrisType[];
  /** 選択中のデブリID */
  selectedId?: string | null;
  /** ホバー中のデブリID */
  hoveredId?: string | null;
  /** デブリクリック時のコールバック */
  onDebrisClick?: (debris: DebrisType) => void;
  /** デブリホバー時のコールバック */
  onDebrisHover?: (debris: DebrisType | null) => void;
  /** 時間（軌道位置の計算用） */
  time?: number;
  /** デブリの基本サイズ */
  baseSize?: number;
}

/**
 * 危険度に応じた色を取得
 */
function getDangerColor(level: DangerLevel): THREE.Color {
  const colors: Record<DangerLevel, string> = {
    1: '#10b981', // 緑（安全）
    2: '#84cc16', // ライム
    3: '#eab308', // 黄色
    4: '#f97316', // オレンジ
    5: '#ef4444', // 赤（危険）
  };
  return new THREE.Color(colors[level]);
}

/**
 * デブリフィールドコンポーネント
 * InstancedMeshを使用して大量のデブリを効率的に描画
 */
export function DebrisField({
  debris,
  selectedId,
  hoveredId,
  onDebrisClick,
  onDebrisHover,
  time = 0,
  baseSize = 0.01,
}: DebrisFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { raycaster, camera, pointer } = useThree();
  
  // 一時的なオブジェクト（毎フレーム使い回す）
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // デブリの位置と色を更新
  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;

    debris.forEach((d, i) => {
      // 位置を計算
      const position = calculateScaledPosition(d.orbit, time);
      tempObject.position.set(...position);

      // サイズを設定（デブリのサイズに応じて）
      const sizeMultiplier = d.physical.size === 'large' ? 3 : d.physical.size === 'medium' ? 2 : 1;
      const scale = baseSize * sizeMultiplier;
      
      // 選択/ホバー時は大きく表示
      const isSelected = d.id === selectedId;
      const isHovered = d.id === hoveredId;
      const finalScale = scale * (isSelected ? 2 : isHovered ? 1.5 : 1);
      
      tempObject.scale.setScalar(finalScale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      // 色を設定
      const color = getDangerColor(d.risk.dangerLevel);
      if (isSelected) {
        tempColor.set('#ffffff');
      } else if (isHovered) {
        tempColor.copy(color).multiplyScalar(1.5);
      } else {
        tempColor.copy(color);
      }
      mesh.setColorAt(i, tempColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [debris, time, selectedId, hoveredId, baseSize, tempObject, tempColor]);

  // レイキャストによるホバー検出
  const [localHoveredIndex, setLocalHoveredIndex] = useState<number | null>(null);

  useFrame(() => {
    if (!meshRef.current || !onDebrisHover) return;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(meshRef.current);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const index = intersects[0].instanceId;
      if (index !== localHoveredIndex) {
        setLocalHoveredIndex(index);
        onDebrisHover(debris[index]);
      }
    } else if (localHoveredIndex !== null) {
      setLocalHoveredIndex(null);
      onDebrisHover(null);
    }
  });

  // クリックハンドラ
  const handleClick = (event: THREE.Event) => {
    if (!onDebrisClick) return;
    
    // @ts-ignore - Three.jsのイベント型の問題
    const instanceId = event.instanceId;
    if (instanceId !== undefined && debris[instanceId]) {
      onDebrisClick(debris[instanceId]);
    }
  };

  if (debris.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, debris.length]}
      onClick={handleClick}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        vertexColors
        emissive="#ffffff"
        emissiveIntensity={0.2}
        roughness={0.5}
        metalness={0.3}
      />
    </instancedMesh>
  );
}

/**
 * 単一のデブリを表示（選択時の詳細表示用）
 */
export function DebrisDetail({ debris, time = 0 }: { debris: DebrisType; time?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useMemo(() => calculateScaledPosition(debris.orbit, time), [debris, time]);
  const color = useMemo(() => getDangerColor(debris.risk.dangerLevel), [debris.risk.dangerLevel]);

  // パルスアニメーション
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 0.03 + Math.sin(clock.elapsedTime * 3) * 0.01;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

/**
 * デブリの軌道線を表示
 */
export function DebrisOrbit({ debris }: { debris: DebrisType }) {
  const points = useMemo(() => {
    const orbitPoints: THREE.Vector3[] = [];
    const numPoints = 100;
    const period = 2 * Math.PI * Math.sqrt(Math.pow(debris.orbit.semiMajorAxis, 3) / 398600.4418);

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * period;
      const pos = calculateScaledPosition(debris.orbit, t);
      orbitPoints.push(new THREE.Vector3(...pos));
    }

    return orbitPoints;
  }, [debris]);

  const color = useMemo(() => getDangerColor(debris.risk.dangerLevel), [debris.risk.dangerLevel]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </line>
  );
}
