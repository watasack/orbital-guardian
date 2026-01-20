/**
 * ゲーム状態管理ストア
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { 
  Debris, 
  Facility, 
  GameResources, 
  GameProgress, 
  GameStatistics,
  Difficulty,
  GamePhase,
  GameEventLog,
} from '@/types';
import { generateDebrisField, getDebrisCountForDifficulty } from '@/lib/data/generator';

interface GameState {
  // ゲーム進行状況
  progress: GameProgress;
  
  // リソース
  resources: GameResources;
  
  // エンティティ
  debris: Debris[];
  facilities: Facility[];
  
  // 統計
  statistics: GameStatistics;
  
  // イベントログ
  eventLog: GameEventLog[];
  
  // ゲーム設定
  difficulty: Difficulty;
  isGameStarted: boolean;
  isGameOver: boolean;
  
  // アクション
  startGame: (difficulty: Difficulty) => void;
  endTurn: () => void;
  setPhase: (phase: GamePhase) => void;
  
  // デブリ操作
  addDebris: (debris: Debris[]) => void;
  removeDebris: (debrisIds: string[]) => void;
  
  // 施設操作
  addFacility: (facility: Facility) => void;
  removeFacility: (facilityId: string) => void;
  
  // リソース操作
  spendBudget: (amount: number) => boolean;
  addBudget: (amount: number) => void;
  
  // 統計更新
  recordDebrisRemoved: (count: number) => void;
  recordCollision: () => void;
  
  // ゲームリセット
  resetGame: () => void;
}

const initialResources: GameResources = {
  budget: 1000,
  annualBudget: 500,
  politicalCapital: 50,
  techPoints: 0,
};

const initialProgress: GameProgress = {
  currentTurn: 1,
  maxTurns: 120,
  phase: 'planning',
};

const initialStatistics: GameStatistics = {
  totalDebrisRemoved: 0,
  collisionsAvoided: 0,
  collisionsOccurred: 0,
  coverageHistory: [],
  budgetHistory: [],
};

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        progress: initialProgress,
        resources: initialResources,
        debris: [],
        facilities: [],
        statistics: initialStatistics,
        eventLog: [],
        difficulty: 'standard',
        isGameStarted: false,
        isGameOver: false,

        // ゲーム開始
        startGame: (difficulty) => {
          const debrisCount = getDebrisCountForDifficulty(difficulty);
          const debris = generateDebrisField(debrisCount);
          
          // 難易度に応じた初期リソース
          const budgetMultiplier = {
            beginner: 1.5,
            standard: 1.0,
            advanced: 0.8,
            expert: 0.6,
          }[difficulty];

          set({
            difficulty,
            isGameStarted: true,
            isGameOver: false,
            debris,
            facilities: [],
            progress: { ...initialProgress },
            resources: {
              ...initialResources,
              budget: Math.floor(initialResources.budget * budgetMultiplier),
              annualBudget: Math.floor(initialResources.annualBudget * budgetMultiplier),
            },
            statistics: { ...initialStatistics },
            eventLog: [],
          });
        },

        // ターン終了
        endTurn: () => {
          const state = get();
          const newTurn = state.progress.currentTurn + 1;
          
          // 年間予算の追加（12ターンごと）
          let newBudget = state.resources.budget;
          if (newTurn % 12 === 1) {
            newBudget += state.resources.annualBudget;
          }
          
          // 施設の維持費を差し引く
          const maintenanceCost = state.facilities.reduce(
            (sum, f) => sum + f.cost.monthly,
            0
          );
          newBudget -= maintenanceCost;
          
          // 統計を記録
          const newCoverageHistory = [
            ...state.statistics.coverageHistory,
            { turn: state.progress.currentTurn, coverage: calculateCoverage(state) },
          ];
          const newBudgetHistory = [
            ...state.statistics.budgetHistory,
            { turn: state.progress.currentTurn, budget: newBudget },
          ];
          
          // ゲーム終了判定
          const isGameOver = newTurn > state.progress.maxTurns || newBudget < 0;
          
          set({
            progress: {
              ...state.progress,
              currentTurn: newTurn,
              phase: 'planning',
            },
            resources: {
              ...state.resources,
              budget: Math.max(0, newBudget),
            },
            statistics: {
              ...state.statistics,
              coverageHistory: newCoverageHistory,
              budgetHistory: newBudgetHistory,
            },
            isGameOver,
          });
        },

        // フェーズ変更
        setPhase: (phase) => {
          set((state) => ({
            progress: { ...state.progress, phase },
          }));
        },

        // デブリ追加
        addDebris: (newDebris) => {
          set((state) => ({
            debris: [...state.debris, ...newDebris],
          }));
        },

        // デブリ除去
        removeDebris: (debrisIds) => {
          set((state) => ({
            debris: state.debris.filter((d) => !debrisIds.includes(d.id)),
          }));
        },

        // 施設追加
        addFacility: (facility) => {
          set((state) => ({
            facilities: [...state.facilities, facility],
          }));
        },

        // 施設削除
        removeFacility: (facilityId) => {
          set((state) => ({
            facilities: state.facilities.filter((f) => f.id !== facilityId),
          }));
        },

        // 予算消費
        spendBudget: (amount) => {
          const state = get();
          if (state.resources.budget < amount) {
            return false;
          }
          set({
            resources: {
              ...state.resources,
              budget: state.resources.budget - amount,
            },
          });
          return true;
        },

        // 予算追加
        addBudget: (amount) => {
          set((state) => ({
            resources: {
              ...state.resources,
              budget: state.resources.budget + amount,
            },
          }));
        },

        // デブリ除去記録
        recordDebrisRemoved: (count) => {
          set((state) => ({
            statistics: {
              ...state.statistics,
              totalDebrisRemoved: state.statistics.totalDebrisRemoved + count,
            },
          }));
        },

        // 衝突記録
        recordCollision: () => {
          set((state) => ({
            statistics: {
              ...state.statistics,
              collisionsOccurred: state.statistics.collisionsOccurred + 1,
            },
          }));
        },

        // ゲームリセット
        resetGame: () => {
          set({
            progress: initialProgress,
            resources: initialResources,
            debris: [],
            facilities: [],
            statistics: initialStatistics,
            eventLog: [],
            isGameStarted: false,
            isGameOver: false,
          });
        },
      }),
      {
        name: 'orbital-guardian-game',
        partialize: (state) => ({
          // 永続化する状態を選択
          progress: state.progress,
          resources: state.resources,
          debris: state.debris,
          facilities: state.facilities,
          statistics: state.statistics,
          difficulty: state.difficulty,
          isGameStarted: state.isGameStarted,
        }),
      }
    ),
    { name: 'GameStore' }
  )
);

/**
 * カバー率を計算（簡易版）
 */
function calculateCoverage(state: GameState): number {
  if (state.debris.length === 0) return 100;
  
  const trackedDebris = state.debris.filter(
    (d) => d.risk.trackedBy.length > 0
  ).length;
  
  return Math.round((trackedDebris / state.debris.length) * 100);
}
