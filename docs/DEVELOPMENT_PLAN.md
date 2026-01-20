# Orbital Guardian - 開発計画書

## 概要

本ドキュメントは、Orbital Guardianプロジェクトの開発計画を定義します。
開発は4つのフェーズに分けて段階的に進め、各フェーズ終了時に動作するプロダクトをリリースします。

**総開発期間**: 約12週間（3ヶ月）
**開発手法**: イテレーティブ開発（各フェーズで動作するMVPを作成）

---

## 開発フェーズ概要

```
Phase 0: 環境構築・基盤整備     [Week 1]        ← 現在
    ↓
Phase 1: コア機能MVP           [Week 2-4]
    ↓
Phase 2: ゲームシステム完成     [Week 5-7]
    ↓
Phase 3: ビジュアル強化・最適化  [Week 8-10]
    ↓
Phase 4: 公開準備・デプロイ     [Week 11-12]
```

---

## Phase 0: 環境構築・基盤整備 (Week 1) ✅ 完了

### 目標
プロジェクトの基盤を整備し、開発を開始できる状態にする。

### タスク一覧

| # | タスク | 状態 | 成果物 |
|---|--------|------|--------|
| 0.1 | プロジェクトフォルダ作成 | ✅ | `/orbital-guardian/` |
| 0.2 | package.json・依存関係定義 | ✅ | `package.json` |
| 0.3 | TypeScript設定 | ✅ | `tsconfig.json` |
| 0.4 | Tailwind CSS設定 | ✅ | `tailwind.config.ts` |
| 0.5 | ESLint/Prettier設定 | ✅ | `.eslintrc.json`, `.prettierrc` |
| 0.6 | 基本設計書作成 | ✅ | `docs/DESIGN.md` |
| 0.7 | 型定義作成 | ✅ | `src/types/index.ts` |
| 0.8 | グローバルスタイル作成 | ✅ | `src/styles/globals.css` |
| 0.9 | ランディングページ作成 | ✅ | `src/app/page.tsx` |
| 0.10 | Vercel設定 | ✅ | `vercel.json` |

### 完了条件
- [x] `npm install` が成功する
- [x] `npm run dev` でランディングページが表示される
- [x] 基本設計書が完成している

---

## Phase 1: コア機能MVP (Week 2-4)

### 目標
3D地球表示とデブリの可視化、基本的なゲーム状態管理を実装する。
このフェーズ終了時に「デブリが浮かぶ地球を眺められるデモ」が完成する。

### Week 2: 3D基盤

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 1.1 | React Three Fiber セットアップ | 高 | 2h | - |
| 1.2 | 3Dシーン基本構成（Canvas, Camera, Lights） | 高 | 3h | 1.1 |
| 1.3 | 地球コンポーネント作成 | 高 | 4h | 1.2 |
| 1.4 | 地球テクスチャ適用（昼/夜/雲） | 中 | 3h | 1.3 |
| 1.5 | カメラコントロール（OrbitControls） | 高 | 2h | 1.2 |
| 1.6 | 大気グロー効果（シェーダー） | 低 | 4h | 1.3 |

**成果物**:
- `src/components/3d/Scene.tsx`
- `src/components/3d/Earth.tsx`
- `src/components/3d/Controls.tsx`
- `public/assets/textures/earth_*.jpg`

### Week 3: デブリとデータ

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 1.7 | デブリデータ生成ロジック | 高 | 4h | - |
| 1.8 | 軌道計算ユーティリティ（位置算出） | 高 | 6h | - |
| 1.9 | デブリコンポーネント（InstancedMesh） | 高 | 4h | 1.2, 1.7 |
| 1.10 | デブリの色分け（危険度別） | 中 | 2h | 1.9 |
| 1.11 | デブリホバー/選択機能 | 中 | 3h | 1.9 |
| 1.12 | 軌道帯の可視化 | 中 | 3h | 1.2 |

**成果物**:
- `src/components/3d/Debris.tsx`
- `src/components/3d/OrbitalRegions.tsx`
- `src/lib/orbit/calculations.ts`
- `src/lib/data/generator.ts`

