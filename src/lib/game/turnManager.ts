/**
 * ターン進行管理
 * ゲームのターン制システムを管理する
 */

import type { GamePhase, Debris, Facility, GameResources } from '@/types';

/**
 * ターンの各フェーズ
 */
export const PHASES: GamePhase[] = ['planning', 'execution', 'event', 'summary'];

/**
 * フェーズの表示名
 */
export const PHASE_NAMES: Record<GamePhase, string> = {
  planning: '計画フェーズ',
  execution: '実行フェーズ',
  event: 'イベントフェーズ',
  summary: 'サマリーフェーズ',
};

/**
 * フェーズの説明
 */
export const PHASE_DESCRIPTIONS: Record<GamePhase, string> = {
  planning: '施設の建設・配置、除去対象の選択を行います',
  execution: 'アクションが実行されます',
  event: 'ランダムイベントが発生する可能性があります',
  summary: 'ターンの結果を確認します',
};

/**
 * 次のフェーズを取得
 */
export function getNextPhase(currentPhase: GamePhase): GamePhase | null {
  const currentIndex = PHASES.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === PHASES.length - 1) {
    return null; // ターン終了
  }
  return PHASES[currentIndex + 1];
}

/**
 * ターン終了時の処理結果
 */
export interface TurnEndResult {
  /** 新しいターン番号 */
  newTurn: number;
  /** 予算変更 */
  budgetChange: number;
  /** 維持費 */
  maintenanceCost: number;
  /** 年間予算追加（12ターンごと） */
  annualBudgetAdded: boolean;
  /** 除去されたデブリ */
  removedDebris: string[];
  /** 新たに発生したデブリ */
  newDebris: Debris[];
  /** 衝突が発生したか */
  collisionOccurred: boolean;
  /** メッセージ */
  messages: string[];
}

/**
 * ターン終了処理
 */
export function processTurnEnd(
  currentTurn: number,
  resources: GameResources,
  facilities: Facility[],
  debris: Debris[]
): TurnEndResult {
  const newTurn = currentTurn + 1;
  const messages: string[] = [];
  
  // 維持費の計算
  const maintenanceCost = facilities.reduce(
    (sum, f) => sum + (f.operational.status === 'operational' ? f.cost.monthly : 0),
    0
  );
  
  // 年間予算の追加（12ターンごと = 1年）
  const annualBudgetAdded = newTurn % 12 === 1 && newTurn > 1;
  const annualBudget = annualBudgetAdded ? resources.annualBudget : 0;
  
  // 予算変更
  const budgetChange = annualBudget - maintenanceCost;
  
  if (annualBudgetAdded) {
    messages.push(`年間予算 $${resources.annualBudget}M が追加されました`);
  }
  
  if (maintenanceCost > 0) {
    messages.push(`施設維持費 $${maintenanceCost}M が差し引かれました`);
  }
  
  // 除去衛星による自動除去処理
  const removedDebris: string[] = [];
  const removalFacilities = facilities.filter(
    f => f.capabilities.removalCapacity && f.operational.status === 'operational'
  );
  
  // 簡易的な除去ロジック（危険度の高いデブリを優先）
  let totalRemovalCapacity = removalFacilities.reduce(
    (sum, f) => sum + (f.capabilities.removalCapacity || 0) / 12, // 月間除去数
    0
  );
  
  const sortedDebris = [...debris]
    .filter(d => d.status === 'active')
    .sort((a, b) => b.risk.dangerLevel - a.risk.dangerLevel);
  
  for (const d of sortedDebris) {
    if (totalRemovalCapacity <= 0) break;
    if (d.risk.trackedBy.length > 0) { // 追跡されているデブリのみ除去可能
      removedDebris.push(d.id);
      totalRemovalCapacity -= 1;
    }
  }
  
  if (removedDebris.length > 0) {
    messages.push(`${removedDebris.length}個のデブリを除去しました`);
  }
  
  // 衝突判定（簡易版：確率ベース）
  const activeDebrisCount = debris.filter(d => d.status === 'active').length;
  const collisionProbability = Math.min(0.1, activeDebrisCount * 0.00001);
  const collisionOccurred = Math.random() < collisionProbability;
  
  // 衝突によるデブリ発生
  const newDebris: Debris[] = [];
  if (collisionOccurred) {
    messages.push('⚠️ 衝突事故が発生しました！新たなデブリが発生しています');
    // 衝突によるデブリ生成は別途処理
  }
  
  return {
    newTurn,
    budgetChange,
    maintenanceCost,
    annualBudgetAdded,
    removedDebris,
    newDebris,
    collisionOccurred,
    messages,
  };
}

/**
 * ゲーム終了条件をチェック
 */
export interface GameEndCondition {
  isGameOver: boolean;
  isVictory: boolean;
  reason: string;
}

export function checkGameEndCondition(
  currentTurn: number,
  maxTurns: number,
  budget: number,
  collisionsOccurred: number,
  debrisCount: number
): GameEndCondition {
  // 敗北条件
  if (budget < 0) {
    return {
      isGameOver: true,
      isVictory: false,
      reason: '予算が枯渇しました',
    };
  }
  
  if (collisionsOccurred >= 3) {
    return {
      isGameOver: true,
      isVictory: false,
      reason: '重大な衝突事故が多発しました（ケスラーシンドローム）',
    };
  }
  
  // 勝利条件
  if (currentTurn >= maxTurns) {
    return {
      isGameOver: true,
      isVictory: true,
      reason: '2年間、地球軌道を守り抜きました！',
    };
  }
  
  // ゲーム継続
  return {
    isGameOver: false,
    isVictory: false,
    reason: '',
  };
}

/**
 * スコアを計算
 */
export function calculateScore(
  turn: number,
  debrisRemoved: number,
  collisionsAvoided: number,
  collisionsOccurred: number,
  remainingBudget: number,
  facilitiesBuilt: number
): number {
  let score = 0;
  
  // 基本スコア（生き残ったターン数）
  score += turn * 10;
  
  // デブリ除去ボーナス
  score += debrisRemoved * 100;
  
  // 衝突回避ボーナス
  score += collisionsAvoided * 500;
  
  // 衝突ペナルティ
  score -= collisionsOccurred * 2000;
  
  // 残り予算ボーナス
  score += Math.floor(remainingBudget / 10);
  
  // 施設建設ボーナス
  score += facilitiesBuilt * 50;
  
  return Math.max(0, score);
}
