'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Clock, 
  Calendar,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

import { PHASE_NAMES, PHASE_DESCRIPTIONS } from '@/lib/game/turnManager';
import type { GamePhase } from '@/types';

interface TurnControlsProps {
  /** 現在のターン */
  currentTurn: number;
  /** 最大ターン数 */
  maxTurns: number;
  /** 現在のフェーズ */
  currentPhase: GamePhase;
  /** 次ターンボタンが有効か */
  canAdvance: boolean;
  /** 次ターンへ進む */
  onNextTurn: () => void;
  /** フェーズを進める */
  onNextPhase: () => void;
  /** 確認モーダルを表示するか */
  showConfirmation?: boolean;
}

/**
 * ターン進行コントロール
 */
export function TurnControls({
  currentTurn,
  maxTurns,
  currentPhase,
  canAdvance,
  onNextTurn,
  onNextPhase,
  showConfirmation = true,
}: TurnControlsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const progress = (currentTurn / maxTurns) * 100;
  const year = Math.floor((currentTurn - 1) / 12) + 1;
  const month = ((currentTurn - 1) % 12) + 1;
  
  const handleNextTurnClick = () => {
    if (showConfirmation) {
      setIsConfirmOpen(true);
    } else {
      onNextTurn();
    }
  };
  
  const handleConfirm = () => {
    setIsConfirmOpen(false);
    onNextTurn();
  };
  
  return (
    <>
      <div className="glass rounded-xl p-4">
        {/* ターン情報 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyber-500/20">
              <Calendar className="h-5 w-5 text-cyber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Year {year}, Month {month}</p>
              <p className="font-mono text-lg font-bold text-white">
                Turn {currentTurn} / {maxTurns}
              </p>
            </div>
          </div>
          
          {/* フェーズ表示 */}
          <div className="text-right">
            <p className="text-xs text-gray-500">現在のフェーズ</p>
            <p className="text-sm font-medium text-cyber-400">
              {PHASE_NAMES[currentPhase]}
            </p>
          </div>
        </div>
        
        {/* 進捗バー */}
        <div className="mb-4">
          <div className="h-2 w-full rounded-full bg-space-600">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyber-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-gray-500">
            残り {maxTurns - currentTurn} ターン
          </p>
        </div>
        
        {/* フェーズ説明 */}
        <p className="mb-4 text-sm text-gray-400">
          {PHASE_DESCRIPTIONS[currentPhase]}
        </p>
        
        {/* ボタン */}
        <div className="flex gap-2">
          {currentPhase !== 'summary' && (
            <button
              onClick={onNextPhase}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <ChevronRight className="h-4 w-4" />
              次のフェーズ
            </button>
          )}
          
          <button
            onClick={handleNextTurnClick}
            disabled={!canAdvance}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward className="h-4 w-4" />
            次のターン
          </button>
        </div>
      </div>
      
      {/* 確認モーダル */}
      <AnimatePresence>
        {isConfirmOpen && (
          <ConfirmModal
            currentTurn={currentTurn}
            onConfirm={handleConfirm}
            onCancel={() => setIsConfirmOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * 確認モーダル
 */
function ConfirmModal({
  currentTurn,
  onConfirm,
  onCancel,
}: {
  currentTurn: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass mx-4 max-w-md rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-warning/20">
            <AlertTriangle className="h-6 w-6 text-status-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">ターンを終了しますか？</h3>
            <p className="text-sm text-gray-400">Turn {currentTurn} → Turn {currentTurn + 1}</p>
          </div>
        </div>
        
        <p className="mb-6 text-sm text-gray-400">
          ターンを終了すると、以下の処理が実行されます：
        </p>
        
        <ul className="mb-6 space-y-2 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyber-500" />
            施設の維持費が差し引かれます
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyber-500" />
            建設中の施設の工期が進みます
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyber-500" />
            除去衛星がデブリを除去します
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyber-500" />
            ランダムイベントが発生する可能性があります
          </li>
        </ul>
        
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            キャンセル
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1">
            確認
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * フェーズインジケーター
 */
export function PhaseIndicator({ currentPhase }: { currentPhase: GamePhase }) {
  const phases: GamePhase[] = ['planning', 'execution', 'event', 'summary'];
  
  return (
    <div className="flex items-center gap-2">
      {phases.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isPast = phases.indexOf(currentPhase) > index;
        
        return (
          <div key={phase} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-cyber-500 text-white'
                  : isPast
                    ? 'bg-cyber-500/30 text-cyber-400'
                    : 'bg-space-600 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            {index < phases.length - 1 && (
              <div
                className={`h-0.5 w-4 ${
                  isPast ? 'bg-cyber-500/50' : 'bg-space-600'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
