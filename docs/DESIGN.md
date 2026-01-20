# Orbital Guardian - 基本設計書

## 1. プロジェクト概要

### 1.1 プロジェクト名
**Orbital Guardian** - 宇宙デブリ監視・除去ネットワーク最適化ゲーム

### 1.2 コンセプト
プレイヤーは国際宇宙デブリ対策機構（ISDA: International Space Debris Agency）のオペレーションディレクターとして、限られた予算で地球軌道を守る監視・除去ネットワークを構築・運用する。

数理最適化（施設配置問題、集合被覆問題）をゲームを通じて体験的に学びながら、現実の宇宙デブリ問題への理解を深めることを目的とする。

### 1.3 背景と社会的意義

#### 宇宙デブリ問題の現状
- **追跡可能なデブリ（10cm以上）**: 約36,000個
- **追跡困難なデブリ（1-10cm）**: 約1,000,000個
- **微小デブリ（1mm-1cm）**: 約130,000,000個
- **運用中の衛星**: 約10,000機（2024年時点）
- **計画中の衛星（2030年まで）**: 約50,000機以上

#### ケスラーシンドローム
デブリ同士の衝突が連鎖的に発生し、特定の軌道高度が使用不能になるリスク。2009年のイリジウム-コスモス衝突で2,000個以上のデブリが発生した事例がある。

### 1.4 ターゲットユーザー
- 数理最適化を学ぶ大学生・大学院生
- STEM教育に関心のある教育者
- 宇宙技術・宇宙政策に興味のある一般ユーザー
- ゲームを通じて社会課題を学びたいユーザー

---

## 2. 技術スタック

### 2.1 フロントエンド

| カテゴリ | 技術 | 理由 |
|---------|------|------|
| フレームワーク | Next.js 14 (App Router) | Vercelとの親和性、SSR/SSG対応 |
| 言語 | TypeScript | 型安全性、開発効率 |
| 3D描画 | React Three Fiber + drei | React統合、宣言的3D |
| スタイリング | Tailwind CSS | 高速開発、カスタマイズ性 |
| アニメーション | Framer Motion | 滑らかなUI遷移 |
| 状態管理 | Zustand | 軽量、TypeScript親和性 |
| チャート | Recharts / Visx | データ可視化 |

### 2.2 3D/ビジュアル

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| ポストプロセス | @react-three/postprocessing | Bloom、色収差等 |
| 地球テクスチャ | NASA Blue Marble | リアルな地球表現 |
| 軌道計算 | satellite.js | SGP4軌道伝播 |
| シェーダー | GLSL (カスタム) | 大気効果、軌道リング |

### 2.3 最適化ソルバー

| フェーズ | 技術 | 説明 |
|---------|------|------|
| 初期 | javascript-lp-solver | 純JS、軽量、ブラウザ内実行 |
| 拡張時 | GLPK.js (WebAssembly) | より大規模な問題に対応 |
| 将来 | サーバーサイドAPI | PuLP/OR-Tools (Python) |

### 2.4 データソース

| ソース | 用途 | ライセンス |
|--------|------|-----------|
| シミュレーション生成 | デフォルトデータ | 自作 |
| CelesTrak | TLE/GP形式の軌道データ | 公開利用可 |
| Space-Track.org | 詳細な軌道カタログ | 要登録、再配布制限 |
| NASA ODPO | 統計データ、レポート | Public Use Permitted |

### 2.5 インフラ

| カテゴリ | 技術 |
|---------|------|
| ホスティング | Vercel |
| リポジトリ | GitHub |
| CI/CD | GitHub Actions + Vercel |

---

## 3. ゲームシステム設計

### 3.1 ゲームモード

#### ターン制
- **1ターン = 1ヶ月**（ゲーム内時間）
- プレイヤーはターン開始時にアクションを選択
- ターン終了時にシミュレーション実行、結果表示

#### 難易度設定

| 難易度 | デブリ数 | 予算 | イベント頻度 | 推奨プレイ時間 |
|--------|---------|------|-------------|---------------|
| 入門 | 50-100 | 潤沢 | 低 | 30分 |
| 標準 | 300-500 | 普通 | 中 | 1-2時間 |
| 上級 | 1,000-3,000 | 厳しい | 高 | 2-3時間 |
| エキスパート | 5,000+ | 最小限 | 最高 | 3時間以上 |

