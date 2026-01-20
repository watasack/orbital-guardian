/**
 * 集合被覆問題（Set Covering Problem）の定式化
 * 
 * 問題：最小コストで全デブリをカバーする施設の組み合わせを求める
 * 
 * 数式表現：
 *   minimize  Σ_{j∈J} c_j · x_j
 *   s.t.      Σ_{j∈J} a_{ij} · x_j ≥ 1,  ∀i ∈ I
 *             x_j ∈ {0, 1},              ∀j ∈ J
 * 
 * ここで：
 *   I: デブリ（監視対象）の集合
 *   J: 施設候補地点の集合
 *   c_j: 地点jに施設を設置するコスト
 *   a_{ij}: 地点jから対象iを監視できれば1、そうでなければ0
 *   x_j: 地点jに施設を設置するか（決定変数）
 */

import type { Debris, Facility, FacilityType } from '@/types';
import { FACILITY_TYPES, GROUND_SITE_CANDIDATES, createFacility } from '../game/facilityManager';
import { solve, validateModel, type LPModel, type SolverResult } from './lpSolver';
import { EARTH_RADIUS_KM } from '../orbit/calculations';

/**
 * 施設候補
 */
export interface FacilityCandidate {
  id: string;
  type: FacilityType;
  location: {
    type: 'ground' | 'space';
    latitude?: number;
    longitude?: number;
    altitude?: number;
    name: string;
  };
  cost: number;
  coverageMatrix: boolean[]; // 各デブリをカバーできるか
}

/**
 * 集合被覆問題の入力
 */
export interface SetCoverInput {
  /** 監視対象のデブリ */
  debris: Debris[];
  /** 施設候補 */
  candidates: FacilityCandidate[];
  /** 予算上限（オプション） */
  budgetLimit?: number;
  /** 最低カバー率（オプション、0-1） */
  minCoverage?: number;
}

/**
 * 集合被覆問題の結果
 */
export interface SetCoverResult {
  /** 実行可能解が見つかったか */
  feasible: boolean;
  /** 選択された施設候補のID */
  selectedCandidates: string[];
  /** 総コスト */
  totalCost: number;
  /** カバー率 */
  coverage: number;
  /** カバーされるデブリ数 */
  coveredCount: number;
  /** 計算詳細 */
  details: {
    /** 問題サイズ */
    problemSize: { debris: number; candidates: number };
    /** ソルバー結果 */
    solverResult: SolverResult;
  };
}

/**
 * デブリが施設によってカバーされるか判定
 */
function canCoverDebris(
  debris: Debris,
  facilityType: FacilityType,
  location: { latitude?: number; longitude?: number; altitude?: number }
): boolean {
  const definition = FACILITY_TYPES[facilityType];
  
  // 監視能力がなければカバー不可
  if (!definition.monitoring) {
    return false;
  }
  
  const debrisAltitude = debris.orbit.semiMajorAxis - EARTH_RADIUS_KM;
  
  // 高度範囲チェック
  if (debrisAltitude < definition.monitoring.minAltitude ||
      debrisAltitude > definition.monitoring.maxAltitude) {
    return false;
  }
  
  // サイズチェック
  const sizeMap = { small: 5, medium: 30, large: 100 };
  const debrisSize = sizeMap[debris.physical.size];
  if (debrisSize < definition.monitoring.minSize) {
    return false;
  }
  
  // 地上施設の場合、緯度による可視性をチェック
  if (definition.category === 'ground' && location.latitude !== undefined) {
    const inclination = debris.orbit.inclination;
    const latitude = Math.abs(location.latitude);
    
    // 軌道傾斜角が施設緯度より小さい場合、その軌道は見えない
    if (inclination < latitude - 10) {
      return false;
    }
  }
  
  return true;
}

/**
 * 施設候補を生成
 */
