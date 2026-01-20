'use client';

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

interface ControlsProps {
  /** カメラ変更時のコールバック */
  onCameraChange?: () => void;
}

/**
 * カメラコントロール
 * マウスで地球を回転・ズームできるようにする
 */
export function Controls({ onCameraChange }: ControlsProps) {
  const { camera } = useThree();

  return (
    <OrbitControls
      // カメラ参照
      camera={camera}
      
      // 回転設定
      enableRotate={true}
      rotateSpeed={0.5}
      
      // ズーム設定
      enableZoom={true}
      zoomSpeed={0.8}
      minDistance={1.5}  // 地球に近づきすぎない
      maxDistance={20}   // 遠くに離れすぎない
      
      // パン（平行移動）は無効化（地球を中心に保つ）
      enablePan={false}
      
      // 極での回転制限（真上・真下からの視点を制限）
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.9}
      
      // ダンピング（慣性）
      enableDamping={true}
      dampingFactor={0.05}
      
      // タッチ操作対応
      touches={{
        ONE: 1, // TOUCH.ROTATE
        TWO: 2, // TOUCH.DOLLY_PAN (ズームのみ)
      }}
      
      // カメラ変更時
      onChange={onCameraChange}
    />
  );
}