### 3.2 軌道帯の定義

```typescript
interface OrbitalRegion {
  name: string;
  altitudeMin: number; // km
  altitudeMax: number; // km
  debrisDensity: 'high' | 'medium' | 'low';
  strategicValue: number; // 1-10
}

const ORBITAL_REGIONS: OrbitalRegion[] = [
  {
    name: 'LEO-Lower',
    altitudeMin: 200,
    altitudeMax: 600,
    debrisDensity: 'high',
    strategicValue: 8
  },
  {
    name: 'LEO-Upper',
    altitudeMin: 600,
    altitudeMax: 1200,
    debrisDensity: 'high',
    strategicValue: 9
  },
  {
    name: 'MEO',
    altitudeMin: 2000,
    altitudeMax: 35786,
    debrisDensity: 'medium',
    strategicValue: 7
  },
  {
    name: 'GEO',
    altitudeMin: 35786,
    altitudeMax: 36000,
    debrisDensity: 'low',
    strategicValue: 10
  }
];
```

### 3.3 施設タイプ

#### 地上施設

| 施設名 | コスト | 維持費/月 | 監視範囲 | 特徴 |
|--------|-------|----------|---------|------|
| Sバンドレーダー | $50M | $0.5M | LEO, 10cm以上 | 天候影響小 |
| Cバンドレーダー | $100M | $1M | LEO-MEO, 5cm以上 | 高精度追跡 |
| 光学望遠鏡 | $30M | $0.3M | MEO-GEO | 夜間・晴天のみ |
| レーザー測距局 | $80M | $0.8M | 全軌道, mm精度 | 協力対象のみ |

#### 宇宙施設

| 施設名 | コスト | 維持費/月 | 性能 | 特徴 |
|--------|-------|----------|------|------|
| 監視衛星 | $150M | $2M | 全方位監視 | 軌道維持必要 |
| 除去衛星（磁石式） | $200M | $3M | 年間5個除去 | 金属デブリのみ |
| 除去衛星（網式） | $180M | $2.5M | 年間3個除去 | 不規則形状対応 |
| 除去衛星（レーザー） | $300M | $5M | 年間20個除去 | 小型デブリ対応 |

### 3.4 リソース管理

```typescript
interface GameResources {
  budget: number;           // 現在の予算（百万ドル）
  annualBudget: number;     // 年間予算配分
  politicalCapital: number; // 政治資本（0-100）
  techPoints: number;       // 技術ポイント
}
```

### 3.5 イベントシステム

```typescript
interface GameEvent {
  id: string;
  name: string;
  description: string;
  probability: number;      // 月あたりの発生確率
  effect: EventEffect;
  responseWindow?: number;  // 対応可能時間（ターン数）
  choices?: EventChoice[];  // プレイヤーの選択肢
}

// イベント例
const EVENTS: GameEvent[] = [
  {
    id: 'satellite_collision',
    name: '衛星衝突事故',
    description: '運用中の衛星とデブリが衝突しました',
    probability: 0.02,
    effect: { newDebris: 500, region: 'LEO-Upper' },
    responseWindow: 3
  },
  {
    id: 'solar_flare',
    name: '太陽フレア',
    description: '大規模な太陽フレアが発生しました',
    probability: 0.05,
    effect: { communicationDisruption: true, duration: 2 }
  },
  {
    id: 'international_cooperation',
    name: '国際協力協定',
    description: '他国との監視データ共有が可能になりました',
    probability: 0.08,
    effect: { coverageBonus: 0.1 },
    choices: [
      { label: '協定に参加', cost: { politicalCapital: -10 } },
      { label: '見送る', cost: {} }
    ]
  }
];
```

---

## 4. 数理最適化問題の定式化

### 4.1 監視ネットワーク配置問題（Set Covering Problem）

#### 問題定義
最小コストで全デブリ（または軌道セグメント）を監視可能にする施設配置を求める。

#### 数式

