'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface AtmosphereProps {
  radius?: number;
}

/**
 * 大気グロー効果
 * Fresnel効果を使用して地球の縁を光らせる
 */
export function Atmosphere({ radius = 1 }: AtmosphereProps) {
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // カスタムシェーダーマテリアル
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // カメラからの視線方向
          vec3 viewDirection = normalize(-vPosition);
          
          // Fresnel効果（縁ほど明るく）- 弱めに設定
          float fresnel = 1.0 - dot(viewDirection, vNormal);
          fresnel = pow(fresnel, 4.0);  // 4.0に上げて縁だけに限定
          
          // 大気の色（青みがかった薄い色）
          vec3 atmosphereColor = vec3(0.4, 0.7, 1.0);
          
          // グラデーション適用（弱めに）
          vec3 finalColor = atmosphereColor * fresnel * 0.5;
          float alpha = fresnel * 0.25;  // 透明度を下げる
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh ref={atmosphereRef} scale={[1.08, 1.08, 1.08]}>
      <sphereGeometry args={[radius, 64, 64]} />
      <primitive object={atmosphereMaterial} attach="material" />
    </mesh>
  );
}

/**
 * 外側のグロー効果（より広い範囲の発光）
 */
export function OuterGlow({ radius = 1 }: AtmosphereProps) {
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 glowColor = vec3(0.2, 0.5, 0.9);
          gl_FragColor = vec4(glowColor, intensity * 0.15);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[radius, 32, 32]} />
      <primitive object={glowMaterial} attach="material" />
    </mesh>
  );
}
