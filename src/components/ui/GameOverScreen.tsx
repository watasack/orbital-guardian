'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Trophy, 
  Skull, 
  RotateCcw, 
  Home,
  Target,
  Shield,
  DollarSign,
  Zap,
  TrendingUp
} from 'lucide-react';

interface GameStatistics {
  /** 最終ターン */
  finalTurn: number;
  /** 除去したデブリ数 */
  debrisRemoved: number;
  /** 建設した施設数 */
  facilitiesBuilt: number;
  /** 発生した衝突数 */
  collisions: number;
  /** 最終予算 */
  finalBudget: number;
  /** 最高カバー率 */
  maxCoverage: number;
}

interface GameOverScreenProps {
  /** 勝利したか */
  isVictory: boolean;
  /** ゲーム終了理由 */
  reason: string;
  /** スコア */
  score: number;
  /** 統計情報 */
  statistics: GameStatistics;
  /** リトライ */
  onRetry: () => void;
}

/**
 * ゲーム終了画面
 */
export function GameOverScreen({
  isVictory,
  reason,
  score,
  statistics,
  onRetry,
}: GameOverScreenProps) {
  const rankInfo = getScoreRank(score);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="glass max-w-lg w-full rounded-2xl overflow-hidden"
      >
        {/* ヘッダー */}
        <div className={`p-6 text-center ${
          isVictory 
            ? 'bg-gradient-to-br from-status-safe/20 to-cyber-500/20' 
            : 'bg-gradient-to-br from-status-danger/20 to-orange-500/20'
        }`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              isVictory ? 'bg-status-safe/20' : 'bg-status-danger/20'
            }`}
          >
            {isVictory ? (
              <Trophy className="w-10 h-10 text-status-safe" />
            ) : (
              <Skull className="w-10 h-10 text-status-danger" />
            )}
          </motion.div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-3xl font-bold mb-2 ${
              isVictory ? 'text-status-safe' : 'text-status-danger'
            }`}
          >
            {isVictory ? 'MISSION COMPLETE' : 'MISSION FAILED'}
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-400"
          >
            {reason}
          </motion.p>
        </div>
        
        {/* スコア */}
        <div className="p-6 border-b border-white/10">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">SCORE</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="text-5xl font-bold font-mono text-white"
            >
              {score.toLocaleString()}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${rankInfo.bgColor}`}
            >
              <span className={`text-lg font-bold ${rankInfo.textColor}`}>
                {rankInfo.rank}
              </span>
              <span className="text-sm text-gray-400">
                {rankInfo.label}
              </span>
            </motion.div>
          </div>
        </div>
        
        {/* 統計 */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Statistics
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <StatItem 
              icon={<Target className="w-4 h-4" />}
              label="生存ターン"
              value={`${statistics.finalTurn} / 24`}
              delay={1.0}
            />
            <StatItem 
              icon={<Zap className="w-4 h-4" />}
              label="除去デブリ"
              value={statistics.debrisRemoved.toString()}
              delay={1.1}
            />
            <StatItem 
              icon={<Shield className="w-4 h-4" />}
              label="建設施設"
              value={statistics.facilitiesBuilt.toString()}
              delay={1.2}
            />
            <StatItem 
              icon={<Skull className="w-4 h-4" />}
              label="発生衝突"
              value={statistics.collisions.toString()}
              color={statistics.collisions > 0 ? 'text-status-danger' : 'text-status-safe'}
              delay={1.3}
            />
            <StatItem 
              icon={<DollarSign className="w-4 h-4" />}
              label="最終予算"
              value={`$${statistics.finalBudget}M`}
              delay={1.4}
            />
            <StatItem 
              icon={<TrendingUp className="w-4 h-4" />}
              label="最高カバー率"
              value={`${(statistics.maxCoverage * 100).toFixed(1)}%`}
              delay={1.5}
            />
          </div>
        </div>
        
        {/* ボタン */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onRetry}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            もう一度プレイ
          </button>
          <Link
            href="/"
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            タイトルへ
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * 統計アイテム
 */
function StatItem({ 
  icon, 
  label, 
  value, 
  color = 'text-white',
  delay 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string; 
  color?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-3 rounded-lg bg-space-600/50"
    >
      <div className="text-gray-500">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-mono font-semibold ${color}`}>{value}</p>
      </div>
    </motion.div>
  );
}

/**
 * スコアからランクを取得
 */
function getScoreRank(score: number): { rank: string; label: string; bgColor: string; textColor: string } {
  if (score >= 50000) {
    return { rank: 'S', label: 'Legendary Guardian', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' };
  }
  if (score >= 30000) {
    return { rank: 'A', label: 'Elite Commander', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' };
  }
  if (score >= 15000) {
    return { rank: 'B', label: 'Skilled Operator', bgColor: 'bg-cyber-500/20', textColor: 'text-cyber-400' };
  }
  if (score >= 5000) {
    return { rank: 'C', label: 'Junior Officer', bgColor: 'bg-green-500/20', textColor: 'text-green-400' };
  }
  return { rank: 'D', label: 'Trainee', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400' };
}