```
【集合】
I = {1, 2, ..., m}     : 監視対象（デブリ/軌道セグメント）
J = {1, 2, ..., n}     : 施設候補地点

【パラメータ】
c_j     : 地点jに施設を設置するコスト
a_ij    : 地点jから対象iを監視可能なら1、そうでなければ0
B       : 予算上限

【決定変数】
x_j ∈ {0, 1} : 地点jに施設を設置するか

【定式化】
目的: minimize Σ_j c_j * x_j
制約:
  (1) Σ_j a_ij * x_j ≥ 1,  ∀i ∈ I  (全対象をカバー)
  (2) Σ_j c_j * x_j ≤ B            (予算制約)
  (3) x_j ∈ {0, 1},       ∀j ∈ J
```

### 4.2 除去衛星配置問題（Capacitated Facility Location Problem）

#### 問題定義
危険デブリへの応答時間を最小化しつつ、除去衛星を最適配置する。

#### 数式

```
【追加パラメータ】
d_ij    : 待機位置jからデブリiへの到達時間（ΔV換算）
Q_j     : 位置jの除去衛星の年間処理能力
r_i     : デブリiの危険度（衝突確率 × 影響度）

【決定変数】
x_j ∈ {0, 1}     : 位置jに除去衛星を配置
y_ij ∈ {0, 1}    : デブリiを位置jの衛星が担当

【定式化】
目的: minimize Σ_i Σ_j r_i * d_ij * y_ij

制約:
  (1) Σ_j y_ij = 1,              ∀i  (各デブリは1衛星が担当)
  (2) Σ_i y_ij ≤ Q_j * x_j,      ∀j  (容量制約)
  (3) Σ_j c_j * x_j ≤ B               (予算制約)
  (4) d_ij * y_ij ≤ T_max,       ∀i,j (最大応答時間)
  (5) x_j, y_ij ∈ {0, 1}
```

### 4.3 実装インターフェース

```typescript
interface OptimizationProblem {
  type: 'set_cover' | 'facility_location' | 'multi_objective';
  objectives: Objective[];
  constraints: Constraint[];
  variables: Variable[];
}

interface OptimizationResult {
  status: 'optimal' | 'feasible' | 'infeasible' | 'timeout';
  objectiveValue: number;
  solution: Record<string, number>;
  solvingTime: number;
  gap?: number;  // 最適解との差（%）
}

interface SolverService {
  solve(problem: OptimizationProblem): Promise<OptimizationResult>;
  getExplanation(): string;  // 学習モード用の解説
}
```

---

## 5. UI/UX設計

### 5.1 デザインコンセプト

**「宇宙管制室」** をコンセプトとした、プロフェッショナルかつ未来的なインターフェース。

#### デザイン原則
1. **情報密度**: 必要な情報を一覧できるダッシュボード形式
2. **階層構造**: 概要→詳細への段階的な情報開示
3. **リアルタイム感**: アニメーション、リアルタイム更新
4. **没入感**: 3D表示による宇宙空間の表現

### 5.2 カラーパレット

```css
:root {
  /* 背景系 */
  --bg-space: #050510;           /* 宇宙空間 */
  --bg-surface: #0f0f1a;         /* パネル背景 */
  --bg-elevated: #1a1a2e;        /* 浮き上がったパネル */
  
  /* プライマリ（シアン系） */
  --primary-100: #e0f7ff;
  --primary-400: #22d3ee;
  --primary-500: #06b6d4;
  --primary-600: #0891b2;
  
  /* ステータス */
  --status-safe: #10b981;        /* 緑: 安全 */
  --status-warning: #f59e0b;     /* 黄: 注意 */
  --status-danger: #ef4444;      /* 赤: 危険 */
  --status-critical: #dc2626;    /* 濃い赤: 緊急 */
  
  /* アクセント */
  --accent-purple: #8b5cf6;
  --accent-blue: #3b82f6;
  
  /* テキスト */
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  
  /* ボーダー・グロー */
  --border-subtle: rgba(255, 255, 255, 0.1);
  --glow-cyan: rgba(6, 182, 212, 0.5);
}
```

### 5.3 タイポグラフィ

