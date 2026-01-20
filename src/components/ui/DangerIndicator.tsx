'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, AlertCircle } from 'lucide-react';

import type { Debris } from '@/types';

interface DangerIndicatorProps {
  /** デブリデータ */
  debris: Debris[];
  /** 発生した衝突数 */
  collisions: number;
  /** カバー率 */
  coverage: number;
}

/**
 * 危険度インジケーター
 * 現在の危険レベルをリアルタイムで表示
 */
export function DangerIndicator({ debris, collisions, coverage }: DangerIndicatorProps) {
  // ハイドレーションエラー防止：マウント後のみ表示
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 危険度の計算
  const dangerStats = useMemo(() => {
    const activeDebris = debris.filter(d => d.status === 'active');
    const criticalCount = activeDebris.filter(d => d.risk.dangerLevel === 5).length;
    const highCount = activeDebris.filter(d => d.risk.dangerLevel === 4).length;
    const mediumCount = activeDebris.filter(d => d.risk.dangerLevel === 3).length;
    
    // 総合危険度スコア（0-100）
    const dangerScore = Math.min(100, 
      criticalCount * 10 + 
      highCount * 5 + 
      mediumCount * 2 + 
      collisions * 20 +
      (1 - coverage) * 30
    );
    
    let level: 'safe' | 'caution' | 'warning' | 'danger';
    let label: string;
    
    if (dangerScore < 20) {
      level = 'safe';
      label = '安全';
    } else if (dangerScore < 40) {
      level = 'caution';
      label = '注意';
    } else if (dangerScore < 70) {
      level = 'warning';
      label = '警戒';
    } else {
      level = 'danger';
      label = '危険';
    }
    
    return {
      criticalCount,
      highCount,
      mediumCount,
      dangerScore,
      level,
      label,
    };
  }, [debris, collisions, coverage]);
  
  const levelColors = {
    safe: { bg: 'bg-status-safe/20', border: 'border-status-safe/50', text: 'text-status-safe', bar: 'bg-status-safe' },
    caution: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', bar: 'bg-yellow-400' },
    warning: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', bar: 'bg-orange-400' },
    danger: { bg: 'bg-status-danger/20', border: 'border-status-danger/50', text: 'text-status-danger', bar: 'bg-status-danger' },
  };
  
  const colors = levelColors[dangerStats.level];
  
  // マウント前はプレースホルダーを表示
  if (!mounted) {
    return (
      <div className="glass rounded-lg p-3 bg-space-600/20 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-500">読込中...</span>
          </div>
          <span className="text-xs text-gray-400">危険度</span>
        </div>
        <div className="h-2 w-full rounded-full bg-space-600 mb-2" />
        <div className="h-4" />
      </div>
    );
  }
  
  return (
    <div className={`glass rounded-lg p-3 ${colors.bg} border ${colors.border}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {dangerStats.level === 'safe' ? (
            <Shield className={`w-4 h-4 ${colors.text}`} />
          ) : dangerStats.level === 'danger' ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
            </motion.div>
          ) : (
            <AlertCircle className={`w-4 h-4 ${colors.text}`} />
          )}
          <span className={`text-sm font-semibold ${colors.text}`}>
            {dangerStats.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          危険度
        </span>
      </div>
      
      {/* 危険度バー */}
      <div className="h-2 w-full rounded-full bg-space-600 mb-2">
        <motion.div
          className={`h-full rounded-full ${colors.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${dangerStats.dangerScore}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* 詳細カウント */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {dangerStats.criticalCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-danger" />
              <span className="text-gray-400">危険: {dangerStats.criticalCount}</span>
            </span>
          )}
          {dangerStats.highCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-gray-400">高: {dangerStats.highCount}</span>
            </span>
          )}
          {dangerStats.mediumCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-warning" />
              <span className="text-gray-400">中: {dangerStats.mediumCount}</span>
            </span>
          )}
        </div>
        <span className="text-gray-500">
          衝突: {collisions}/3
        </span>
      </div>
    </div>
  );
}
