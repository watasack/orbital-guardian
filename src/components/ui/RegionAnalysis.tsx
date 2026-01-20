'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Target, TrendingUp, MapPin } from 'lucide-react';

import type { Debris, Facility } from '@/types';

interface RegionAnalysisProps {
  /** デブリデータ */
  debris: Debris[];
  /** 施設データ */
  facilities: Facility[];
  /** 建設メニューを開く */
  onOpenBuildMenu?: () => void;
}

interface RegionData {
  name: string;
  altitudeRange: string;
  debrisCount: number;
  dangerousCount: number; // 危険度3以上
  coverage: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

/**
 * 軌道帯分析パネル
 * どの軌道帯にデブリが集中しているか、どこに建設すべきかを表示
 */
export function RegionAnalysis({ debris, facilities, onOpenBuildMenu }: RegionAnalysisProps) {
  // ハイドレーションエラー防止
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 軌道帯別の分析
  const regionData = useMemo<RegionData[]>(() => {
    const activeDebris = debris.filter(d => d.status === 'active');
    
    // 軌道帯の定義
    const regions = [
      { name: 'LEO (低軌道)', min: 200, max: 2000 },
      { name: 'MEO (中軌道)', min: 2000, max: 35786 },
      { name: 'GEO (静止軌道)', min: 35786, max: 50000 },
    ];
    
    return regions.map(region => {
      // この軌道帯のデブリを抽出
      const regionDebris = activeDebris.filter(d => {
        const altitude = d.orbit.semiMajorAxis - 6371;
        return altitude >= region.min && altitude < region.max;
      });
      
      const debrisCount = regionDebris.length;
      const dangerousCount = regionDebris.filter(d => d.risk.dangerLevel >= 3).length;
      
      // この軌道帯の施設数からカバー率を概算
      const regionFacilities = facilities.filter(f => {
        if (f.location.type === 'ground') {
          // 地上施設はLEOをカバー
          return region.name.includes('LEO');
        } else if (f.location.type === 'space' && f.location.orbit) {
          const alt = f.location.orbit.semiMajorAxis - 6371;
          return alt >= region.min && alt < region.max;
        }
        return false;
      });
      
      // 簡易カバー率計算（1施設あたり約20%カバーと仮定）
      const coverage = Math.min(1, regionFacilities.length * 0.2);
      
      // 優先度判定
      let priority: 'high' | 'medium' | 'low';
      let recommendation: string;
      
      if (dangerousCount > 10 && coverage < 0.3) {
        priority = 'high';
        recommendation = '早急に監視施設の建設を推奨';
      } else if (dangerousCount > 5 && coverage < 0.5) {
        priority = 'medium';
        recommendation = '監視施設の追加を検討';
      } else if (coverage < 0.3) {
        priority = 'medium';
        recommendation = 'カバー率向上のため施設追加を推奨';
      } else {
        priority = 'low';
        recommendation = '現状維持で問題なし';
      }
      
      return {
        name: region.name,
        altitudeRange: `${region.min.toLocaleString()}-${region.max.toLocaleString()}km`,
        debrisCount,
        dangerousCount,
        coverage,
        priority,
        recommendation,
      };
    });
  }, [debris, facilities]);
  
  // 建設推奨
  const topRecommendation = useMemo(() => {
    const highPriority = regionData.find(r => r.priority === 'high');
    if (highPriority) return highPriority;
    return regionData.find(r => r.priority === 'medium') || regionData[0];
  }, [regionData]);
  
  if (!mounted) {
    return (
      <div className="glass rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-space-600 rounded w-24 mb-3" />
          <div className="space-y-2">
            <div className="h-12 bg-space-600 rounded" />
            <div className="h-12 bg-space-600 rounded" />
            <div className="h-12 bg-space-600 rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  const priorityColors = {
    high: { bg: 'bg-status-danger/20', border: 'border-status-danger/50', text: 'text-status-danger' },
    medium: { bg: 'bg-status-warning/20', border: 'border-status-warning/50', text: 'text-status-warning' },
    low: { bg: 'bg-status-safe/20', border: 'border-status-safe/50', text: 'text-status-safe' },
  };
  
  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
        <Target className="w-4 h-4" />
        建設判断支援
      </h3>
      
      {/* 建設推奨エリア */}
      {topRecommendation && topRecommendation.priority !== 'low' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-3 mb-3 ${priorityColors[topRecommendation.priority].bg} border ${priorityColors[topRecommendation.priority].border}`}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-4 h-4 mt-0.5 ${priorityColors[topRecommendation.priority].text}`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${priorityColors[topRecommendation.priority].text}`}>
                推奨: {topRecommendation.name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                危険デブリ {topRecommendation.dangerousCount}個 / カバー率 {(topRecommendation.coverage * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {topRecommendation.recommendation}
              </p>
            </div>
          </div>
          {onOpenBuildMenu && (
            <button
              onClick={onOpenBuildMenu}
              className="btn-primary w-full mt-2 text-sm py-1.5"
            >
              施設を建設
            </button>
          )}
        </motion.div>
      )}
      
      {/* 軌道帯リスト */}
      <div className="space-y-2">
        {regionData.map((region) => (
          <RegionItem key={region.name} region={region} />
        ))}
      </div>
      
      {/* ヒント */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-xs text-gray-500 flex items-start gap-2">
          <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            危険デブリが多くカバー率が低い軌道帯に優先的に施設を建設しましょう。
            地上レーダーはLEO、宇宙施設はMEO/GEOに効果的です。
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * 軌道帯アイテム
 */
function RegionItem({ region }: { region: RegionData }) {
  const priorityColors = {
    high: 'border-status-danger/30 bg-status-danger/5',
    medium: 'border-status-warning/30 bg-status-warning/5',
    low: 'border-white/10 bg-transparent',
  };
  
  const priorityBadge = {
    high: { text: '要対応', color: 'bg-status-danger text-white' },
    medium: { text: '注意', color: 'bg-status-warning text-black' },
    low: { text: '良好', color: 'bg-status-safe/20 text-status-safe' },
  };
  
  return (
    <div className={`rounded-lg p-2 border ${priorityColors[region.priority]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-white">{region.name}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityBadge[region.priority].color}`}>
          {priorityBadge[region.priority].text}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-500">デブリ</p>
          <p className="text-white font-mono">{region.debrisCount}</p>
        </div>
        <div>
          <p className="text-gray-500">危険</p>
          <p className={`font-mono ${region.dangerousCount > 5 ? 'text-status-danger' : 'text-white'}`}>
            {region.dangerousCount}
          </p>
        </div>
        <div>
          <p className="text-gray-500">カバー率</p>
          <p className={`font-mono ${region.coverage < 0.3 ? 'text-status-warning' : 'text-white'}`}>
            {(region.coverage * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