```css
/* 見出し: モダンなサンセリフ */
--font-display: 'Space Grotesk', 'Noto Sans JP', sans-serif;

/* 本文: 読みやすさ重視 */
--font-body: 'Inter', 'Noto Sans JP', sans-serif;

/* 数値・データ: 等幅 */
--font-mono: 'JetBrains Mono', 'Noto Sans JP', monospace;
```

### 5.4 画面構成

#### メイン画面レイアウト

```
┌─────────────────────────────────────────────────────────────────┐
│ ORBITAL GUARDIAN          [Turn: 24/120]  [Budget: $2,450M]    │
│ ─────────────────────────────────────────────────────────────  │
├─────────────────────────────────────┬───────────────────────────┤
│                                     │  ALERTS                   │
│                                     │  ┌─────────────────────┐  │
│                                     │  │ ⚠ 衝突リスク検出    │  │
│       [ 3D EARTH VIEW ]             │  │   Object #12847     │  │
│                                     │  │   残り48時間        │  │
│       軌道・デブリ・施設の          │  └─────────────────────┘  │
│       インタラクティブ表示          │                           │
│                                     │  STATISTICS               │
│                                     │  ┌─────────────────────┐  │
│                                     │  │ 監視カバー率: 78%   │  │
│                                     │  │ 除去済み: 127/500   │  │
│                                     │  │ 危険度指数: 42      │  │
├─────────────────────────────────────┴───────────────────────────┤
│  [MONITOR]  [REMOVE]  [BUILD]  [OPTIMIZE]  [DIPLOMACY]  [NEXT] │
└─────────────────────────────────────────────────────────────────┘
```

#### 最適化モーダル

```
┌─────────────────────────────────────────────────────────────────┐
│ OPTIMIZATION SOLVER                                        [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  目的関数:  ○ コスト最小化                                      │
│            ● カバー率最大化                                     │
│            ○ バランス型                                         │
│                                                                 │
│  制約条件:                                                      │
│    予算上限: [$____500____] M                                   │
│    最低カバー率: [___85___] %                                   │
│    最大応答時間: [___72___] 時間                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  minimize  Σ c_j · x_j                                  │   │
│  │  s.t.      Σ a_ij · x_j ≥ 1  ∀i                         │   │
│  │            Σ c_j · x_j ≤ 500                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [SOLVE]                        [Show Explanation]              │
│                                                                 │
│  Result: ✓ 最適解発見 (0.23秒)                                  │
│  推奨配置: 地上局 x3, 監視衛星 x2                               │
│  推定コスト: $380M                                              │
│  推定カバー率: 91%                                              │
│                                                                 │
│           [APPLY SOLUTION]    [MODIFY]    [CANCEL]              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 3D表示仕様

#### 地球
- NASA Blue Marbleテクスチャ（昼面）
- 都市光テクスチャ（夜面）
- 雲レイヤー（ゆっくり回転）
- 大気グロー効果（シェーダー）

#### 軌道帯
- 半透明のリング/球殻で軌道帯を表示
- カバー済み領域と未カバー領域を色分け
- ホバー時に軌道帯情報をツールチップ表示

#### デブリ
- InstancedMeshで大量描画（〜10,000個）
- 危険度による色分け（緑→黄→赤）
- 危険なデブリは点滅/パルス効果
- クリックで詳細情報表示

#### 施設
- 地上施設: 地球表面上のマーカー
- 宇宙施設: 3Dモデル + 監視範囲の可視化
- 選択時: 軌道線/監視範囲をハイライト

### 5.6 アニメーション

```typescript
// Framer Motion のバリアント例
const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

const alertVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300 }
  },
  pulse: {
    boxShadow: [
      '0 0 0 0 rgba(239, 68, 68, 0.4)',
      '0 0 0 10px rgba(239, 68, 68, 0)',
    ],
    transition: { duration: 1, repeat: Infinity }
  }
};
```

---

## 6. データ設計

### 6.1 デブリデータ構造

```typescript
interface Debris {
  id: string;
  catalogNumber?: string;        // NORAD カタログ番号
  name?: string;
  