export function generateCandidates(
  debris: Debris[],
  facilityTypes: FacilityType[] = ['radar_sband', 'radar_cband', 'optical_telescope', 'surveillance_satellite']
): FacilityCandidate[] {
  const candidates: FacilityCandidate[] = [];
  let candidateId = 0;
  
  // 地上施設候補
  for (const site of GROUND_SITE_CANDIDATES) {
    for (const type of facilityTypes) {
      const definition = FACILITY_TYPES[type];
      if (definition.category !== 'ground') continue;
      
      const coverageMatrix = debris.map(d => 
        canCoverDebris(d, type, { latitude: site.latitude, longitude: site.longitude })
      );
      
      // カバーできるデブリがあれば候補として追加
      if (coverageMatrix.some(c => c)) {
        candidates.push({
          id: `candidate-${candidateId++}`,
          type,
          location: {
            type: 'ground',
            latitude: site.latitude,
            longitude: site.longitude,
            name: `${site.name} - ${definition.name}`,
          },
          cost: definition.constructionCost,
          coverageMatrix,
        });
      }
    }
  }
  
  // 宇宙施設候補（複数の軌道高度・傾斜角で）
  const orbitalAltitudes = [500, 800, 1200, 20000];
  const inclinations = [28, 45, 63, 90];
  
  for (const altitude of orbitalAltitudes) {
    for (const inclination of inclinations) {
      for (const type of facilityTypes) {
        const definition = FACILITY_TYPES[type];
        if (definition.category !== 'space') continue;
        if (!definition.monitoring) continue;
        
        const coverageMatrix = debris.map(d =>
          canCoverDebris(d, type, { altitude })
        );
        
        if (coverageMatrix.some(c => c)) {
          candidates.push({
            id: `candidate-${candidateId++}`,
            type,
            location: {
              type: 'space',
              altitude,
              name: `${definition.name} @ ${altitude}km/${inclination}°`,
            },
            cost: definition.constructionCost,
            coverageMatrix,
          });
        }
      }
    }
  }
  
  return candidates;
}

/**
 * 集合被覆問題を解く
 */
export function solveSetCover(input: SetCoverInput): SetCoverResult {
  const { debris, candidates, budgetLimit, minCoverage } = input;
  
  // 問題が空の場合
  if (debris.length === 0 || candidates.length === 0) {
    return {
      feasible: true,
      selectedCandidates: [],
      totalCost: 0,
      coverage: debris.length === 0 ? 1 : 0,
      coveredCount: 0,
      details: {
        problemSize: { debris: debris.length, candidates: candidates.length },
        solverResult: { feasible: true, bounded: true, result: 0 },
      },
    };
  }
  
  // LPモデルの構築
  const model: LPModel = {
    optimize: 'cost',
    opType: 'min',
    constraints: {},
    variables: {},
    binaries: {},
  };
  
  // 各候補を変数として定義
  for (const candidate of candidates) {
    const coefficients: Record<string, number> = {
      cost: candidate.cost,
    };
    
    // 各デブリへのカバレッジ係数を設定
    for (let i = 0; i < debris.length; i++) {
      if (candidate.coverageMatrix[i]) {
        coefficients[`debris_${i}`] = 1;
      }
    }
    
    // 予算制約用の係数
    coefficients.budget = candidate.cost;
    
    model.variables[candidate.id] = coefficients;
    model.binaries![candidate.id] = 1;
  }
  
  // 各デブリをカバーする制約（minCoverageが指定されていない場合は全カバー必須）
  if (minCoverage === undefined || minCoverage >= 1) {
    for (let i = 0; i < debris.length; i++) {
      model.constraints[`debris_${i}`] = { min: 1 };
    }
  }
  
  // 予算制約
  if (budgetLimit !== undefined) {
    model.constraints.budget = { max: budgetLimit };
  }
  
  // モデルの妥当性チェック
  const validation = validateModel(model);
  if (!validation.valid) {
    console.warn('モデル検証エラー:', validation.errors);
  }
  
  // 解を求める
  const result = solve(model);
  
  // 結果の解析
  const selectedCandidates: string[] = [];
  let totalCost = 0;
  const coveredDebrisSet = new Set<number>();
  
  for (const candidate of candidates) {
    if (result[candidate.id] === 1) {
      selectedCandidates.push(candidate.id);
      totalCost += candidate.cost;
      
      // カバーされるデブリを記録
      for (let i = 0; i < debris.length; i++) {
        if (candidate.coverageMatrix[i]) {
          coveredDebrisSet.add(i);
        }
      }
    }
  }
  
  const coveredCount = coveredDebrisSet.size;
  const coverage = debris.length > 0 ? coveredCount / debris.length : 1;
  
  return {
    feasible: result.feasible,
    selectedCandidates,
    totalCost,
    coverage,
    coveredCount,
    details: {
      problemSize: { debris: debris.length, candidates: candidates.length },
      solverResult: result,
    },
  };
}

