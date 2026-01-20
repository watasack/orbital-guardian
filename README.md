# 🛡️ Orbital Guardian

**宇宙デブリ監視・除去ネットワーク最適化ゲーム**

数理最適化（施設配置問題・集合被覆問題）を学びながら、地球軌道を守る戦略シミュレーションゲームです。

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Three.js](https://img.shields.io/badge/Three.js-React%20Three%20Fiber-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 デモ

**[► プレイする](https://orbital-guardian.vercel.app)**

## 📖 概要

2030年代、増加し続ける宇宙デブリが地球軌道の持続可能性を脅かしています。
あなたは国際宇宙デブリ対策機関の指揮官として、監視レーダー網と除去衛星を最適配置し、
**ケスラーシンドローム**（連鎖的衝突による軌道崩壊）を防ぐミッションに挑みます。

### ゲームの特徴

- 🌍 **リアルな3D地球表示** - WebGLによるインタラクティブな軌道可視化
- 🎯 **数理最適化** - 集合被覆問題・施設配置問題をゲーム内で学習
- 🛰️ **施設建設** - 地上レーダー、監視衛星、除去衛星を戦略的に配置
- ⏱️ **ターン制シミュレーション** - 10年間（120ターン）の長期戦略
- 📊 **最適化ソルバー** - LPソルバーで最適な施設配置を自動計算

## 🚀 クイックスタート

### 必要環境

- Node.js 18+
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/orbital-guardian.git
cd orbital-guardian

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 🎯 遊び方

### 基本操作

| 操作 | アクション |
|------|----------|
| 左ドラッグ | 視点を回転 |
| 右ドラッグ | 視点をパン（移動） |
| スクロール | ズームイン/アウト |
| クリック | デブリを選択 |

### キーボードショートカット

| キー | アクション |
|------|----------|
| `?` | ヘルプを表示 |
| `B` | 建設メニューを開く |
| `O` | 最適化パネルを開く |
| `Space` | 次のターンへ |

### ゲームの流れ

1. **計画フェーズ**: 施設の建設・配置を決定
2. **実行フェーズ**: アクションが実行される
3. **イベントフェーズ**: ランダムイベントが発生する可能性
4. **サマリーフェーズ**: 結果を確認し、次のターンへ

### 勝敗条件

- **勝利**: 120ターン（10年間）を生き残る
- **敗北**: 予算枯渇、または重大衝突が3回発生

## 🔧 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| 3Dレンダリング | React Three Fiber, Three.js |
| 状態管理 | Zustand |
| スタイリング | Tailwind CSS |
| アニメーション | Framer Motion |
| 最適化ソルバー | javascript-lp-solver |

## 📁 プロジェクト構成

```
orbital-guardian/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # ランディングページ
│   │   └── game/         # ゲームページ
│   ├── components/
│   │   ├── 3d/           # 3Dコンポーネント（地球、デブリ等）
│   │   ├── ui/           # UIコンポーネント
│   │   └── optimization/ # 最適化関連コンポーネント
│   ├── lib/
│   │   ├── game/         # ゲームロジック
│   │   ├── orbit/        # 軌道計算
│   │   └── solver/       # 最適化ソルバー
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript型定義
├── public/
│   └── assets/           # 静的アセット（テクスチャ等）
└── docs/
    ├── DESIGN.md         # 基本設計書
    └── DEVELOPMENT_PLAN.md # 開発計画書
```

## 📐 数理最適化について

本ゲームでは、以下の数理最適化問題を扱います：

### 集合被覆問題 (Set Covering Problem)

$$\text{minimize} \quad \sum_{j \in \mathcal{J}} c_j \cdot x_j$$

$$\text{subject to} \quad \sum_{j \in \mathcal{J}} a_{ij} \cdot x_j \geq 1 \quad \forall i \in \mathcal{I}$$

- $\mathcal{I}$: デブリ（監視対象）の集合
- $\mathcal{J}$: 施設候補地点の集合
- $c_j$: 地点jに施設を設置するコスト
- $a_{ij}$: 地点jから対象iを監視できれば1、そうでなければ0
- $x_j$: 地点jに施設を設置するか（決定変数）

## 🤝 コントリビュート

プルリクエストを歓迎します！バグ報告や機能提案は[Issues](https://github.com/yourusername/orbital-guardian/issues)へどうぞ。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 🙏 謝辞

- [NASA](https://nasa.gov) - Blue Marble テクスチャ
- [CelesTrak](https://celestrak.org) - 軌道データ参考
- [Three.js](https://threejs.org) - 3Dレンダリングライブラリ

---

**地球軌道を守ろう。未来の宇宙開発のために。** 🌍✨
