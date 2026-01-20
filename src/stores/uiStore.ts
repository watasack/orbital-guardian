/**
 * UI状態管理ストア
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Debris, Facility, CameraState, SelectionState } from '@/types';

type ModalType = 'settings' | 'help' | 'optimization' | 'build' | 'event' | 'gameOver' | null;
type ViewMode = 'overview' | 'monitor' | 'build' | 'remove' | 'optimize';

interface UIState {
  // 選択状態
  selection: SelectionState;
  
  // カメラ状態
  camera: CameraState;
  
  // 表示設定
  showOrbitalRegions: boolean;
  showDebris: boolean;
  showFacilities: boolean;
  showCoverage: boolean;
  showGrid: boolean;
  
  // 品質設定
  qualityLevel: 'low' | 'medium' | 'high';
  
  // モーダル
  activeModal: ModalType;
  
  // ビューモード
  viewMode: ViewMode;
  
  // ホバー中のオブジェクト
  hoveredDebris: Debris | null;
  hoveredFacility: Facility | null;
  
  // サイドパネル
  isSidePanelOpen: boolean;
  
  // アクション
  selectDebris: (debris: Debris | null) => void;
  selectFacility: (facility: Facility | null) => void;
  clearSelection: () => void;
  
  setHoveredDebris: (debris: Debris | null) => void;
  setHoveredFacility: (facility: Facility | null) => void;
  
  setViewMode: (mode: ViewMode) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  
  toggleOrbitalRegions: () => void;
  toggleDebris: () => void;
  toggleFacilities: () => void;
  toggleCoverage: () => void;
  toggleGrid: () => void;
  toggleSidePanel: () => void;
  
  setQualityLevel: (level: 'low' | 'medium' | 'high') => void;
  
  setCameraState: (state: Partial<CameraState>) => void;
}

const initialCameraState: CameraState = {
  position: [0, 0, 4],
  target: [0, 0, 0],
  zoom: 1,
};

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // 初期状態
      selection: { type: null, id: null },
      camera: initialCameraState,
      showOrbitalRegions: true,
      showDebris: true,
      showFacilities: true,
      showCoverage: false,
      showGrid: false,
      qualityLevel: 'medium',
      activeModal: null,
      viewMode: 'overview',
      hoveredDebris: null,
      hoveredFacility: null,
      isSidePanelOpen: true,

      // 選択アクション
      selectDebris: (debris) => {
        set({
          selection: debris
            ? { type: 'debris', id: debris.id }
            : { type: null, id: null },
        });
      },

      selectFacility: (facility) => {
        set({
          selection: facility
            ? { type: 'facility', id: facility.id }
            : { type: null, id: null },
        });
      },

      clearSelection: () => {
        set({ selection: { type: null, id: null } });
      },

      // ホバーアクション
      setHoveredDebris: (debris) => {
        set({ hoveredDebris: debris });
      },

      setHoveredFacility: (facility) => {
        set({ hoveredFacility: facility });
      },

      // ビューモード
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      // モーダル
      openModal: (modal) => {
        set({ activeModal: modal });
      },

      closeModal: () => {
        set({ activeModal: null });
      },

      // 表示トグル
      toggleOrbitalRegions: () => {
        set((state) => ({ showOrbitalRegions: !state.showOrbitalRegions }));
      },

      toggleDebris: () => {
        set((state) => ({ showDebris: !state.showDebris }));
      },

      toggleFacilities: () => {
        set((state) => ({ showFacilities: !state.showFacilities }));
      },

      toggleCoverage: () => {
        set((state) => ({ showCoverage: !state.showCoverage }));
      },

      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      toggleSidePanel: () => {
        set((state) => ({ isSidePanelOpen: !state.isSidePanelOpen }));
      },

      // 品質設定
      setQualityLevel: (level) => {
        set({ qualityLevel: level });
      },

      // カメラ状態
      setCameraState: (newState) => {
        set((state) => ({
          camera: { ...state.camera, ...newState },
        }));
      },
    }),
    { name: 'UIStore' }
  )
);