  // 軌道要素（Keplerian）
  orbit: {
    semiMajorAxis: number;       // 長半径 (km)
    eccentricity: number;        // 離心率
    inclination: number;         // 軌道傾斜角 (deg)
    raan: number;                // 昇交点赤経 (deg)
    argumentOfPeriapsis: number; // 近点引数 (deg)
    meanAnomaly: number;         // 平均近点角 (deg)
    epoch: Date;                 // 元期
  };
  
  // 物理特性
  physical: {
    size: 'small' | 'medium' | 'large';  // <10cm, 10cm-1m, >1m
    estimatedMass?: number;              // kg
    type: 'rocket_body' | 'payload' | 'fragment' | 'unknown';
  };
  
  // リスク評価
  risk: {
    collisionProbability: number;  // 衝突確率 (0-1)
    dangerLevel: 1 | 2 | 3 | 4 | 5;
    trackedBy: string[];           // 監視している施設ID
  };
  
  // 状態
  status: 'active' | 'removed' | 'decayed';
}
```

### 6.2 施設データ構造

```typescript
interface Facility {
  id: string;
  type: FacilityType;
  name: string;
  
  // 位置
  location: {
    type: 'ground' | 'space';
    // 地上の場合
    latitude?: number;
    longitude?: number;
    // 宇宙の場合
    orbit?: OrbitalElements;
  };
  
  // 性能
  capabilities: {
    monitoringRange?: {
      minAltitude: number;
      maxAltitude: number;
      minSize: number;           // 検出可能最小サイズ (cm)
    };
    removalCapacity?: number;    // 年間除去可能数
    removalMethod?: 'magnetic' | 'net' | 'laser' | 'harpoon';
  };
  
  // 運用
  operational: {
    status: 'constructing' | 'operational' | 'maintenance' | 'decommissioned';
    constructionTurns: number;   // 建設に必要なターン数
    health: number;              // 0-100
    fuel?: number;               // 宇宙施設の場合、ΔV残量
  };
  
  // コスト
  cost: {
    construction: number;        // 建設コスト ($M)
    monthly: number;             // 月間維持費 ($M)
  };
}
```

### 6.3 ゲーム状態

```typescript
interface GameState {
  // メタ情報
  meta: {
    id: string;
    createdAt: Date;
    lastSavedAt: Date;
    difficulty: 'beginner' | 'standard' | 'advanced' | 'expert';
    version: string;
  };
  
  // 進行状況
  progress: {
    currentTurn: number;
    maxTurns: number;
    phase: 'planning' | 'execution' | 'event' | 'summary';
  };
  
  // リソース
  resources: GameResources;
  
  // エンティティ
  debris: Debris[];
  facilities: Facility[];
  
  // 統計
  statistics: {
    totalDebrisRemoved: number;
    collisionsAvoided: number;
    collisionsOccurred: number;
    coverageHistory: { turn: number; coverage: number }[];
    budgetHistory: { turn: number; budget: number }[];
  };
  
  // イベント履歴
  eventLog: GameEventLog[];
  
  // 達成状況
  achievements: Achievement[];
}
```

---

## 7. API設計

### 7.1 データ取得API

```typescript
// /api/data/debris
// シミュレーションデータまたはキャッシュされた実データを返す
GET /api/data/debris?difficulty=standard&region=LEO

Response: {
  debris: Debris[];
  metadata: {
    source: 'simulation' | 'celestrak' | 'spacetrack';
    generatedAt: string;
    count: number;
  };
}

// /api/data/tle
// CelesTrakからTLEデータを取得（プロキシ）
GET /api/data/tle?category=debris

Response: {
  tleData: string;  // TLE形式のテキスト
  objectCount: number;
  fetchedAt: string;
}
```

### 7.2 最適化API

```typescript
// /api/solve
// 最適化問題を解く
POST /api/solve

Request: {
  problemType: 'set_cover' | 'facility_location';
  parameters: {
    budget: number;
    minCoverage?: number;
    maxResponseTime?: number;
  };
  debris: { id: string; position: [number, number, number]; risk: number }[];
  candidateSites: { id: string; position: [number, number, number]; cost: number }[];
}

