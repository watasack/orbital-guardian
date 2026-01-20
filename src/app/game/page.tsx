'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Settings, 
  HelpCircle, 
  Layers, 
  Building2,
  Cpu,
  Crosshair,
  Eye
} from 'lucide-react';

import type { Debris, Facility, GamePhase, FacilityType } from '@/types';
import { TurnControls, PhaseIndicator, RemovalPanel, DangerIndicator } from '@/components/ui';
import { BuildMenu } from '@/components/ui/BuildMenu';
import { HelpModal } from '@/components/ui/HelpModal';
import { GameOverScreen } from '@/components/ui/GameOverScreen';
import { Tutorial, useTutorial } from '@/components/ui/Tutorial';
import { RegionAnalysis } from '@/components/ui/RegionAnalysis';
import { SolverPanel } from '@/components/optimization';
import { generateDebrisField } from '@/lib/data/generator';
import { createFacility, generateSpaceFacilityOrbit, FACILITY_TYPES } from '@/lib/game/facilityManager';
import { calculateCoverage, type CoverageResult } from '@/lib/game/coverageCalculator';
import { calculateScore, checkGameEndCondition } from '@/lib/game/turnManager';
import { 
  DIFFICULTY_SETTINGS, 
  type DifficultyLevel,
  type DifficultySettings,
  calculateCollisionChance
} from '@/lib/game/difficulty';
import type { FacilityCandidate } from '@/lib/solver/setCoverProblem';

// 3DシーンはSSRを無効にして読み込む
const Scene = dynamic(
  () => import('@/components/3d/Scene').then((mod) => mod.Scene),
  { 
    ssr: false,
    loading: () => <SceneLoader />
  }
);

/**
 * ゲームメイン画面（Suspense でラップ）
 */
export default function GamePage() {
  return (
    <Suspense fallback={<SceneLoader />}>
      <GamePageContent />
    </Suspense>
  );
}

/**
 * ゲームメイン画面の内容
 */
