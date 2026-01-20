'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mouse, 
  Building2, 
  Cpu, 
  SkipForward,
  Target,
  DollarSign,
  AlertTriangle,
  Keyboard
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 操作説明モーダル
 */
export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
            className="glass max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-xl font-bold text-white">ヘルプ / 操作説明</h2>
              <button onClick={onClose} className="btn-ghost p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              {/* 基本操作 */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Mouse className="h-5 w-5 text-cyber-400" />
                  3Dビュー操作
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-3 p-2 rounded bg-space-600/50">
                    <kbd className="px-2 py-1 rounded bg-space-500 text-xs">左ドラッグ</kbd>
                    <span className="text-gray-300">視点を回転</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-space-600/50">
                    <kbd className="px-2 py-1 rounded bg-space-500 text-xs">右ドラッグ</kbd>
                    <span className="text-gray-300">視点をパン（移動）</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-space-600/50">
                    <kbd className="px-2 py-1 rounded bg-space-500 text-xs">スクロール</kbd>
                    <span className="text-gray-300">ズームイン/アウト</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-space-600/50">
                    <kbd className="px-2 py-1 rounded bg-space-500 text-xs">クリック</kbd>
                    <span className="text-gray-300">デブリを選択</span>
                  </div>
                </div>
              </section>
              
              {/* ゲームの流れ */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <SkipForward className="h-5 w-5 text-cyber-400" />
                  ゲームの流れ
                </h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <p>
                    ゲームは<strong className="text-white">ターン制</strong>で進行します。
                    1ターン = 1ヶ月、全120ターン（10年間）が目標です。
                  </p>
                  <div className="grid gap-2">
                    <div className="p-3 rounded bg-space-600/50 border-l-2 border-cyber-500">
                      <p className="font-semibold text-white">1. 計画フェーズ</p>
                      <p className="text-gray-400">施設の建設、除去対象の選択</p>
                    </div>
                    <div className="p-3 rounded bg-space-600/50 border-l-2 border-yellow-500">
                      <p className="font-semibold text-white">2. 実行フェーズ</p>
                      <p className="text-gray-400">アクションが実行される</p>
                    </div>
                    <div className="p-3 rounded bg-space-600/50 border-l-2 border-purple-500">
                      <p className="font-semibold text-white">3. イベントフェーズ</p>
                      <p className="text-gray-400">ランダムイベント発生</p>
                    </div>
                    <div className="p-3 rounded bg-space-600/50 border-l-2 border-green-500">
                      <p className="font-semibold text-white">4. サマリーフェーズ</p>
                      <p className="text-gray-400">結果確認、次ターンへ</p>
                    </div>
                  </div>
                </div>
              </section>
              
              {/* 施設について */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyber-400" />
                  施設タイプ
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="p-3 rounded bg-space-600/50">
                    <p className="font-semibold text-white">地上監視施設</p>
                    <p className="text-gray-400">Sバンドレーダー、Cバンドレーダー、光学望遠鏡、レーザー測距局</p>
                    <p className="text-gray-500 text-xs mt-1">低コスト、建設が早い、高度範囲に制限あり</p>
                  </div>
                  <div className="p-3 rounded bg-space-600/50">
                    <p className="font-semibold text-white">宇宙施設</p>
                    <p className="text-gray-400">監視衛星、除去衛星（磁石式/網式/レーザー式）</p>
                    <p className="text-gray-500 text-xs mt-1">高コスト、建設に時間がかかる、高いカバレッジ</p>
                  </div>
                </div>
              </section>
              
              {/* 最適化ソルバー */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-cyber-400" />
                  最適化ソルバー
                </h3>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>
                    <strong className="text-white">集合被覆問題（Set Covering Problem）</strong>を解いて、
                    最適な施設配置を自動計算します。
                  </p>
                  <div className="p-3 rounded bg-space-600/50">
                    <p className="font-semibold text-white">カバー率最大化</p>
                    <p className="text-gray-400">予算内で監視カバー率を最大化</p>
                  </div>
                  <div className="p-3 rounded bg-space-600/50">
                    <p className="font-semibold text-white">コスト最小化</p>
                    <p className="text-gray-400">目標カバー率を最小コストで達成</p>
                  </div>
                </div>
              </section>
              
              {/* 勝敗条件 */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyber-400" />
                  勝敗条件
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="p-3 rounded bg-status-safe/10 border border-status-safe/30">
                    <p className="font-semibold text-status-safe">勝利条件</p>
                    <p className="text-gray-400">120ターン（10年間）地球軌道を守り抜く</p>
                  </div>
                  <div className="p-3 rounded bg-status-danger/10 border border-status-danger/30">
                    <p className="font-semibold text-status-danger">敗北条件</p>
                    <ul className="text-gray-400 list-disc list-inside">
                      <li>予算が枯渇する</li>
                      <li>重大な衝突事故が3回発生（ケスラーシンドローム）</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              {/* キーボードショートカット */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-cyber-400" />
                  キーボードショートカット
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-3 p-2 rounded bg-space-600/50">
                    <kbd className="px-2 py-1 rounded bg-space-500 text-xs">?</kbd>
                    <span className="text-gray-300">このヘルプを表示</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-space-600/50">
                    <kbd className="px-2 py-1 rounded bg-space-500 text-xs">B</kbd>
                    <span className="text-gray-300">建設メニューを開く</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-space-600/50">
                    <kbd className="px-2 py-1 rounded bg-space-500 text-xs">O</kbd>
                    <span className="text-gray-300">最適化パネルを開く</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded bg-space-600/50">
                    <kbd className="px-2 py-1 rounded bg-space-500 text-xs">Space</kbd>
                    <span className="text-gray-300">次のターンへ</span>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