Response: {
  status: 'optimal' | 'feasible' | 'infeasible';
  solution: {
    selectedSites: string[];
    objectiveValue: number;
    coverage: number;
    totalCost: number;
  };
  explanation?: string;  // 学習モード用
  solvingTime: number;
}
```

---

## 8. セキュリティ・プライバシー

### 8.1 データ取り扱い
- ユーザーのAPIキー（Space-Track等）はローカルストレージに保存、サーバーには送信しない
- ゲームの進行状況はローカルストレージに保存
- 将来的にクラウド同期を実装する場合は認証を導入

### 8.2 外部API利用
- CelesTrakへのリクエストはサーバーサイドでプロキシ（CORS対策）
- レート制限を実装し、APIの濫用を防止

---

## 9. パフォーマンス要件

### 9.1 目標値

| 指標 | 目標 | 最低限 |
|------|------|--------|
| 初期ロード時間 | < 3秒 | < 5秒 |
| 3D描画FPS (デスクトップ) | 60fps | 30fps |
| 3D描画FPS (モバイル) | 30fps | 15fps |
| 最適化ソルバー応答時間 | < 2秒 | < 10秒 |
| メモリ使用量 | < 500MB | < 1GB |

### 9.2 最適化戦略

1. **3D描画**
   - InstancedMeshで同型オブジェクトをバッチ描画
   - LOD (Level of Detail) でカメラ距離に応じた詳細度調整
   - Frustum Cullingで視界外オブジェクトをスキップ

2. **データ処理**
   - Web Workerでメインスレッドをブロックしない
   - 大規模データは遅延読み込み（pagination）

3. **バンドルサイズ**
   - Tree Shaking
   - 動的インポート（code splitting）
   - 画像・テクスチャの最適化（WebP, 圧縮）

---

## 10. 開発ロードマップ

### Phase 1: MVP（4週間）

#### Week 1-2: 基盤構築
- [ ] プロジェクトセットアップ（Next.js, TypeScript, Tailwind）
- [ ] 基本的な3D地球表示
- [ ] デブリのシミュレーションデータ生成
- [ ] 基本的なUI骨格

#### Week 3-4: コア機能
- [ ] ターン進行システム
- [ ] 施設配置機能
- [ ] 基本的な最適化ソルバー統合
- [ ] スコアリングシステム

### Phase 2: 機能拡充（4週間）

#### Week 5-6: ゲーム性強化
- [ ] イベントシステム
- [ ] 複数の施設タイプ
- [ ] 難易度設定
- [ ] チュートリアル

#### Week 7-8: ビジュアル強化
- [ ] ポストプロセス効果
- [ ] アニメーション充実
- [ ] レスポンシブ対応
- [ ] パフォーマンス最適化

### Phase 3: 拡張（4週間）

#### Week 9-10: データ連携
- [ ] CelesTrak連携
- [ ] Space-Track連携（オプション）
- [ ] データ可視化強化

#### Week 11-12: 公開準備
- [ ] テスト・バグ修正
- [ ] ドキュメント整備
- [ ] Vercelデプロイ
- [ ] GitHub公開

---

## 11. ライセンス

### ソースコード
MIT License

### 使用データの帰属
- 軌道データ: Space-Track.org, CelesTrak
- 地球テクスチャ: NASA Blue Marble (Public Domain)
- アイコン: [使用するライブラリに応じて記載]

---

## 付録

### A. 用語集

| 用語 | 説明 |
|------|------|
| TLE (Two-Line Element) | 人工衛星の軌道要素を2行で表現する形式 |
| LEO (Low Earth Orbit) | 地球低軌道（高度200-2000km） |
| MEO (Medium Earth Orbit) | 中軌道（高度2000-35786km） |
| GEO (Geostationary Orbit) | 静止軌道（高度約35786km） |
| ΔV (Delta-V) | 軌道変更に必要な速度変化量 |
| SGP4 | 衛星の軌道伝播に使用される標準的なアルゴリズム |

### B. 参考文献

1. ESA Space Debris Office - https://www.esa.int/Space_Safety/Space_Debris
2. NASA Orbital Debris Program Office - https://orbitaldebris.jsc.nasa.gov/
3. Space-Track.org Documentation - https://www.space-track.org/documentation
4. CelesTrak - https://celestrak.org/

---

*最終更新: 2025年1月*
*バージョン: 1.0.0*
