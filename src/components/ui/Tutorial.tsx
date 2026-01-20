'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  X,
  MousePointer,
  Building2,
  SkipForward,
  CheckCircle,
  ArrowDown,
  Crosshair
} from 'lucide-react';

export type TutorialStep = 
  | 'welcome'
  | 'danger-indicator'
  | 'rotate-view'
  | 'open-build'
  | 'build-facility'
  | 'first-turn'      // 施設を建設したら次のターンへ
  | 'facility-ready'  // 施設完成の説明
  | 'open-removal'
  | 'remove-debris'
  | 'next-turn'
  | 'complete';

interface TutorialProps {
  /** 現在のステップ */
  currentStep: TutorialStep;
  /** ステップ完了時 */
  onStepComplete: (step: TutorialStep) => void;
  /** スキップ時 */
  onSkip: () => void;
  /** 完了時 */
  onComplete: () => void;
}

const STEP_INFO: Record<TutorialStep, { 
  title: string; 
  instruction: string; 
  icon: React.ElementType;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-center';
  highlightElement?: string;
}> = {
  'welcome': {
    title: 'Orbital Guardian へようこそ！',
    instruction: '12ターン（1年間）地球軌道を守りましょう。「次へ」をクリックして開始！',
    icon: CheckCircle,
    position: 'center',
  },
  'danger-indicator': {
    title: '危険度インジケーター',
    instruction: '左上のバーが現在の危険度を示します。赤くなると衝突リスクが高まります。次へ進みましょう。',
    icon: CheckCircle,
    position: 'center',
  },
  'rotate-view': {
    title: '3Dビューを操作しよう',
    instruction: 'マウスをドラッグして地球を回転させてください',
    icon: MousePointer,
    position: 'top-left',
  },
  'open-build': {
    title: '監視施設を建設しよう',
    instruction: '「建設」ボタンをクリックして監視レーダーを設置しましょう',
    icon: Building2,
    position: 'bottom-left',
    highlightElement: 'build-button',
  },
  'build-facility': {
    title: '「Sバンドレーダー」を建設',
    instruction: '左側で「Sバンドレーダー」を選び、右側で配置場所を選んで「建設を開始」をクリック。LEO帯のデブリを監視できます！',
    icon: Building2,
    position: 'top-right',
  },
  'first-turn': {
    title: 'ターンを進めて施設を完成させよう',
    instruction: '「次のターン」をクリックして施設を完成させましょう',
    icon: SkipForward,
    position: 'bottom-center',
    highlightElement: 'next-turn-button',
  },
  'facility-ready': {
    title: '施設が完成しました！',
    instruction: '監視施設が稼働を開始し、デブリを追跡できるようになりました。追跡中のデブリは除去可能です。次へ進みましょう。',
    icon: CheckCircle,
    position: 'center',
  },
  'open-removal': {
    title: 'デブリを除去しよう',
    instruction: '「除去」ボタンをクリックして危険なデブリを除去しましょう',
    icon: Crosshair,
    position: 'bottom-left',
    highlightElement: 'removal-button',
  },
  'remove-debris': {
    title: 'デブリを選択して除去',
    instruction: '追跡中のデブリを選択し、「除去」ボタンをクリックしてください',
    icon: Crosshair,
    position: 'top-right',
  },
  'next-turn': {
    title: 'ゲームを続けよう',
    instruction: '「次のターン」ボタンをクリックしてゲームを進行！',
    icon: SkipForward,
    position: 'bottom-center',
    highlightElement: 'next-turn-button',
  },
  'complete': {
    title: 'チュートリアル完了！',
    instruction: '基本操作をマスターしました。施設を建設してカバレッジを上げ、危険なデブリを除去しながら生き残りましょう！',
    icon: CheckCircle,
    position: 'center',
  },
};

/**
 * インタラクティブチュートリアル
 */
