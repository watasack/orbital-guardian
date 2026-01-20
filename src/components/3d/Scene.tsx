'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useState, useCallback } from 'react';

import { Controls } from './Controls';
import { Earth } from './Earth';
import { Lights } from './Lights';
import { Effects } from './Effects';
import { DebrisField, DebrisOrbit } from './Debris';
import { OrbitalRegions, OrbitalRegionRings } from './OrbitalRegions';
import { Facilities } from './Facilities';
import { CoverageLayer } from './CoverageLayer';
import { generateDebrisField } from '@/lib/data/generator';
import type { Debris, Facility } from '@/types';

interface SceneProps {
  className?: string;
  /** 表示するデブリの数 */
  debrisCount?: number;
  /** 軌道帯を表示するか */
  showOrbitalRegions?: boolean;
  /** カバレッジレイヤーを表示するか */
  showCoverageLayer?: boolean;
  /** 施設データ */
  facilities?: Facility[];
  /** デブリ選択時のコールバック */
  onDebrisSelect?: (debris: Debris | null) => void;
  /** 施設選択時のコールバック */
  onFacilitySelect?: (facility: Facility | null) => void;
  /** カメラ移動時のコールバック */
  onCameraMove?: () => void;
}

/**
 * メイン3Dシーンコンポーネント
 * 地球、デブリ、施設などすべての3D要素を含む
 */
export function Scene({ 
  className, 
  debrisCount = 300,
  showOrbitalRegions = true,
  showCoverageLayer = false,
  facilities = [],
  onDebrisSelect,
  onFacilitySelect,
  onCameraMove,
}: SceneProps) {
  // デブリデータを生成（初回のみ）
  const debris = useMemo(() => generateDebrisField(debrisCount), [debrisCount]);
  
  // 選択・ホバー状態
  const [selectedDebris, setSelectedDebris] = useState<Debris | null>(null);
  const [hoveredDebris, setHoveredDebris] = useState<Debris | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // デブリクリック時
  const handleDebrisClick = useCallback((d: Debris) => {
    setSelectedDebris(prev => prev?.id === d.id ? null : d);
    setSelectedFacility(null);
    onDebrisSelect?.(d);
  }, [onDebrisSelect]);

  // デブリホバー時
  const handleDebrisHover = useCallback((d: Debris | null) => {
    setHoveredDebris(d);
  }, []);

  // 施設クリック時
  const handleFacilityClick = useCallback((f: Facility) => {
    setSelectedFacility(prev => prev?.id === f.id ? null : f);
    setSelectedDebris(null);
    onFacilitySelect?.(f);
  }, [onFacilitySelect]);

  return (
    <div className={className}>
      <Canvas
        camera={{
          position: [0, 0, 4],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        {/* 背景色 */}
        <color attach="background" args={['#050510']} />
        
        {/* フォグ（遠くのオブジェクトをフェードアウト） */}
        <fog attach="fog" args={['#050510', 10, 50]} />
        
        <Suspense fallback={null}>
          {/* ライティング */}
          <Lights />
          
          {/* 地球 */}
          <Earth />
          
          {/* カバレッジレイヤー */}
          {showCoverageLayer && facilities.length > 0 && (
            <CoverageLayer 
              facilities={facilities} 
              opacity={0.15}
              animated={true}
            />
          )}
          
          {/* 施設 */}
          {facilities.length > 0 && (
            <Facilities 
              facilities={facilities}
              selectedId={selectedFacility?.id}
              onSelect={handleFacilityClick}
            />
          )}
          
          {/* 軌道帯の可視化 */}
          {showOrbitalRegions && (
            <>
              <OrbitalRegions 
                showRegions={['LEO-Lower', 'LEO-Upper']} 
                opacity={0.05} 
              />
              <OrbitalRegionRings 
                showRegions={['LEO-Lower', 'LEO-Upper', 'GEO']} 
                opacity={0.2} 
              />
            </>
          )}
          
          {/* デブリフィールド */}
          <DebrisField
            debris={debris}
            selectedId={selectedDebris?.id}
            hoveredId={hoveredDebris?.id}
            onDebrisClick={handleDebrisClick}
            onDebrisHover={handleDebrisHover}
          />
          
          {/* 選択中のデブリの軌道線 */}
          {selectedDebris && <DebrisOrbit debris={selectedDebris} />}
          
          {/* ポストプロセス効果 */}
          <Effects />
        </Suspense>
        
        {/* カメラコントロール */}
        <Controls onCameraChange={onCameraMove} />
      </Canvas>
      
      {/* ホバー中のデブリ情報（ツールチップ） */}
      {hoveredDebris && (
        <div className="pointer-events-none absolute left-4 top-20 z-20">
          <div className="glass rounded-lg px-3 py-2 text-sm">
            <p className="font-semibold text-white">{hoveredDebris.name}</p>
            <p className="text-gray-400">危険度: {hoveredDebris.risk.dangerLevel}/5</p>
          </div>
        </div>
      )}
    </div>
  );
}
