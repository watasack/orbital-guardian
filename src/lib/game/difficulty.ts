/**
 * 難易度設定
 * チュートリアルと通常ゲームで異なる難易度を提供
 */

export type DifficultyLevel = 'tutorial' | 'easy' | 'normal' | 'hard';

export interface DifficultySettings {
  /** 難易度名 */
  name: string;
  /** 説明 */
  description: string;
  
  /** 初期予算 ($M) */
  initialBudget: number;
  /** 年間追加予算 ($M) */
  annualBudget: number;
  
  /** デブリ数 */
  debrisCount: number;
  /** 危険デブリの割合 (0-1) */
  dangerousDebrisRatio: number;
  
  /** 基本衝突確率 (カバレッジ0%の場合) */
  baseCollisionChance: number;
  /** カバレッジによる衝突減少率 (0-1) */
  coverageEffectiveness: number;
  
  /** ターン数 */
  maxTurns: number;
  /** 許容衝突数 */
  maxCollisions: number;
  
  /** 施設建設時間の倍率 */
  constructionTimeMultiplier: number;
  /** 維持費の倍率 */
  maintenanceCostMultiplier: number;
}

/**
 * 難易度設定カタログ
 */
export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultySettings> = {
  // チュートリアル：学習用モード（それでも油断すると負ける）
  tutorial: {
    name: 'チュートリアル',
    description: '基本操作を学ぶための練習モード（1年間）',
    initialBudget: 1500,
    annualBudget: 400,
    debrisCount: 150,
    dangerousDebrisRatio: 0.15,
    baseCollisionChance: 0.08,  // 8% - 12ターンで平均1回の衝突
    coverageEffectiveness: 0.85,
    maxTurns: 12,  // 1年間
    maxCollisions: 3,
    constructionTimeMultiplier: 0.5,  // 半分の時間で建設
    maintenanceCostMultiplier: 0.5,
  },
  
  // 簡単：初心者向け（何もしないと負ける）
  easy: {
    name: '簡単',
    description: '初心者向け。施設を建設しないと危険（2年間）',
    initialBudget: 1200,
    annualBudget: 250,
    debrisCount: 250,
    dangerousDebrisRatio: 0.2,
    baseCollisionChance: 0.18,  // 18% - 何もしないと24ターンで約4回衝突
    coverageEffectiveness: 0.75,
    maxTurns: 24,  // 2年間
    maxCollisions: 3,
    constructionTimeMultiplier: 0.75,
    maintenanceCostMultiplier: 0.75,
  },
  
  // 普通：標準難易度
  normal: {
    name: '普通',
    description: '標準的な難易度。戦略的な施設配置が必要（3年間）',
    initialBudget: 1000,
    annualBudget: 200,
    debrisCount: 350,
    dangerousDebrisRatio: 0.25,
    baseCollisionChance: 0.22,  // 22% - 何もしないと36ターンで約8回衝突
    coverageEffectiveness: 0.7,
    maxTurns: 36,  // 3年間
    maxCollisions: 3,
    constructionTimeMultiplier: 1.0,
    maintenanceCostMultiplier: 1.0,
  },
  
  // 難しい：上級者向け
  hard: {
    name: '難しい',
    description: '上級者向け。効率的な最適化が必須（4年間）',
    initialBudget: 800,
    annualBudget: 150,
    debrisCount: 450,
    dangerousDebrisRatio: 0.35,
    baseCollisionChance: 0.30,  // 30% - 何もしないと48ターンで約14回衝突
    coverageEffectiveness: 0.6,
    maxTurns: 48,  // 4年間
    maxCollisions: 2,
    constructionTimeMultiplier: 1.0,  // 建設時間は標準（長くしない）
    maintenanceCostMultiplier: 1.5,
  },
};

/**
 * 衝突確率を計算
 * @param settings 難易度設定
 * @param coverageRate カバー率 (0-1)
 * @param dangerousDebrisCount 危険デブリ数
 * @returns 衝突確率 (0-1)
 */
export function calculateCollisionChance(
  settings: DifficultySettings,
  coverageRate: number,
  dangerousDebrisCount: number
): number {
  // 基本確率 × (1 - カバレッジ効果)
  const coverageReduction = coverageRate * settings.coverageEffectiveness;
  const baseChance = settings.baseCollisionChance * (1 - coverageReduction);
  
  // 危険デブリが多いほど確率上昇（1個につき0.3%）
  const dangerBonus = dangerousDebrisCount * 0.003;
  
  // 最終確率（0-60%に制限）
  return Math.min(0.6, baseChance + dangerBonus);
}

/**
 * 難易度に基づいてデブリの危険度を調整
 */
export function adjustDebrisDangerLevel(
  baseDangerLevel: number,
  settings: DifficultySettings
): number {
  // 危険デブリ割合に基づいて調整
  const random = Math.random();
  if (random < settings.dangerousDebrisRatio) {
    // 危険度を上げる（3-5）
    return Math.min(5, Math.max(3, baseDangerLevel + Math.floor(Math.random() * 3)));
  }
  return baseDangerLevel;
}

/**
 * 難易度の説明テキストを生成
 */
export function getDifficultyDescription(level: DifficultyLevel): string {
  const settings = DIFFICULTY_SETTINGS[level];
  return `
    初期予算: $${settings.initialBudget}M
    デブリ数: ${settings.debrisCount}
    衝突リスク: ${level === 'tutorial' ? '低' : level === 'easy' ? '中' : level === 'normal' ? '高' : '極高'}
    許容衝突: ${settings.maxCollisions}回
  `.trim();
}
