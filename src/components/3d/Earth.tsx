'use client';

import { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { Atmosphere } from './Atmosphere';

interface EarthProps {
  /** 地球の回転速度（デフォルト: ゆっくり回転） */
  rotationSpeed?: number;
  /** 地球の半径 */
  radius?: number;
}

/**
 * 地球コンポーネント（テクスチャ付き）
 * 注: 自転はデフォルトでオフ（施設カバレッジとの同期のため）
 */
function EarthWithTexture({ rotationSpeed = 0, radius = 1 }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  
  // drei の useTexture を使用（より安定）
  const texture = useTexture('/assets/textures/earth_daymap.jpg');
  
  // テクスチャの設定
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 16;
    }
  }, [texture]);

  // 毎フレームの更新（地球の自転）- デフォルトは静止
  useFrame(() => {
    if (earthRef.current && rotationSpeed > 0) {
      earthRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <group>
      {/* 地球本体 */}
      <Sphere ref={earthRef} args={[radius, 64, 64]}>
        <meshStandardMaterial
          map={texture}
          metalness={0.0}
          roughness={0.9}
        />
      </Sphere>

      {/* 大気グロー効果 */}
      <Atmosphere radius={radius} />
    </group>
  );
}

/**
 * 地球コンポーネント（フォールバック付き）
 * 注: rotationSpeed=0 で静止（施設やカバレッジと同期するため）
 */
export function Earth({ rotationSpeed = 0, radius = 1 }: EarthProps) {
  return (
    <Suspense fallback={<EarthFallback radius={radius} rotationSpeed={rotationSpeed} />}>
      <EarthWithTexture rotationSpeed={rotationSpeed} radius={radius} />
    </Suspense>
  );
}

/**
 * テクスチャなしの地球（フォールバック用）
 */
export function EarthFallback({ radius = 1, rotationSpeed = 0 }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (earthRef.current && rotationSpeed > 0) {
      earthRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <group>
      <Sphere ref={earthRef} args={[radius, 32, 32]}>
        <meshStandardMaterial
          color="#1a4d8c"
          roughness={0.9}
          metalness={0.0}
        />
      </Sphere>
      <Atmosphere radius={radius} />
    </group>
  );
}