### Week 4: 状態管理とUI基盤

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 1.13 | Zustand ゲームストア作成 | 高 | 4h | - |
| 1.14 | UIストア作成（カメラ状態等） | 高 | 2h | - |
| 1.15 | 基本UIレイアウト（ヘッダー、サイドパネル） | 高 | 4h | - |
| 1.16 | デブリ情報パネル | 中 | 3h | 1.11, 1.15 |
| 1.17 | 統計ウィジェット（デブリ数、カバー率等） | 中 | 3h | 1.13 |
| 1.18 | ローディング画面 | 低 | 2h | - |

**成果物**:
- `src/stores/gameStore.ts`
- `src/stores/uiStore.ts`
- `src/components/ui/Header.tsx`
- `src/components/ui/SidePanel.tsx`
- `src/components/dashboard/StatsWidget.tsx`
- `src/app/game/page.tsx`

### Phase 1 完了条件
- [ ] 3D地球が表示され、マウスで回転・ズーム可能
- [ ] デブリが軌道上に表示される（100-500個）
- [ ] デブリをクリックすると情報が表示される
- [ ] 基本的な統計（デブリ数等）が表示される

### Phase 1 マイルストーン
**「3Dデブリビューアー」デモ公開可能**

---

## Phase 2: ゲームシステム完成 (Week 5-7)

### 目標
ターン制ゲームシステム、施設配置、最適化ソルバーを実装する。
このフェーズ終了時に「遊べるゲーム」が完成する。

### Week 5: ターン制システム

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 2.1 | ターン進行ロジック | 高 | 4h | 1.13 |
| 2.2 | フェーズ管理（計画/実行/イベント/サマリー） | 高 | 3h | 2.1 |
| 2.3 | リソース管理（予算、政治資本等） | 高 | 3h | 1.13 |
| 2.4 | ターン終了処理（デブリ移動、衝突判定） | 中 | 4h | 2.1 |
| 2.5 | ターン進行UI（ターン数、フェーズ表示） | 高 | 2h | 2.1 |
| 2.6 | 次ターンボタン・確認モーダル | 中 | 2h | 2.5 |

**成果物**:
- `src/lib/game/turnManager.ts`
- `src/lib/game/resourceManager.ts`
- `src/components/ui/TurnControls.tsx`
- `src/components/ui/PhaseIndicator.tsx`

### Week 6: 施設システム

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 2.7 | 施設データ定義（地上/宇宙） | 高 | 2h | - |
| 2.8 | 施設配置ロジック | 高 | 4h | 2.7 |
| 2.9 | 地上施設の3D表示 | 中 | 3h | 1.2 |
| 2.10 | 宇宙施設の3D表示 | 中 | 3h | 1.2 |
| 2.11 | 監視カバレッジ計算 | 高 | 4h | 2.8 |
| 2.12 | カバレッジの可視化 | 中 | 3h | 2.11 |
| 2.13 | 施設配置UI（選択、配置モード） | 高 | 4h | 2.8 |
| 2.14 | 施設情報パネル | 中 | 2h | 2.8 |

**成果物**:
- `src/lib/game/facilityManager.ts`
- `src/lib/game/coverageCalculator.ts`
- `src/components/3d/Facilities.tsx`
- `src/components/3d/CoverageOverlay.tsx`
- `src/components/ui/FacilityPanel.tsx`
- `src/components/ui/BuildMenu.tsx`

### Week 7: 最適化ソルバー

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 2.15 | javascript-lp-solver 統合 | 高 | 3h | - |
| 2.16 | 集合被覆問題の定式化 | 高 | 4h | 2.15 |
| 2.17 | 施設配置問題の定式化 | 高 | 4h | 2.15 |
| 2.18 | 最適化UI（目的関数/制約選択） | 高 | 4h | 2.16 |
| 2.19 | 最適化結果の可視化 | 中 | 3h | 2.18 |
| 2.20 | 学習モード（数式表示、解説） | 低 | 4h | 2.18 |

**成果物**:
- `src/lib/solver/lpSolver.ts`
- `src/lib/solver/setCoverProblem.ts`
- `src/lib/solver/facilityLocationProblem.ts`
- `src/components/optimization/SolverPanel.tsx`
- `src/components/optimization/ResultView.tsx`

### Phase 2 完了条件
- [ ] ターン制でゲームが進行する
- [ ] 施設を配置できる
- [ ] 予算が消費・回復する
- [ ] 最適化ソルバーで推奨配置が得られる
- [ ] 監視カバー率が計算・表示される

### Phase 2 マイルストーン
**「遊べるプロトタイプ」完成**

