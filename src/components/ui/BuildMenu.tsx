'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Satellite, 
  Radio, 
  Telescope,
  Zap,
  DollarSign,
  Clock,
  Target,
  ChevronRight,
  X
} from 'lucide-react';

import { FACILITY_TYPES, GROUND_SITE_CANDIDATES, type FacilityTypeDefinition } from '@/lib/game/facilityManager';
import type { FacilityType } from '@/types';

interface BuildMenuProps {
  /** 現在の予算 */
  budget: number;
  /** 施設建設時のコールバック */
  onBuild: (type: FacilityType, location: { latitude?: number; longitude?: number; altitude?: number; name: string }) => void;
  /** メニューを閉じる */
  onClose: () => void;
}

/**
 * 施設建設メニュー
 */
export function BuildMenu({ budget, onBuild, onClose }: BuildMenuProps) {
  const [selectedType, setSelectedType] = useState<FacilityType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'ground' | 'space'>('ground');
  
  const facilityTypes = Object.values(FACILITY_TYPES).filter(
    f => f.category === selectedCategory
  );
  
  const selectedDefinition = selectedType ? FACILITY_TYPES[selectedType] : null;
  const canAfford = selectedDefinition ? budget >= selectedDefinition.constructionCost : false;
  
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
        className="glass mx-4 max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-xl font-bold text-white">施設建設</h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex">
          {/* 左側：施設タイプ選択 */}
          <div className="w-1/2 border-r border-white/10 p-4">
            {/* カテゴリタブ */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setSelectedCategory('ground')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === 'ground'
                    ? 'bg-cyber-500/20 text-cyber-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Building2 className="mb-1 h-5 w-5 mx-auto" />
                地上施設
              </button>
              <button
                onClick={() => setSelectedCategory('space')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === 'space'
                    ? 'bg-cyber-500/20 text-cyber-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Satellite className="mb-1 h-5 w-5 mx-auto" />
                宇宙施設
              </button>
            </div>
            
            {/* 施設リスト */}
            <div className="space-y-2">
              {facilityTypes.map((facility) => (
                <FacilityTypeCard
                  key={facility.type}
                  facility={facility}
                  isSelected={selectedType === facility.type}
                  canAfford={budget >= facility.constructionCost}
                  onSelect={() => setSelectedType(facility.type)}
                />
              ))}
            </div>
          </div>
          
          {/* 右側：詳細と配置場所選択 */}
          <div className="w-1/2 p-4">
            {selectedDefinition ? (
              <FacilityDetails
                definition={selectedDefinition}
                budget={budget}
                onBuild={(location) => {
                  onBuild(selectedType!, location);
                  onClose();
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                <p>施設タイプを選択してください</p>
              </div>
            )}
          </div>
        </div>
        
        {/* フッター */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-status-safe" />
              <span className="text-gray-400">利用可能予算:</span>
              <span className="font-mono font-semibold text-white">${budget}M</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * 施設タイプカード
 */
function FacilityTypeCard({
  facility,
  isSelected,
  canAfford,
  onSelect,
}: {
  facility: FacilityTypeDefinition;
  isSelected: boolean;
  canAfford: boolean;
  onSelect: () => void;
}) {
  const Icon = facility.monitoring ? Radio : Zap;
  
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg p-3 text-left transition-all ${
        isSelected
          ? 'bg-cyber-500/20 border border-cyber-500/50'
          : 'bg-space-600/50 border border-transparent hover:border-white/10'
      } ${!canAfford ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          isSelected ? 'bg-cyber-500/30' : 'bg-space-500'
        }`}>
          <Icon className={`h-5 w-5 ${isSelected ? 'text-cyber-400' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-white">{facility.name}</p>
            <span className={`text-sm font-mono ${canAfford ? 'text-status-safe' : 'text-status-danger'}`}>
              ${facility.constructionCost}M
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">
            {facility.description}
          </p>
        </div>
      </div>
    </button>
  );
}

/**
 * 施設詳細・配置場所選択
 */
function FacilityDetails({
  definition,
  budget,
  onBuild,
}: {
  definition: FacilityTypeDefinition;
  budget: number;
  onBuild: (location: { latitude?: number; longitude?: number; altitude?: number; name: string }) => void;
}) {
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const canAfford = budget >= definition.constructionCost;
  
  return (
    <div className="h-full flex flex-col">
      {/* 施設情報 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{definition.name}</h3>
        <p className="mt-1 text-sm text-gray-400">{definition.description}</p>
      </div>
      
      {/* スペック */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-space-600/50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <DollarSign className="h-3 w-3" />
            建設コスト
          </div>
          <p className="mt-1 font-mono text-lg text-white">${definition.constructionCost}M</p>
        </div>
        <div className="rounded-lg bg-space-600/50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            建設期間
          </div>
          <p className="mt-1 font-mono text-lg text-white">{definition.constructionTime}ヶ月</p>
        </div>
        <div className="rounded-lg bg-space-600/50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <DollarSign className="h-3 w-3" />
            維持費/月
          </div>
          <p className="mt-1 font-mono text-lg text-white">${definition.monthlyCost}M</p>
        </div>
        {definition.monitoring && (
          <div className="rounded-lg bg-space-600/50 p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Target className="h-3 w-3" />
              監視高度
            </div>
            <p className="mt-1 font-mono text-sm text-white">
              {definition.monitoring.minAltitude}-{definition.monitoring.maxAltitude}km
            </p>
          </div>
        )}
      </div>
      
      {/* 配置場所選択 */}
      {definition.category === 'ground' && (
        <div className="flex-1 overflow-auto">
          <p className="mb-2 text-sm font-medium text-gray-400">配置場所を選択</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {GROUND_SITE_CANDIDATES.map((site, index) => (
              <button
                key={index}
                onClick={() => setSelectedSite(index)}
                className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                  selectedSite === index
                    ? 'bg-cyber-500/20 text-cyber-400'
                    : 'text-gray-300 hover:bg-space-600'
                }`}
              >
                {site.name} ({site.country})
              </button>
            ))}
          </div>
        </div>
      )}
      
      {definition.category === 'space' && (
        <div className="flex-1">
          <p className="mb-2 text-sm font-medium text-gray-400">軌道高度を選択</p>
          <div className="space-y-1">
            {[500, 800, 1200, 20000].map((altitude) => (
              <button
                key={altitude}
                onClick={() => setSelectedSite(altitude)}
                className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                  selectedSite === altitude
                    ? 'bg-cyber-500/20 text-cyber-400'
                    : 'text-gray-300 hover:bg-space-600'
                }`}
              >
                {altitude} km 軌道
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 建設ボタン */}
      <button
        onClick={() => {
          if (selectedSite !== null) {
            if (definition.category === 'ground') {
              const site = GROUND_SITE_CANDIDATES[selectedSite];
              onBuild({
                latitude: site.latitude,
                longitude: site.longitude,
                name: site.name,
              });
            } else {
              onBuild({
                altitude: selectedSite,
                name: `${selectedSite}km軌道`,
              });
            }
          }
        }}
        disabled={!canAfford || selectedSite === null}
        className="mt-4 btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        建設を開始
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
