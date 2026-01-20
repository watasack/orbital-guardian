'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu,
  Play,
  X,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

import type { Debris, FacilityType } from '@/types';
import { 
  generateCandidates, 
  solveSetCover, 
  solveMaxCoverage,
  generateFormulationExplanation,
  type SetCoverResult,
  type FacilityCandidate
} from '@/lib/solver/setCoverProblem';
import { FACILITY_TYPES } from '@/lib/game/facilityManager';

type OptimizationMode = 'min_cost' | 'max_coverage';

interface SolverPanelProps {
  /** デブリデータ */
  debris: Debris[];
  /** 現在の予算 */
  budget: number;
  /** 最適化結果を適用 */
  onApply: (selectedCandidates: FacilityCandidate[]) => void;
  /** パネルを閉じる */
  onClose: () => void;
}

/**
 * 最適化ソルバーパネル
 */
export function SolverPanel({ debris, budget, onApply, onClose }: SolverPanelProps) {
  const [mode, setMode] = useState<OptimizationMode>('max_coverage');
  const [budgetLimit, setBudgetLimit] = useState(budget);
  const [minCoverage, setMinCoverage] = useState(0.8);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SetCoverResult | null>(null);
  const [candidates, setCandidates] = useState<FacilityCandidate[]>([]);
  const [showFormulation, setShowFormulation] = useState(false);
  
  // 施設候補を生成
  const generatedCandidates = useMemo(() => {
    return generateCandidates(debris);
  }, [debris]);
  
  // 最適化を実行
  const runOptimization = async () => {
    setIsRunning(true);
    setCandidates(generatedCandidates);
    
    // 非同期っぽく見せる（UIの更新を待つ）
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let optimizationResult: SetCoverResult;
    
    if (mode === 'max_coverage') {
      optimizationResult = solveMaxCoverage(debris, generatedCandidates, budgetLimit);
    } else {
      optimizationResult = solveSetCover({
        debris,
        candidates: generatedCandidates,
        budgetLimit,
        minCoverage,
      });
    }
    
    setResult(optimizationResult);
    setIsRunning(false);
  };
  
  // 結果を適用
  const handleApply = () => {
    if (!result) return;
    
    const selectedCandidateObjects = candidates.filter(
      c => result.selectedCandidates.includes(c.id)
    );
    
    onApply(selectedCandidateObjects);
    onClose();
  };
  
  // 数式の説明を生成
  const formulation = useMemo(() => {
    if (!showFormulation) return '';
    return generateFormulationExplanation({
      debris,
      candidates: generatedCandidates,
      budgetLimit,
      minCoverage: mode === 'min_cost' ? minCoverage : undefined,
    });
  }, [debris, generatedCandidates, budgetLimit, minCoverage, mode, showFormulation]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass mx-4 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-purple/20">
              <Cpu className="h-5 w-5 text-accent-purple" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">最適化ソルバー</h2>
              <p className="text-xs text-gray-400">施設配置の最適化</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {/* モード選択 */}
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-gray-400">最適化モード</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('max_coverage')}
                className={`flex-1 rounded-lg p-3 text-left transition-colors ${
                  mode === 'max_coverage'
                    ? 'bg-cyber-500/20 border border-cyber-500/50'
                    : 'bg-space-600/50 border border-transparent'
                }`}
              >
                <Target className={`mb-1 h-5 w-5 ${mode === 'max_coverage' ? 'text-cyber-400' : 'text-gray-400'}`} />
                <p className="font-medium text-white">カバー率最大化</p>
                <p className="mt-1 text-xs text-gray-400">予算内でカバー率を最大化</p>
              </button>
              <button
                onClick={() => setMode('min_cost')}
                className={`flex-1 rounded-lg p-3 text-left transition-colors ${
                  mode === 'min_cost'
                    ? 'bg-cyber-500/20 border border-cyber-500/50'
                    : 'bg-space-600/50 border border-transparent'
                }`}
              >
                <DollarSign className={`mb-1 h-5 w-5 ${mode === 'min_cost' ? 'text-cyber-400' : 'text-gray-400'}`} />
                <p className="font-medium text-white">コスト最小化</p>
                <p className="mt-1 text-xs text-gray-400">目標カバー率を最小コストで達成</p>
              </button>
            </div>
          </div>
          
          {/* パラメータ設定 */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 flex items-center justify-between text-sm text-gray-400">
                <span>予算上限</span>
                <span className="font-mono text-white">${budgetLimit}M</span>
              </label>
              <input
                type="range"
                min={100}
                max={budget}
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            {mode === 'min_cost' && (
              <div>
                <label className="mb-2 flex items-center justify-between text-sm text-gray-400">
                  <span>最低カバー率</span>
                  <span className="font-mono text-white">{(minCoverage * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={minCoverage}
                  onChange={(e) => setMinCoverage(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
          
          {/* 問題サイズ情報 */}
          <div className="mb-6 rounded-lg bg-space-600/50 p-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Info className="h-4 w-4" />
              <span>問題サイズ</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">監視対象デブリ:</span>
                <span className="ml-2 font-mono text-white">{debris.length}個</span>
              </div>
              <div>
                <span className="text-gray-500">施設候補:</span>
                <span className="ml-2 font-mono text-white">{generatedCandidates.length}箇所</span>
              </div>
            </div>
          </div>
          
          {/* 実行ボタン */}
          <button
            onClick={runOptimization}
            disabled={isRunning}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                最適化実行中...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                最適化を実行
              </>
            )}
          </button>
          
          {/* 結果表示 */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className={`rounded-lg p-4 ${
                  result.feasible 
                    ? 'bg-status-safe/10 border border-status-safe/30' 
                    : 'bg-status-danger/10 border border-status-danger/30'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {result.feasible ? (
                      <CheckCircle className="h-5 w-5 text-status-safe" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-status-danger" />
                    )}
                    <span className={`font-semibold ${result.feasible ? 'text-status-safe' : 'text-status-danger'}`}>
                      {result.feasible ? '最適解が見つかりました' : '実行可能解が見つかりません'}
                    </span>
                  </div>
                  
                  {result.feasible && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded bg-space-700/50 p-2 text-center">
                          <p className="text-xs text-gray-400">選択施設数</p>
                          <p className="font-mono text-lg text-white">{result.selectedCandidates.length}</p>
                        </div>
                        <div className="rounded bg-space-700/50 p-2 text-center">
                          <p className="text-xs text-gray-400">総コスト</p>
                          <p className="font-mono text-lg text-white">${result.totalCost}M</p>
                        </div>
                        <div className="rounded bg-space-700/50 p-2 text-center">
                          <p className="text-xs text-gray-400">カバー率</p>
                          <p className="font-mono text-lg text-white">{(result.coverage * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      {/* 選択された施設一覧 */}
                      <div>
                        <p className="mb-2 text-sm text-gray-400">推奨施設:</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {result.selectedCandidates.map((candidateId) => {
                            const candidate = candidates.find(c => c.id === candidateId);
                            if (!candidate) return null;
                            const definition = FACILITY_TYPES[candidate.type];
                            return (
                              <div
                                key={candidateId}
                                className="flex items-center justify-between rounded bg-space-700/30 px-2 py-1 text-sm"
                              >
                                <span className="text-gray-300">{candidate.location.name}</span>
                                <span className="text-gray-500">${definition.constructionCost}M</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {result.feasible && (
                  <button
                    onClick={handleApply}
                    className="mt-4 btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    この結果を適用
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 数式表示（学習モード） */}
          <div className="mt-6">
            <button
              onClick={() => setShowFormulation(!showFormulation)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {showFormulation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              数学的定式化を表示
            </button>
            
            <AnimatePresence>
              {showFormulation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 rounded-lg bg-space-600/50 p-4 overflow-hidden"
                >
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {formulation}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