---

## Phase 3: ビジュアル強化・ゲーム性向上 (Week 8-10)

### 目標
ビジュアルを洗練させ、イベントシステムを追加してゲーム性を向上させる。

### Week 8: イベント・難易度システム

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 3.1 | イベントシステム基盤 | 高 | 4h | 2.1 |
| 3.2 | イベントデータ定義（衝突、太陽フレア等） | 高 | 3h | 3.1 |
| 3.3 | イベント発生ロジック | 高 | 3h | 3.1 |
| 3.4 | イベント通知UI | 高 | 3h | 3.1 |
| 3.5 | イベント選択肢・対応UI | 中 | 3h | 3.4 |
| 3.6 | 難易度設定システム | 中 | 3h | - |
| 3.7 | 難易度選択UI | 中 | 2h | 3.6 |

**成果物**:
- `src/lib/game/eventManager.ts`
- `src/lib/data/events.ts`
- `src/components/ui/EventNotification.tsx`
- `src/components/ui/EventModal.tsx`
- `src/components/ui/DifficultySelect.tsx`

### Week 9: ビジュアル強化

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 3.8 | ポストプロセス効果（Bloom, etc） | 中 | 4h | 1.2 |
| 3.9 | 軌道線アニメーション | 中 | 3h | 1.12 |
| 3.10 | デブリ除去アニメーション | 中 | 3h | - |
| 3.11 | 衝突イベントエフェクト | 中 | 3h | 3.3 |
| 3.12 | UI遷移アニメーション（Framer Motion） | 中 | 4h | - |
| 3.13 | サウンド効果（オプション） | 低 | 4h | - |

**成果物**:
- `src/components/3d/Effects.tsx`
- `src/components/3d/Animations.tsx`
- アニメーション強化されたUIコンポーネント

### Week 10: ゲームバランス・勝敗条件

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 3.14 | スコアリングシステム | 高 | 3h | - |
| 3.15 | 勝利/敗北条件判定 | 高 | 3h | 3.14 |
| 3.16 | ゲーム終了画面 | 高 | 3h | 3.15 |
| 3.17 | 統計サマリー画面 | 中 | 4h | 3.14 |
| 3.18 | 実績システム | 低 | 4h | - |
| 3.19 | バランス調整・テストプレイ | 高 | 8h | - |

**成果物**:
- `src/lib/game/scoringSystem.ts`
- `src/components/ui/GameOverScreen.tsx`
- `src/components/ui/SummaryScreen.tsx`
- `src/components/ui/Achievements.tsx`

### Phase 3 完了条件
- [ ] ランダムイベントが発生する
- [ ] 難易度を選択できる
- [ ] ビジュアルエフェクトが適用されている
- [ ] ゲームに勝敗がある
- [ ] ゲーム終了時に統計が表示される

### Phase 3 マイルストーン
**「完成版ゲーム」内部リリース**

---

## Phase 4: 公開準備・デプロイ (Week 11-12)

### 目標
パフォーマンス最適化、ドキュメント整備、Vercelへのデプロイを行い、一般公開する。

### Week 11: 最適化・テスト

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 4.1 | パフォーマンス計測・分析 | 高 | 3h | - |
| 4.2 | 3Dレンダリング最適化 | 高 | 4h | 4.1 |
| 4.3 | バンドルサイズ最適化 | 中 | 3h | - |
| 4.4 | モバイル対応調整 | 中 | 4h | - |
| 4.5 | クロスブラウザテスト | 高 | 3h | - |
| 4.6 | バグ修正 | 高 | 8h | - |

**成果物**:
- 最適化されたバンドル
- パフォーマンステストレポート

### Week 12: デプロイ・公開

| # | タスク | 優先度 | 見積 | 依存 |
|---|--------|--------|------|------|
| 4.7 | README.md 最終更新 | 高 | 2h | - |
| 4.8 | CONTRIBUTING.md 作成 | 中 | 2h | - |
| 4.9 | チュートリアル実装 | 高 | 6h | - |
| 4.10 | OGP画像・メタデータ設定 | 中 | 2h | - |
| 4.11 | GitHub リポジトリ公開 | 高 | 1h | - |
| 4.12 | Vercel デプロイ | 高 | 2h | 4.11 |
| 4.13 | 最終動作確認 | 高 | 2h | 4.12 |
| 4.14 | 公開アナウンス準備 | 低 | 2h | 4.12 |

