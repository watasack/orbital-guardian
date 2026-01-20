'use client';

import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

interface EffectsProps {
  /** エフェクトを有効にするか */
  enabled?: boolean;
  /** 品質設定 */
  quality?: 'low' | 'medium' | 'high';
}

/**
 * ポストプロセス効果
 * Bloom、色収差、ビネットなどの視覚効果を適用
 */
export function Effects({ enabled = true, quality = 'medium' }: EffectsProps) {
  if (!enabled) return null;

  // 品質に応じた設定
  const bloomSettings = {
    low: { intensity: 0.5, luminanceThreshold: 0.9, levels: 3 },
    medium: { intensity: 0.8, luminanceThreshold: 0.8, levels: 5 },
    high: { intensity: 1.0, luminanceThreshold: 0.7, levels: 7 },
  }[quality];

  return (
    <EffectComposer>
      {/* Bloom（発光効果） */}
      <Bloom
        intensity={bloomSettings.intensity}
        luminanceThreshold={bloomSettings.luminanceThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur={true}
        levels={bloomSettings.levels}
      />
      
      {/* 色収差（わずかな色ズレで高級感） */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(0.0005, 0.0005)}
        radialModulation={true}
        modulationOffset={0.5}
      />
      
      {/* ビネット（画面端を暗く） */}
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
