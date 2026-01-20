/**
 * 線形計画法ソルバーのラッパー
 * javascript-lp-solver を使用
 */

// @ts-ignore - javascript-lp-solver には型定義がない
import Solver from 'javascript-lp-solver';

/**
 * LPモデルの型定義
 */
export interface LPModel {
  /** 最適化方向 */
  optimize: string;
  /** 最適化タイプ */
  opType: 'min' | 'max';
  /** 制約 */
  constraints: Record<string, { min?: number; max?: number; equal?: number }>;
  /** 変数 */
  variables: Record<string, Record<string, number>>;
  /** 整数変数（オプション） */
  ints?: Record<string, number>;
  /** バイナリ変数（オプション） */
  binaries?: Record<string, number>;
}

/**
 * ソルバー結果
 */
export interface SolverResult {
  /** 実行可能解が見つかったか */
  feasible: boolean;
  /** 最適解かどうか */
  bounded: boolean;
  /** 目的関数の値 */
  result: number;
  /** 変数の値 */
  [key: string]: number | boolean;
}

/**
 * LPモデルを解く
 */
export function solve(model: LPModel): SolverResult {
  return Solver.Solve(model);
}

/**
 * 複数目的の重み付き和として解く
 */
export function solveWeightedSum(
  model: LPModel,
  weights: Record<string, number>
): SolverResult {
  // 重み付き和の目的関数を構築
  const combinedObjective = 'weighted_sum';
  
  // 各変数に重み付き係数を追加
  const newVariables: Record<string, Record<string, number>> = {};
  
  for (const [varName, coeffs] of Object.entries(model.variables)) {
    let weightedSum = 0;
    for (const [objName, weight] of Object.entries(weights)) {
      if (coeffs[objName] !== undefined) {
        weightedSum += coeffs[objName] * weight;
      }
    }
    newVariables[varName] = {
      ...coeffs,
      [combinedObjective]: weightedSum,
    };
  }
  
  const newModel: LPModel = {
    ...model,
    optimize: combinedObjective,
    variables: newVariables,
  };
  
  return solve(newModel);
}

/**
 * 感度分析（目的関数係数の変化に対する解の安定性）
 */
export function sensitivityAnalysis(
  model: LPModel,
  variableName: string,
  range: { min: number; max: number; step: number }
): { coefficient: number; objectiveValue: number; solution: Record<string, number> }[] {
  const results: { coefficient: number; objectiveValue: number; solution: Record<string, number> }[] = [];
  
  for (let coef = range.min; coef <= range.max; coef += range.step) {
    // 係数を変更したモデルを作成
    const modifiedModel = { ...model };
    modifiedModel.variables = { ...model.variables };
    modifiedModel.variables[variableName] = {
      ...model.variables[variableName],
      [model.optimize]: coef,
    };
    
    const result = solve(modifiedModel);
    
    if (result.feasible) {
      const solution: Record<string, number> = {};
      for (const key of Object.keys(model.variables)) {
        solution[key] = result[key] as number || 0;
      }
      
      results.push({
        coefficient: coef,
        objectiveValue: result.result,
        solution,
      });
    }
  }
  
  return results;
}

/**
 * モデルの妥当性チェック
 */
export function validateModel(model: LPModel): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 目的関数のチェック
  if (!model.optimize) {
    errors.push('目的関数が指定されていません');
  }
  
  // 最適化タイプのチェック
  if (model.opType !== 'min' && model.opType !== 'max') {
    errors.push('最適化タイプは "min" または "max" である必要があります');
  }
  
  // 変数のチェック
  if (Object.keys(model.variables).length === 0) {
    errors.push('変数が定義されていません');
  }
  
  // 制約のチェック
  for (const [name, constraint] of Object.entries(model.constraints)) {
    if (constraint.min === undefined && constraint.max === undefined && constraint.equal === undefined) {
      errors.push(`制約 "${name}" に境界が設定されていません`);
    }
  }
  
  // 目的関数に係数があるかチェック
  let hasObjectiveCoefficient = false;
  for (const coeffs of Object.values(model.variables)) {
    if (coeffs[model.optimize] !== undefined) {
      hasObjectiveCoefficient = true;
      break;
    }
  }
  if (!hasObjectiveCoefficient) {
    errors.push('どの変数にも目的関数の係数が設定されていません');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
