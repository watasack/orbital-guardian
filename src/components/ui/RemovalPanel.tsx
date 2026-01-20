'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crosshair,
  AlertTriangle,
  CheckCircle,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';

import type { Debris } from '@/types';

interface RemovalPanelProps {
  /** デブリデータ */
  debris: Debris[];
  /** 追跡されているデブリID（監視施設でカバーされているもの） */
  trackedDebrisIds: Set<string>;
  /** 現在の予算 */
  budget: number;
  /** 除去実行時のコールバック */
  onRemove: (debrisIds: string[]) => void;
  /** パネルを閉じる */
  onClose: () => void;
}

// 除去コスト（1個あたり）
const REMOVAL_COST_PER_DEBRIS = 10; // $10M

/**
 * デブリ除去パネル
 */
export function RemovalPanel({ debris, trackedDebrisIds, budget, onRemove, onClose }: RemovalPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showUntrackedWarning, setShowUntrackedWarning] = useState(true);
  
  // 危険度が高いデブリをソート（追跡されているもののみ除去可能）
  const { trackedDangerousDebris, untrackedDangerousDebris } = useMemo(() => {
    const dangerous = debris
      .filter(d => d.status === 'active' && d.risk.dangerLevel >= 3)
      .sort((a, b) => b.risk.dangerLevel - a.risk.dangerLevel);
    
    return {
      trackedDangerousDebris: dangerous.filter(d => trackedDebrisIds.has(d.id)).slice(0, 20),
      untrackedDangerousDebris: dangerous.filter(d => !trackedDebrisIds.has(d.id)).slice(0, 10),
    };
  }, [debris, trackedDebrisIds]);
  
  // 選択中のコスト
  const totalCost = selectedIds.size * REMOVAL_COST_PER_DEBRIS;
  const canAfford = budget >= totalCost;
  
  // 選択をトグル（追跡されているデブリのみ選択可能）
  const toggleSelection = (id: string) => {
    if (!trackedDebrisIds.has(id)) return; // 追跡されていないものは選択不可
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // 全選択/解除（追跡されているデブリのみ）
  const selectAll = () => {
    if (selectedIds.size === trackedDangerousDebris.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trackedDangerousDebris.map(d => d.id)));
    }
  };
  
  // 除去実行
  const handleRemove = () => {
    if (selectedIds.size > 0 && canAfford) {
      onRemove(Array.from(selectedIds));
      onClose();
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-danger/20">
              <Crosshair className="h-5 w-5 text-status-danger" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">デブリ除去</h2>
              <p className="text-xs text-gray-400">危険度の高いデブリを選択して除去</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* コスト情報 */}
        <div className="p-4 bg-space-600/50 border-b border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">除去コスト: ${REMOVAL_COST_PER_DEBRIS}M / 1個</span>
            <span className="text-gray-400">予算: ${budget}M</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-white font-semibold">
              選択中: {selectedIds.size}個
            </span>
            <span className={`font-mono font-bold ${canAfford ? 'text-status-safe' : 'text-status-danger'}`}>
              合計: ${totalCost}M
            </span>
          </div>
        </div>
        
        {/* デブリリスト */}
        <div className="max-h-96 overflow-y-auto p-4">
          {trackedDangerousDebris.length === 0 && untrackedDangerousDebris.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-status-safe" />
              <p>危険なデブリはありません</p>
            </div>
          ) : (
            <>
              {/* 追跡されていないデブリの警告 */}
              {untrackedDangerousDebris.length > 0 && showUntrackedWarning && (
                <div className="mb-4 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
                  <div className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-status-warning font-semibold">
                        {untrackedDangerousDebris.length}件の危険なデブリが追跡できていません
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        監視施設を建設してカバレッジを上げると除去可能になります
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowUntrackedWarning(false)}
                      className="text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* 追跡されているデブリ（除去可能） */}
              {trackedDangerousDebris.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-status-safe" />
                      追跡中のデブリ（除去可能）
                    </p>
                    <button 
                      onClick={selectAll}
                      className="text-xs text-cyber-400 hover:text-cyber-300"
                    >
                      {selectedIds.size === trackedDangerousDebris.length ? '全解除' : '全選択'}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {trackedDangerousDebris.map((d) => (
                      <DebrisItem
                        key={d.id}
                        debris={d}
                        isSelected={selectedIds.has(d.id)}
                        isTracked={true}
                        onToggle={() => toggleSelection(d.id)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <EyeOff className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm">追跡中の危険なデブリがありません</p>
                  <p className="text-xs mt-1">監視施設を建設してください</p>
                </div>
              )}
              
              {/* 追跡されていないデブリ（参考表示） */}
              {untrackedDangerousDebris.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-500 flex items-center gap-2 mb-3">
                    <EyeOff className="w-4 h-4" />
                    追跡できていないデブリ（除去不可）
                  </p>
                  <div className="space-y-2 opacity-50">
                    {untrackedDangerousDebris.slice(0, 5).map((d) => (
                      <DebrisItem
                        key={d.id}
                        debris={d}
                        isSelected={false}
                        isTracked={false}
                        onToggle={() => {}} // クリック無効
                      />
                    ))}
                    {untrackedDangerousDebris.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        他 {untrackedDangerousDebris.length - 5}件...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* フッター */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleRemove}
            disabled={selectedIds.size === 0 || !canAfford}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="h-4 w-4" />
            {selectedIds.size}個のデブリを除去 (${totalCost}M)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * デブリアイテム
 */
function DebrisItem({ 
  debris, 
  isSelected, 
  isTracked,
  onToggle 
}: { 
  debris: Debris; 
  isSelected: boolean;
  isTracked: boolean;
  onToggle: () => void;
}) {
  const dangerColors: Record<number, string> = {
    3: 'bg-status-warning',
    4: 'bg-orange-500',
    5: 'bg-status-danger',
  };
  
  return (
    <button
      onClick={onToggle}
      disabled={!isTracked}
      className={`w-full rounded-lg p-3 text-left transition-all flex items-center gap-3 ${
        !isTracked
          ? 'bg-space-700/30 border border-transparent cursor-not-allowed'
          : isSelected
            ? 'bg-status-danger/20 border border-status-danger/50'
            : 'bg-space-600/50 border border-transparent hover:border-white/10'
      }`}
    >
      {/* チェックボックス / 追跡状態 */}
      {isTracked ? (
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
          isSelected 
            ? 'bg-status-danger border-status-danger' 
            : 'border-gray-500'
        }`}>
          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
        </div>
      ) : (
        <div className="w-5 h-5 flex items-center justify-center">
          <EyeOff className="w-4 h-4 text-gray-600" />
        </div>
      )}
      
      {/* 危険度インジケーター */}
      <div className={`w-2 h-8 rounded-full ${dangerColors[debris.risk.dangerLevel] || 'bg-gray-500'}`} />
      
      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isTracked ? 'text-white' : 'text-gray-500'}`}>
          {debris.name}
        </p>
        <p className="text-xs text-gray-400">
          高度: {Math.round(debris.orbit.semiMajorAxis - 6371)}km • 
          サイズ: {debris.physical.size}
        </p>
      </div>
      
      {/* 危険度 */}
      <div className="flex items-center gap-1">
        <AlertTriangle className={`w-4 h-4 ${
          debris.risk.dangerLevel === 5 ? 'text-status-danger' :
          debris.risk.dangerLevel === 4 ? 'text-orange-400' :
          'text-status-warning'
        }`} />
        <span className={`text-sm font-mono ${isTracked ? 'text-white' : 'text-gray-500'}`}>
          {debris.risk.dangerLevel}/5
        </span>
      </div>
    </button>
  );
}