**成果物**:
- 公開されたGitHubリポジトリ
- 動作するVercelデプロイ
- チュートリアル

### Phase 4 完了条件
- [ ] Vercelで一般公開されている
- [ ] GitHubリポジトリが公開されている
- [ ] README/ドキュメントが整備されている
- [ ] チュートリアルがある
- [ ] 主要ブラウザで動作確認済み

### Phase 4 マイルストーン
**🎉 一般公開！**

---

## 技術的なポイント

### 3D パフォーマンス戦略

```typescript
// デブリ表示の最適化戦略
const PERFORMANCE_TIERS = {
  high: {
    maxVisibleDebris: 10000,
    lodDistances: [100, 500, 2000],
    postProcessing: true,
    shadowQuality: 'high',
  },
  medium: {
    maxVisibleDebris: 5000,
    lodDistances: [50, 200, 1000],
    postProcessing: true,
    shadowQuality: 'medium',
  },
  low: {
    maxVisibleDebris: 1000,
    lodDistances: [30, 100, 500],
    postProcessing: false,
    shadowQuality: 'none',
  },
};
```

### 状態管理の分離

```typescript
// ストアの責務分離
stores/
├── gameStore.ts      // ゲームロジック（ターン、リソース、エンティティ）
├── uiStore.ts        // UI状態（選択、モーダル、カメラ）
└── settingsStore.ts  // 設定（難易度、グラフィック品質、音量）
```

### 最適化問題のインターフェース

```typescript
// 問題定義と解の流れ
interface OptimizationFlow {
  // 1. ユーザーが目的・制約を選択
  userInput: {
    objective: 'min_cost' | 'max_coverage' | 'balanced';
    constraints: {
      budget?: number;
      minCoverage?: number;
      maxResponseTime?: number;
    };
  };
  
  // 2. 問題を定式化
  formulate(): OptimizationProblem;
  
  // 3. ソルバーで解く
  solve(): OptimizationResult;
  
  // 4. 結果を適用/可視化
  apply(result: OptimizationResult): void;
}
```

---

## リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| 3Dパフォーマンス問題 | 高 | 中 | 早期にLOD/Instancing実装、品質設定オプション |
| 最適化ソルバーの限界 | 中 | 低 | 問題サイズ制限、ヒューリスティック解の併用 |
| モバイル対応困難 | 中 | 中 | デスクトップ優先、モバイルは簡易表示モード |
| 実データAPI制限 | 低 | 中 | シミュレーションデータをデフォルトに |
| 開発遅延 | 中 | 中 | 各フェーズで動作するMVPを確保、機能の優先順位付け |

---

## 成功指標 (KPI)

### 技術指標
- [ ] 60fps維持（デスクトップ、デブリ500個表示時）
- [ ] 初期ロード時間 < 5秒
- [ ] Lighthouse スコア > 80

### ユーザー体験指標
- [ ] チュートリアル完了率 > 70%
- [ ] 平均プレイ時間 > 15分
- [ ] GitHub Star > 100（公開1ヶ月後）

---

## 次のアクション

### 今すぐ実施
1. `npm install` で依存関係インストール
2. `npm run dev` で開発サーバー起動確認
3. Phase 1.1 (React Three Fiber セットアップ) 開始

### 今週中に実施
1. 地球テクスチャの準備（NASA Blue Marble ダウンロード）
2. 3Dシーンの基本構成
3. 地球コンポーネントの実装

---

## 付録: ファイル作成順序

Phase 1で作成するファイルの推奨順序：

```
Week 2:
  1. src/components/3d/Scene.tsx
  2. src/components/3d/Earth.tsx
  3. src/components/3d/Controls.tsx
  4. src/app/game/page.tsx (ゲーム画面)

Week 3:
  5. src/lib/orbit/calculations.ts
  6. src/lib/data/generator.ts
  7. src/components/3d/Debris.tsx
  8. src/components/3d/OrbitalRegions.tsx

Week 4:
  9. src/stores/gameStore.ts
  10. src/stores/uiStore.ts
  11. src/components/ui/Header.tsx
  12. src/components/ui/SidePanel.tsx
  13. src/components/dashboard/StatsWidget.tsx
```

---

*作成日: 2025年1月*
*最終更新: 2025年1月*
*バージョン: 1.0.0*