/**
 * 最大カバレッジ問題を解く（予算制約下でカバー率を最大化）
 */
export function solveMaxCoverage(
  debris: Debris[],
  candidates: FacilityCandidate[],
  budget: number
): SetCoverResult {
  // LPモデルの構築（カバー率最大化）
  const model: LPModel = {
    optimize: 'coverage',
    opType: 'max',
    constraints: {
      budget: { max: budget },
    },
    variables: {},
    binaries: {},
  };
  
  // 各候補を変数として定義
  for (const candidate of candidates) {
    const coverageValue = candidate.coverageMatrix.filter(c => c).length;
    
    model.variables[candidate.id] = {
      coverage: coverageValue,
      budget: candidate.cost,
    };
    model.binaries![candidate.id] = 1;
  }
  
  const result = solve(model);
  
  // 結果の解析
  const selectedCandidates: string[] = [];
  let totalCost = 0;
  const coveredDebrisSet = new Set<number>();
  
  for (const candidate of candidates) {
    if (result[candidate.id] === 1) {
      selectedCandidates.push(candidate.id);
      totalCost += candidate.cost;
      
      for (let i = 0; i < debris.length; i++) {
        if (candidate.coverageMatrix[i]) {
          coveredDebrisSet.add(i);
        }
      }
    }
  }
  
  const coveredCount = coveredDebrisSet.size;
  const coverage = debris.length > 0 ? coveredCount / debris.length : 1;
  
  return {
    feasible: result.feasible,
    selectedCandidates,
    totalCost,
    coverage,
    coveredCount,
    details: {
      problemSize: { debris: debris.length, candidates: candidates.length },
      solverResult: result,
    },
  };
}

/**
 * 数式の説明を生成（学習モード用）
 */
export function generateFormulationExplanation(input: SetCoverInput): string {
  const { debris, candidates, budgetLimit, minCoverage } = input;
  
  let explanation = `## 集合被覆問題（Set Covering Problem）\n\n`;
  
  explanation += `### 問題設定\n`;
  explanation += `- 監視対象デブリ数: ${debris.length}個\n`;
  explanation += `- 施設候補数: ${candidates.length}箇所\n`;
  if (budgetLimit !== undefined) {
    explanation += `- 予算上限: $${budgetLimit}M\n`;
  }
  if (minCoverage !== undefined) {
    explanation += `- 最低カバー率: ${(minCoverage * 100).toFixed(0)}%\n`;
  }
  
  explanation += `\n### 数学的定式化\n\n`;
  
  explanation += `**集合**\n`;
  explanation += `- $\\mathcal{I} = \\{1, 2, ..., ${debris.length}\\}$: デブリの集合\n`;
  explanation += `- $\\mathcal{J} = \\{1, 2, ..., ${candidates.length}\\}$: 施設候補の集合\n\n`;
  
  explanation += `**パラメータ**\n`;
  explanation += `- $c_j$: 施設 $j$ の建設コスト\n`;
  explanation += `- $a_{ij}$: 施設 $j$ がデブリ $i$ をカバーできれば1、そうでなければ0\n\n`;
  
  explanation += `**決定変数**\n`;
  explanation += `- $x_j \\in \\{0, 1\\}$: 施設 $j$ を建設するか\n\n`;
  
  explanation += `**目的関数**\n`;
  explanation += `$$\\text{minimize} \\quad \\sum_{j \\in \\mathcal{J}} c_j \\cdot x_j$$\n\n`;
  
  explanation += `**制約条件**\n`;
  explanation += `1. 各デブリは少なくとも1つの施設でカバー:\n`;
  explanation += `$$\\sum_{j \\in \\mathcal{J}} a_{ij} \\cdot x_j \\geq 1 \\quad \\forall i \\in \\mathcal{I}$$\n\n`;
  
  if (budgetLimit !== undefined) {
    explanation += `2. 予算制約:\n`;
    explanation += `$$\\sum_{j \\in \\mathcal{J}} c_j \\cdot x_j \\leq ${budgetLimit}$$\n\n`;
  }
  
  return explanation;
}
