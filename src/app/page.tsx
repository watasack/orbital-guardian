'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, Shield, Target, Zap, Github, ExternalLink, GraduationCap, Flame, Skull } from 'lucide-react';
import { DIFFICULTY_SETTINGS, type DifficultyLevel } from '@/lib/game/difficulty';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* 背景のスター効果 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* ヒーローセクション */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto relative z-10"
      >
        {/* ロゴ/タイトル */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-cyber-500/20 border border-cyber-500/30">
            <Shield className="w-10 h-10 text-cyber-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-4">
            <span className="text-gradient-cyber">Orbital</span>{' '}
            <span className="text-white">Guardian</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light">
            宇宙デブリ監視・除去ネットワーク最適化ゲーム
          </p>
        </motion.div>

        {/* サブテキスト */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-gray-500 mb-8 max-w-2xl mx-auto"
        >
          {/* 数理最適化を学びながら、地球軌道を守ろう。
          <br /> */}
          監視レーダー網と除去衛星を最適配置し、ケスラーシンドロームを防げ。
        </motion.p>

        {/* 難易度選択 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-4">難易度を選択</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <DifficultyButton
              level="tutorial"
              icon={<GraduationCap className="w-5 h-5" />}
              color="cyber"
            />
            <DifficultyButton
              level="easy"
              icon={<Shield className="w-5 h-5" />}
              color="green"
            />
            <DifficultyButton
              level="normal"
              icon={<Rocket className="w-5 h-5" />}
              color="yellow"
            />
            <DifficultyButton
              level="hard"
              icon={<Skull className="w-5 h-5" />}
              color="red"
            />
          </div>
        </motion.div>

        {/* 特徴カード */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <FeatureCard
            icon={<Target className="w-6 h-6" />}
            title="施設配置問題"
            description="監視レーダーと除去衛星の最適配置を学ぶ"
            delay={0.9}
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="最適化ソルバー"
            description="集合被覆問題を自動で解く"
            delay={1.0}
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="戦略シミュレーション"
            description="ターン制でじっくり最適解を探る"
            delay={1.1}
          />
        </motion.div> */}
        
        {/* 操作説明 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-16 glass rounded-xl p-6 text-left max-w-2xl mx-auto"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-cyber-400" />
            遊び方
          </h2>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyber-500/20 text-cyber-400 text-xs font-bold shrink-0">1</span>
              <span><strong className="text-white">3Dビューを操作</strong>：マウスドラッグで回転、スクロールでズーム</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyber-500/20 text-cyber-400 text-xs font-bold shrink-0">2</span>
              <span><strong className="text-white">施設を建設</strong>：地上レーダーや監視衛星を配置してデブリを追跡</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyber-500/20 text-cyber-400 text-xs font-bold shrink-0">3</span>
              <span><strong className="text-white">デブリを除去</strong>：危険なデブリを選択して除去ミッションを実行</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyber-500/20 text-cyber-400 text-xs font-bold shrink-0">4</span>
              <span><strong className="text-white">ターンを進行</strong>：規定ターン地球軌道を守り抜こう</span>
            </li>
          </ul>
          <div className="mt-4 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
            <p className="text-xs text-status-warning">
              💡 初めての方は「チュートリアル」ボタンから始めることをおすすめします！
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* フッター */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="mt-auto pt-16 pb-8 text-center text-gray-600 text-sm relative z-10"
      >
        {/* <p>
          地球軌道を守ろう。未来の宇宙開発のために。
        </p>
        <p className="mt-2">
          © 2025 Orbital Guardian Team. MIT License.
        </p> */}
      </motion.footer>
    </div>
  );
}

// 難易度選択ボタンコンポーネント
function DifficultyButton({
  level,
  icon,
  color,
}: {
  level: DifficultyLevel;
  icon: React.ReactNode;
  color: 'cyber' | 'green' | 'yellow' | 'red';
}) {
  const settings = DIFFICULTY_SETTINGS[level];
  
  const colorClasses = {
    cyber: 'border-cyber-500/50 hover:border-cyber-400 hover:bg-cyber-500/10 text-cyber-400',
    green: 'border-status-safe/50 hover:border-status-safe hover:bg-status-safe/10 text-status-safe',
    yellow: 'border-status-warning/50 hover:border-status-warning hover:bg-status-warning/10 text-status-warning',
    red: 'border-status-danger/50 hover:border-status-danger hover:bg-status-danger/10 text-status-danger',
  };
  
  const href = level === 'tutorial' 
    ? `/game?difficulty=${level}&tutorial=true`
    : `/game?difficulty=${level}`;
  
  return (
    <Link
      href={href}
      className={`group glass rounded-lg p-4 border-2 transition-all ${colorClasses[color]}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-2">{icon}</div>
        <h3 className="text-sm font-semibold text-white mb-1">{settings.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{settings.description}</p>
        <div className="text-xs text-gray-600 space-y-0.5">
          <p>予算: ${settings.initialBudget}M</p>
          <p>デブリ: {settings.debrisCount}</p>
          <p>ターン: {settings.maxTurns}</p>
        </div>
      </div>
    </Link>
  );
}

// 特徴カードコンポーネント
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-interactive group"
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-12 h-12 rounded-lg bg-cyber-500/10 border border-cyber-500/20 flex items-center justify-center mb-4 text-cyber-400 group-hover:bg-cyber-500/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
    </motion.div>
  );
}
