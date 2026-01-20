'use client';

import { useRef } from 'react';
import { DirectionalLight } from 'three';

/**
 * シーンのライティング設定
 * 太陽光をシミュレートする指向性ライトを中心に構成
 */
export function Lights() {
  const directionalLightRef = useRef<DirectionalLight>(null);

  return (
    <>
      {/* 環境光（全体をうっすら照らす） */}
      <ambientLight intensity={0.1} color="#4a5568" />
      
      {/* 太陽光（メインライト） */}
      <directionalLight
        ref={directionalLightRef}
        position={[5, 3, 5]}
        intensity={2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* 補助光（地球の暗い側をわずかに照らす） */}
      <directionalLight
        position={[-5, -2, -5]}
        intensity={0.15}
        color="#1e3a5f"
      />
      
      {/* 上からの微弱な光（宇宙からの散乱光をシミュレート） */}
      <hemisphereLight
        args={['#1e3a5f', '#0a0a1a', 0.3]}
      />
    </>
  );
}