export function Tutorial({ currentStep, onStepComplete, onSkip, onComplete }: TutorialProps) {
  const stepInfo = STEP_INFO[currentStep];
  const Icon = stepInfo.icon;
  
  const positionClasses: Record<string, string> = {
    'center': 'items-center justify-center',
    'top-left': 'items-start justify-start pt-24 pl-4',
    'top-right': 'items-start justify-end pt-24 pr-80',
    'bottom-left': 'items-end justify-start pb-32 pl-4',
    'bottom-center': 'items-end justify-center pb-32',
  };
  
  // 「次へ」ボタンで進むステップ
  const showNextButton = currentStep === 'welcome' || currentStep === 'danger-indicator' || currentStep === 'facility-ready' || currentStep === 'complete';
  
  return (
    <div className={`fixed inset-0 z-[100] flex ${positionClasses[stepInfo.position]} pointer-events-none`}>
      {/* 背景オーバーレイ（welcome/danger-indicator/completeのみ） */}
      {(currentStep === 'welcome' || currentStep === 'danger-indicator' || currentStep === 'complete') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 pointer-events-auto"
          onClick={onSkip}
        />
      )}
      
      {/* チュートリアルカード */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="glass rounded-xl p-4 max-w-sm pointer-events-auto relative z-50 shadow-xl border border-cyber-500/30"
      >
        {/* スキップボタン */}
        <button
          onClick={onSkip}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors"
          title="チュートリアルをスキップ"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* アイコンとタイトル */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-500/20 border border-cyber-500/30 flex items-center justify-center">
            <Icon className="w-5 h-5 text-cyber-400" />
          </div>
          <div>
            <p className="text-xs text-cyber-400 font-semibold">TUTORIAL</p>
            <h3 className="text-white font-semibold">{stepInfo.title}</h3>
          </div>
        </div>
        
        {/* 指示 */}
        <p className="text-gray-300 text-sm mb-3">
          {stepInfo.instruction}
        </p>
        
        {/* アクションヒント */}
        {!showNextButton && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ArrowDown className="w-3 h-3 animate-bounce" />
            <span>上記の操作を行ってください</span>
          </div>
        )}
        
        {/* 次へボタン（welcome/danger-indicator/completeのみ） */}
        {showNextButton && (
          <button
            onClick={() => {
              if (currentStep === 'complete') {
                onComplete();
              } else {
                onStepComplete(currentStep);
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {currentStep === 'complete' ? 'ゲームを始める' : '次へ'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </motion.div>
      
      {/* ハイライト矢印 */}
      {stepInfo.highlightElement && (
        <HighlightArrow target={stepInfo.highlightElement} />
      )}
    </div>
  );
}

/**
 * ハイライト矢印
 */
function HighlightArrow({ target }: { target: string }) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  
  useEffect(() => {
    const element = document.querySelector(`[data-tutorial="${target}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 20,
      });
    }
  }, [target]);
  
  if (!position) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, -10, 0] }}
      transition={{ y: { repeat: Infinity, duration: 1 } }}
      className="fixed z-[101] pointer-events-none"
      style={{ left: position.x - 12, top: position.y - 24 }}
    >
      <ArrowDown className="w-6 h-6 text-cyber-400" />
    </motion.div>
  );
}

/**
 * チュートリアル状態管理フック
 * @param startTutorial - URLパラメータなどからチュートリアル開始指示を受け取る
 */
export function useTutorial(startTutorial: boolean = false) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep>('welcome');
  
  // URLパラメータでチュートリアル開始
  useEffect(() => {
    if (startTutorial) {
      setIsActive(true);
      setCurrentStep('welcome');
    }
  }, [startTutorial]);
  
  const completeStep = (step: TutorialStep) => {
    const steps: TutorialStep[] = [
      'welcome',
      'danger-indicator',
      'rotate-view', 
      'open-build',
      'build-facility',
      'first-turn',      // 施設建設後、ターンを進める
      'facility-ready',  // 施設完成の説明
      'open-removal',
      'remove-debris',
      'next-turn',
      'complete'
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };
  
  const skip = () => {
    setIsActive(false);
  };
  
  const complete = () => {
    setIsActive(false);
  };
  
  // 特定のアクションでステップを進める
  const triggerAction = (action: 'rotate' | 'open-build' | 'build' | 'open-removal' | 'remove' | 'next-turn') => {
    if (!isActive) return;
    
    switch (action) {
      case 'rotate':
        if (currentStep === 'rotate-view') completeStep('rotate-view');
        break;
      case 'open-build':
        if (currentStep === 'open-build') completeStep('open-build');
        break;
      case 'build':
        if (currentStep === 'build-facility') completeStep('build-facility');
        break;
      case 'open-removal':
        if (currentStep === 'open-removal') completeStep('open-removal');
        break;
      case 'remove':
        if (currentStep === 'remove-debris') completeStep('remove-debris');
        break;
      case 'next-turn':
        // first-turn と next-turn の両方で反応
        if (currentStep === 'first-turn') completeStep('first-turn');
        else if (currentStep === 'next-turn') completeStep('next-turn');
        break;
    }
  };
  
  return {
    isActive,
    currentStep,
    completeStep,
    skip,
    complete,
    triggerAction,
  };
}