function GamePageContent() {
  // URLパラメータ取得
  const searchParams = useSearchParams();
  const startTutorial = searchParams.get('tutorial') === 'true';
  const difficultyParam = searchParams.get('difficulty') as DifficultyLevel | null;
  
  // 難易度設定（デフォルトは通常、チュートリアルの場合はtutorial）
  const difficulty: DifficultyLevel = difficultyParam || (startTutorial ? 'tutorial' : 'normal');
  const difficultySettings: DifficultySettings = DIFFICULTY_SETTINGS[difficulty];
  
  // ゲーム状態
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('planning');
  const [budget, setBudget] = useState(difficultySettings.initialBudget);
  const [collisions, setCollisions] = useState(0);
  const [debrisRemoved, setDebrisRemoved] = useState(0);
  const [maxCoverage, setMaxCoverage] = useState(0);
  
  // ゲーム終了状態
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  
  // エンティティ（デブリを状態として管理）
  const [debris, setDebris] = useState(() => generateDebrisField(difficultySettings.debrisCount, difficultySettings.dangerousDebrisRatio));
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedDebris, setSelectedDebris] = useState<Debris | null>(null);
  
  // UI状態
  const [showOrbitalRegions, setShowOrbitalRegions] = useState(true);
  const [showCoverageLayer, setShowCoverageLayer] = useState(true);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [showSolverPanel, setShowSolverPanel] = useState(false);
  const [showRemovalPanel, setShowRemovalPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // チュートリアル（URLパラメータで開始）
  const tutorial = useTutorial(startTutorial);
  
  // 回転検出用
  const hasRotated = useRef(false);
  
  // カバレッジ計算
  const coverage = useMemo<CoverageResult>(() => {
    return calculateCoverage(facilities, debris);
  }, [facilities, debris]);
  
  // 最高カバー率の更新
  useEffect(() => {
    if (coverage.totalCoverage > maxCoverage) {
      setMaxCoverage(coverage.totalCoverage);
    }
  }, [coverage.totalCoverage, maxCoverage]);
  
  // スコア計算
  const score = useMemo(() => {
    return calculateScore(
      currentTurn,
      debrisRemoved,
      0,
      collisions,
      budget,
      facilities.length
    );
  }, [currentTurn, debrisRemoved, collisions, budget, facilities.length]);
  
  // 3Dビュー回転時のコールバック
  const handleViewRotate = useCallback(() => {
    if (!hasRotated.current) {
      hasRotated.current = true;
      tutorial.triggerAction('rotate');
    }
  }, [tutorial]);
  
  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showBuildMenu || showSolverPanel || showRemovalPanel || showHelp || isGameOver) return;
      
      switch (e.key.toLowerCase()) {
        case '?':
          setShowHelp(true);
          break;
        case 'b':
          setShowBuildMenu(true);
          tutorial.triggerAction('open-build');
          break;
        case 'o':
          setShowSolverPanel(true);
          break;
        case 'r':
          setShowRemovalPanel(true);
          tutorial.triggerAction('open-removal');
          break;
        case ' ':
          if (currentPhase === 'summary' || currentPhase === 'planning') {
            handleNextTurn();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBuildMenu, showSolverPanel, showRemovalPanel, showHelp, isGameOver, currentPhase, tutorial]);
  
  // 施設建設
  const handleBuild = useCallback((
    type: FacilityType, 
    location: { latitude?: number; longitude?: number; altitude?: number; name: string }
  ) => {
    const definition = FACILITY_TYPES[type];
    
    if (budget < definition.constructionCost) {
      alert('予算が足りません');
      return;
    }
    
    const facilityLocation = definition.category === 'ground'
      ? { type: 'ground' as const, latitude: location.latitude, longitude: location.longitude }
      : { type: 'space' as const, orbit: generateSpaceFacilityOrbit(location.altitude || 500) };
    
    const newFacility = createFacility(type, facilityLocation, location.name);
    
    // 難易度に応じた建設時間を適用
    const adjustedConstructionTime = Math.max(1, Math.round(
      definition.constructionTime * difficultySettings.constructionTimeMultiplier
    ));
    newFacility.operational.constructionTurns = adjustedConstructionTime;
    newFacility.operational.constructionRemaining = adjustedConstructionTime;
    
    setFacilities(prev => [...prev, newFacility]);
    setBudget(prev => prev - definition.constructionCost);
    
    // チュートリアル：施設建設完了
    tutorial.triggerAction('build');
  }, [budget, tutorial, difficultySettings]);
  
  // 建設メニューを開く
  const handleOpenBuildMenu = useCallback(() => {
    setShowBuildMenu(true);
    tutorial.triggerAction('open-build');
  }, [tutorial]);
  
  // 建設メニューを閉じる
  const handleCloseBuildMenu = useCallback(() => {
    setShowBuildMenu(false);
  }, []);
  
  // 除去メニューを開く
  const handleOpenRemovalPanel = useCallback(() => {
    setShowRemovalPanel(true);
    tutorial.triggerAction('open-removal');
  }, [tutorial]);
  
  // デブリ除去
  const handleRemoveDebris = useCallback((debrisIds: string[]) => {
    const removalCost = debrisIds.length * 10; // $10M per debris
    
    if (budget < removalCost) {
      alert('予算が足りません');
      return;
    }
    
    // デブリを除去済みにする
    setDebris(prev => prev.map(d => 
      debrisIds.includes(d.id) 
        ? { ...d, status: 'removed' as const }
        : d
    ));
    
    setBudget(prev => prev - removalCost);
    setDebrisRemoved(prev => prev + debrisIds.length);
    
    // チュートリアル：除去完了
    tutorial.triggerAction('remove');
  }, [budget, tutorial]);
  
  // 最適化結果を適用
  const handleApplyOptimization = useCallback((selectedCandidates: FacilityCandidate[]) => {
    let totalCost = 0;
    const newFacilities: Facility[] = [];
    
    for (const candidate of selectedCandidates) {
      const definition = FACILITY_TYPES[candidate.type];
      totalCost += definition.constructionCost;
      
      const facilityLocation = candidate.location.type === 'ground'
        ? { 
            type: 'ground' as const, 
            latitude: candidate.location.latitude, 
            longitude: candidate.location.longitude 
          }
        : { 
            type: 'space' as const, 
            orbit: generateSpaceFacilityOrbit(candidate.location.altitude || 500) 
          };
      
      const facility = createFacility(candidate.type, facilityLocation, candidate.location.name);
      newFacilities.push(facility);
    }
    
    if (totalCost > budget) {
      alert('予算が足りません');
      return;
    }
    
    setFacilities(prev => [...prev, ...newFacilities]);
    setBudget(prev => prev - totalCost);
  }, [budget]);
  
  // ターン進行
  const handleNextTurn = useCallback(() => {
    // チュートリアル
    tutorial.triggerAction('next-turn');
    
    const newTurn = currentTurn + 1;
    
    // 施設の建設進行
    const updatedFacilities = facilities.map(f => {
      if (f.operational.status === 'constructing') {
        const remaining = (f.operational.constructionRemaining || 0) - 1;
        if (remaining <= 0) {
          return {
            ...f,
            operational: { ...f.operational, status: 'operational' as const, constructionRemaining: 0 }
          };
        }
        return {
          ...f,
          operational: { ...f.operational, constructionRemaining: remaining }
        };
      }
      return f;
    });
    setFacilities(updatedFacilities);
    
    // 維持費の差し引き（難易度倍率を適用）
    const maintenanceCost = Math.round(facilities.reduce(
      (sum, f) => sum + (f.operational.status === 'operational' ? f.cost.monthly : 0),
      0
    ) * difficultySettings.maintenanceCostMultiplier);
    const newBudget = budget - maintenanceCost;
    setBudget(newBudget);
    
    // 年間予算追加（12ターンごと）
    if (newTurn % 12 === 1 && newTurn > 1) {
      setBudget(prev => prev + difficultySettings.annualBudget);
    }
    
    // 衝突判定（難易度に基づく確率計算）
    const activeDebris = debris.filter(d => d.status === 'active');
    const dangerousDebrisCount = activeDebris.filter(d => d.risk.dangerLevel >= 4).length;
    const collisionProbability = calculateCollisionChance(
      difficultySettings,
      coverage.totalCoverage,
      dangerousDebrisCount
    );
    
    if (Math.random() < collisionProbability) {
      setCollisions(prev => prev + 1);
    }
    
    // ゲーム終了判定（難易度設定を使用）
    const endCondition = checkGameEndCondition(
      newTurn,
      difficultySettings.maxTurns,
      newBudget,
      collisions,
      activeDebris.length
    );
    
    // 衝突数の上限も難易度に応じてチェック
    if (collisions >= difficultySettings.maxCollisions) {
      setIsGameOver(true);
      setIsVictory(false);
      setGameOverReason('重大な衝突事故が多発しました（ケスラーシンドローム）');
    } else if (endCondition.isGameOver) {
      setIsGameOver(true);
      setIsVictory(endCondition.isVictory);
      setGameOverReason(endCondition.reason);
    }
    
    setCurrentTurn(newTurn);
    setCurrentPhase('planning');
  }, [currentTurn, facilities, budget, debris, coverage.totalCoverage, collisions, tutorial, difficultySettings]);
  
  // フェーズ進行
  const handleNextPhase = useCallback(() => {
    const phases: GamePhase[] = ['planning', 'execution', 'event', 'summary'];
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1]);
    }
  }, [currentPhase]);
  
  // リトライ
  const handleRetry = useCallback(() => {
    setCurrentTurn(1);
    setCurrentPhase('planning');
    setBudget(difficultySettings.initialBudget);
    setCollisions(0);
    setDebrisRemoved(0);
    setMaxCoverage(0);
    setDebris(generateDebrisField(difficultySettings.debrisCount, difficultySettings.dangerousDebrisRatio));
    setFacilities([]);
    setIsGameOver(false);
    setIsVictory(false);
    setGameOverReason('');
    hasRotated.current = false;
  }, [difficultySettings]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-space-900">
      {/* 3Dシーン */}
      <Scene 
        className="absolute inset-0" 
        debrisCount={300}
        showOrbitalRegions={showOrbitalRegions}
        showCoverageLayer={showCoverageLayer}
        facilities={facilities}
        onDebrisSelect={setSelectedDebris}
        onCameraMove={handleViewRotate}
      />
      
      {/* UIオーバーレイ */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* ヘッダー */}
        <Header 
          debrisCount={debris.filter(d => d.status === 'active').length} 
          currentTurn={currentTurn}
          maxTurns={difficultySettings.maxTurns}
          coverage={coverage.totalCoverage}
          difficulty={difficultySettings.name}
          onHelpClick={() => setShowHelp(true)}
        />
        
        {/* 左側コントロール */}
        <div className="pointer-events-auto absolute left-4 top-20 bottom-28 w-64 flex flex-col gap-2 overflow-y-auto">
          {/* 表示設定（上部に配置） */}
          <ViewControls 
            showOrbitalRegions={showOrbitalRegions}
            showCoverageLayer={showCoverageLayer}
            onToggleOrbitalRegions={() => setShowOrbitalRegions(!showOrbitalRegions)}
            onToggleCoverageLayer={() => setShowCoverageLayer(!showCoverageLayer)}
          />
          
          {/* 危険度インジケーター */}
          <DangerIndicator 
            debris={debris}
            collisions={collisions}
            coverage={coverage.totalCoverage}
          />
          
          {/* フェーズ */}
          <div className="glass rounded-lg p-3">
            <PhaseIndicator currentPhase={currentPhase} />
          </div>
          
          {/* 軌道帯分析（建設判断支援） */}
          <RegionAnalysis
            debris={debris}
            facilities={facilities}
            onOpenBuildMenu={handleOpenBuildMenu}
          />
        </div>
        
        {/* 右側サイドパネル */}
        <SidePanel 
          selectedDebris={selectedDebris} 
          debrisCount={debris.filter(d => d.status === 'active').length}
          facilities={facilities}
          coverage={coverage}
          budget={budget}
          collisions={collisions}
          maxCollisions={difficultySettings.maxCollisions}
          debrisRemoved={debrisRemoved}
        />
        
        {/* 下部コントロール */}
        <div className="pointer-events-auto absolute bottom-0 left-0 right-0 p-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex gap-4">
              {/* アクションボタン */}
              <div className="flex flex-1 items-center justify-center gap-3">
                <button 
                  onClick={handleOpenBuildMenu}
                  className="btn-secondary flex items-center gap-2"
                  title="施設建設 (B)"
                  data-tutorial="build-button"
                >
                  <Building2 className="h-4 w-4" />
                  建設
                </button>
                <button 
                  onClick={handleOpenRemovalPanel}
                  className="btn-secondary flex items-center gap-2"
                  title="デブリ除去 (R)"
                  data-tutorial="removal-button"
                >
                  <Crosshair className="h-4 w-4" />
                  除去
                </button>
                {/* <button 
                  onClick={() => setShowSolverPanel(true)}
                  className="btn-secondary flex items-center gap-2"
                  title="最適化ソルバー (O)"
                >
                  <Cpu className="h-4 w-4" />
                  最適化
                </button> */}
              </div>
              
              {/* ターンコントロール */}
              <div className="w-80" data-tutorial="next-turn-button">
                <TurnControls
                  currentTurn={currentTurn}
                  maxTurns={difficultySettings.maxTurns}
                  currentPhase={currentPhase}
                  canAdvance={currentPhase === 'summary' || currentPhase === 'planning'}
                  onNextTurn={handleNextTurn}
                  onNextPhase={handleNextPhase}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* モーダル */}
      <AnimatePresence>
        {showBuildMenu && (
          <BuildMenu
            budget={budget}
            onBuild={handleBuild}
            onClose={handleCloseBuildMenu}
          />
        )}
        
        {showSolverPanel && (
          <SolverPanel
            debris={debris}
            budget={budget}
            onApply={handleApplyOptimization}
            onClose={() => setShowSolverPanel(false)}
          />
        )}
        
        {showRemovalPanel && (
          <RemovalPanel
            debris={debris}
            trackedDebrisIds={new Set(
              Array.from(coverage.debrisTracking.entries())
                .filter(([_, facilities]) => facilities.length > 0)
                .map(([debrisId]) => debrisId)
            )}
            budget={budget}
            onRemove={handleRemoveDebris}
            onClose={() => setShowRemovalPanel(false)}
          />
        )}
      </AnimatePresence>
      
      {/* ヘルプモーダル */}
      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
      
      {/* チュートリアル */}
      {tutorial.isActive && (
        <Tutorial 
          currentStep={tutorial.currentStep}
          onStepComplete={tutorial.completeStep}
          onSkip={tutorial.skip}
          onComplete={tutorial.complete}
        />
      )}
      
      {/* ゲーム終了画面 */}
      {isGameOver && (
        <GameOverScreen
          isVictory={isVictory}
          reason={gameOverReason}
          score={score}
          statistics={{
            finalTurn: currentTurn,
            debrisRemoved,
            facilitiesBuilt: facilities.length,
            collisions,
            finalBudget: budget,
            maxCoverage,
          }}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

/**
 * ヘッダー
 */
function Header({ 
  debrisCount, 
  currentTurn,
  maxTurns,
  coverage,
  difficulty,
  onHelpClick
}: { 
  debrisCount: number; 
  currentTurn: number;
  maxTurns: number;
  coverage: number;
  difficulty: string;
  onHelpClick: () => void;
}) {
  return (
    <header className="pointer-events-auto absolute left-0 right-0 top-0 p-4">
      <div className="flex items-center justify-between">
        <Link 
          href="/"
          className="btn-ghost flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">戻る</span>
        </Link>
        
        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-white">
            Orbital Guardian
            <span className="ml-2 text-sm font-normal text-cyber-400">
              [{difficulty}]
            </span>
          </h1>
          <p className="text-xs text-gray-500">
            Turn {currentTurn}/{maxTurns} • {debrisCount} debris • {(coverage * 100).toFixed(0)}% coverage
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onHelpClick}
            className="btn-ghost p-2 text-gray-400 hover:text-white"
            title="ヘルプ (?)"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button className="btn-ghost p-2 text-gray-400 hover:text-white">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * 表示設定
 */
function ViewControls({ 
  showOrbitalRegions,
  showCoverageLayer,
  onToggleOrbitalRegions,
  onToggleCoverageLayer
}: { 
  showOrbitalRegions: boolean;
  showCoverageLayer: boolean;
  onToggleOrbitalRegions: () => void;
  onToggleCoverageLayer: () => void;
}) {
  return (
    <div className="glass rounded-lg p-2 space-y-1">
      <button
        onClick={onToggleOrbitalRegions}
        className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors w-full ${
          showOrbitalRegions 
            ? 'bg-cyber-500/20 text-cyber-400' 
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Layers className="h-4 w-4" />
        <span>軌道帯</span>
      </button>
      <button
        onClick={onToggleCoverageLayer}
        className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors w-full ${
          showCoverageLayer 
            ? 'bg-status-safe/20 text-status-safe' 
            : 'text-gray-400 hover:text-white'
        }`}
        title="施設のカバレッジ範囲を表示"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
          <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
        </svg>
        <span>カバレッジ</span>
      </button>
    </div>
  );
}

/**
 * サイドパネル
 */
function SidePanel({ 
  selectedDebris, 
  debrisCount,
  facilities,
  coverage,
  budget,
  collisions,
  maxCollisions,
  debrisRemoved
}: { 
  selectedDebris: Debris | null; 
  debrisCount: number;
  facilities: Facility[];
  coverage: CoverageResult;
  budget: number;
  collisions: number;
  maxCollisions: number;
  debrisRemoved: number;
}) {
  const operationalFacilities = facilities.filter(f => f.operational.status === 'operational');
  const constructingFacilities = facilities.filter(f => f.operational.status === 'constructing');
  
  return (
    <aside className="pointer-events-auto absolute bottom-24 right-4 top-20 w-72 hidden lg:block">
      <div className="glass h-full overflow-y-auto p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Statistics
        </h2>
        
        <div className="space-y-3 mb-6">
          <StatItem label="追跡中のデブリ" value={debrisCount.toLocaleString()} />
          <StatItem label="除去済みデブリ" value={debrisRemoved.toString()} color="text-status-safe" />
          <StatItem 
            label="監視カバー率" 
            value={`${(coverage.totalCoverage * 100).toFixed(1)}%`}
            color={coverage.totalCoverage > 0.7 ? 'text-status-safe' : coverage.totalCoverage > 0.4 ? 'text-status-warning' : 'text-status-danger'}
          />
          <StatItem label="稼働施設" value={operationalFacilities.length.toString()} />
          <StatItem label="建設中" value={constructingFacilities.length.toString()} />
          <StatItem label="予算" value={`$${budget}M`} color={budget > 100 ? 'text-status-safe' : 'text-status-warning'} />
          <StatItem 
            label="発生衝突" 
            value={`${collisions} / ${maxCollisions}`} 
            color={collisions === 0 ? 'text-status-safe' : collisions < maxCollisions ? 'text-status-warning' : 'text-status-danger'} 
          />
        </div>
        
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Coverage by Region
        </h2>
        <div className="space-y-2 mb-6">
          {Object.entries(coverage.byRegion).map(([region, rate]) => (
            <div key={region} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{region}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 rounded-full bg-space-600">
                  <div 
                    className="h-full rounded-full bg-cyber-500"
                    style={{ width: `${rate * 100}%` }}
                  />
                </div>
                <span className="font-mono text-white w-12 text-right">{(rate * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
        
        <hr className="my-4 border-white/10" />
        
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Selected Object
        </h2>
        
        {selectedDebris ? (
          <DebrisInfo debris={selectedDebris} />
        ) : (
          <p className="text-sm text-gray-500">
            デブリをクリックして選択
          </p>
        )}
      </div>
    </aside>
  );
}

/**
 * 統計アイテム
 */
function StatItem({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`font-mono text-lg font-semibold ${color}`}>{value}</span>
    </div>
  );
}

/**
 * デブリ情報
 */
function DebrisInfo({ debris }: { debris: Debris }) {
  const dangerColors: Record<number, string> = {
    1: 'text-status-safe',
    2: 'text-lime-400',
    3: 'text-status-warning',
    4: 'text-orange-400',
    5: 'text-status-danger',
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-gray-500">名前</p>
        <p className="font-semibold text-white">{debris.name}</p>
      </div>
      
      <div>
        <p className="text-xs text-gray-500">カタログ番号</p>
        <p className="font-mono text-sm text-gray-300">{debris.catalogNumber}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">サイズ</p>
          <p className="text-sm text-gray-300 capitalize">{debris.physical.size}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">タイプ</p>
          <p className="text-sm text-gray-300">{debris.physical.type.replace('_', ' ')}</p>
        </div>
      </div>
      
      <div>
        <p className="text-xs text-gray-500">危険度</p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`h-2 w-4 rounded-sm ${
                  level <= debris.risk.dangerLevel
                    ? level <= 2 ? 'bg-status-safe' : level <= 3 ? 'bg-status-warning' : 'bg-status-danger'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <span className={`text-sm font-semibold ${dangerColors[debris.risk.dangerLevel]}`}>
            {debris.risk.dangerLevel}/5
          </span>
        </div>
      </div>
      
      <div>
        <p className="text-xs text-gray-500">軌道情報</p>
        <div className="mt-1 space-y-1 text-xs text-gray-400">
          <p>高度: {Math.round(debris.orbit.semiMajorAxis - 6371)} km</p>
          <p>傾斜角: {debris.orbit.inclination.toFixed(1)}°</p>
          <p>離心率: {debris.orbit.eccentricity.toFixed(4)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * ローディング画面
 */
function SceneLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-space-900">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyber-500 border-t-transparent mx-auto" />
        <p className="text-gray-400">Loading 3D Scene...</p>
      </div>
    </div>
  );
}
