/**
 * Orbital Guardian - 型定義
 */

// ============================================
// 軌道要素
// ============================================

export interface OrbitalElements {
  /** 長半径 (km) */
  semiMajorAxis: number;
  /** 離心率 */
  eccentricity: number;
  /** 軌道傾斜角 (度) */
  inclination: number;
  /** 昇交点赤経 (度) */
  raan: number;
  /** 近点引数 (度) */
  argumentOfPeriapsis: number;
  /** 平均近点角 (度) */
  meanAnomaly: number;
  /** 元期 */
  epoch: Date;
}

// ============================================
// デブリ
// ============================================

export type DebrisSize = 'small' | 'medium' | 'large';
export type DebrisType = 'rocket_body' | 'payload' | 'fragment' | 'unknown';
export type DebrisStatus = 'active' | 'removed' | 'decayed';
export type DangerLevel = 1 | 2 | 3 | 4 | 5;

export interface Debris {
  id: string;
  /** NORADカタログ番号 */
  catalogNumber?: string;
  name?: string;

  /** 軌道要素 */
  orbit: OrbitalElements;

  /** 物理特性 */
  physical: {
    size: DebrisSize;
    estimatedMass?: number;
    type: DebrisType;
  };

  /** リスク評価 */
  risk: {
    collisionProbability: number;
    dangerLevel: DangerLevel;
    trackedBy: string[];
  };

  /** 現在の状態 */
  status: DebrisStatus;

  /** 3D位置（計算済み） */
  position?: [number, number, number];
}

// ============================================
// 施設
// ============================================

export type FacilityType =
  | 'radar_sband'
  | 'radar_cband'
  | 'optical_telescope'
  | 'laser_ranging'
  | 'surveillance_satellite'
  | 'removal_magnetic'
  | 'removal_net'
  | 'removal_laser';

export type FacilityStatus = 'constructing' | 'operational' | 'maintenance' | 'decommissioned';
export type LocationType = 'ground' | 'space';

export interface FacilityLocation {
  type: LocationType;
  /** 地上施設の場合 */
  latitude?: number;
  longitude?: number;
  /** 宇宙施設の場合 */
  orbit?: OrbitalElements;
}

export interface FacilityCapabilities {
  /** 監視範囲 */
  monitoringRange?: {
    minAltitude: number;
    maxAltitude: number;
    minSize: number;
  };
  /** 年間除去可能数 */
  removalCapacity?: number;
  /** 除去方式 */
  removalMethod?: 'magnetic' | 'net' | 'laser' | 'harpoon';
}

export interface Facility {
  id: string;
  type: FacilityType;
  name: string;
  location: FacilityLocation;
  capabilities: FacilityCapabilities;

  /** 運用状態 */
  operational: {
    status: FacilityStatus;
    constructionTurns: number;
    constructionRemaining?: number;
    health: number;
    fuel?: number;
  };

  /** コスト */
  cost: {
    construction: number;
    monthly: number;
  };
}

// ============================================
// 軌道帯
// ============================================

export type OrbitalRegionName = 'LEO-Lower' | 'LEO-Upper' | 'MEO' | 'GEO';
export type DebrisDensity = 'high' | 'medium' | 'low';

export interface OrbitalRegion {
  name: OrbitalRegionName;
  altitudeMin: number;
  altitudeMax: number;
  debrisDensity: DebrisDensity;
  strategicValue: number;
}

// ============================================
// ゲームリソース
// ============================================

export interface GameResources {
  /** 現在の予算（百万ドル） */
  budget: number;
  /** 年間予算配分 */
  annualBudget: number;
  /** 政治資本 (0-100) */
  politicalCapital: number;
  /** 技術ポイント */
  techPoints: number;
}

// ============================================
// イベント
// ============================================

export interface EventEffect {
  newDebris?: number;
  region?: OrbitalRegionName;
  communicationDisruption?: boolean;
  duration?: number;
  coverageBonus?: number;
  budgetChange?: number;
}

export interface EventChoice {
  label: string;
  cost: Partial<GameResources>;
  effect?: EventEffect;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  probability: number;
  effect: EventEffect;
  responseWindow?: number;
  choices?: EventChoice[];
}

export interface GameEventLog {
  eventId: string;
  turn: number;
  timestamp: Date;
  choiceMade?: string;
  outcome: string;
}

// ============================================
// ゲーム状態
// ============================================

export type Difficulty = 'beginner' | 'standard' | 'advanced' | 'expert';
export type GamePhase = 'planning' | 'execution' | 'event' | 'summary';

export interface GameMeta {
  id: string;
  createdAt: Date;
  lastSavedAt: Date;
  difficulty: Difficulty;
  version: string;
}

export interface GameProgress {
  currentTurn: number;
  maxTurns: number;
  phase: GamePhase;
}

export interface GameStatistics {
  totalDebrisRemoved: number;
  collisionsAvoided: number;
  collisionsOccurred: number;
  coverageHistory: { turn: number; coverage: number }[];
  budgetHistory: { turn: number; budget: number }[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: Date;
}

export interface GameState {
  meta: GameMeta;
  progress: GameProgress;
  resources: GameResources;
  debris: Debris[];
  facilities: Facility[];
  statistics: GameStatistics;
  eventLog: GameEventLog[];
  achievements: Achievement[];
}

// ============================================
// 最適化
// ============================================

export type ObjectiveType = 'minimize' | 'maximize';
export type ProblemType = 'set_cover' | 'facility_location' | 'multi_objective';

export interface Variable {
  name: string;
  type: 'binary' | 'integer' | 'continuous';
  lowerBound?: number;
  upperBound?: number;
}

export interface Constraint {
  name: string;
  coefficients: Record<string, number>;
  relation: '<=' | '>=' | '=';
  rhs: number;
}

export interface Objective {
  type: ObjectiveType;
  coefficients: Record<string, number>;
}

export interface OptimizationProblem {
  type: ProblemType;
  objectives: Objective[];
  constraints: Constraint[];
  variables: Variable[];
}

export type SolutionStatus = 'optimal' | 'feasible' | 'infeasible' | 'timeout';

export interface OptimizationResult {
  status: SolutionStatus;
  objectiveValue: number;
  solution: Record<string, number>;
  solvingTime: number;
  gap?: number;
}

// ============================================
// UI関連
// ============================================

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface SelectionState {
  type: 'debris' | 'facility' | 'region' | null;
  id: string | null;
}

export interface UIState {
  camera: CameraState;
  selection: SelectionState;
  showOrbitalRegions: boolean;
  showDebris: boolean;
  showFacilities: boolean;
  showCoverage: boolean;
  qualityLevel: 'low' | 'medium' | 'high';
}
