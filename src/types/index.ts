// 身体状态
export type BodyCondition = 'excellent' | 'good' | 'normal' | 'tired' | 'poor'

// 伤痛部位
export type InjuryArea = 
  | 'neck' | 'shoulder' | 'elbow' | 'wrist' | 'finger'
  | 'back' | 'rib' | 'hip' | 'knee' | 'ankle' | 'other'

// 一类标签 - 位置
export type PositionTag = 
  | 'standing'    // 站立
  | 'passing'     // 过腿
  | 'mount'       // 骑乘
  | 'sideControl' // 侧控
  | 'back'        // 拿背
  | 'turtle'      // 龟防

// 二类标签 - 动作类型
export type ActionTag = 
  | 'submission'  // 降服
  | 'escape'      // 逃脱

// 三类标签 - 降服细分（仅当二类为降服时）
export type SubmissionTag = 
  | 'jointLock'   // 关节技
  | 'choke'       // 绞技
  | 'pressure'    // 压制降服

// 招式记录
export interface Technique {
  id: string
  name: string
  classId: string
  tags: {
    position?: PositionTag
    action?: ActionTag
    submission?: SubmissionTag  // 仅当 action 为 submission 时
  }
  notes?: string
  audioUrl?: string
  photos: string[]  // base64 或 blob URL
  externalLinks: { url: string; title?: string }[]
  createdAt: string
}

// 课程记录
export interface TrainingClass {
  id: string
  date: string
  startTime?: string
  endTime?: string
  bodyCondition: BodyCondition
  injuries: { area: InjuryArea; description?: string }[]
  techniques: Technique[]
  notes?: string
  createdAt: string
}

// 标签显示映射
export const POSITION_LABELS: Record<PositionTag, string> = {
  standing: '站立',
  passing: '过腿',
  mount: '骑乘',
  sideControl: '侧控',
  back: '拿背',
  turtle: '龟防',
}

export const ACTION_LABELS: Record<ActionTag, string> = {
  submission: '降服',
  escape: '逃脱',
}

export const SUBMISSION_LABELS: Record<SubmissionTag, string> = {
  jointLock: '关节技',
  choke: '绞技',
  pressure: '压制降服',
}

export const BODY_CONDITION_LABELS: Record<BodyCondition, string> = {
  excellent: '精力充沛',
  good: '状态良好',
  normal: '一般',
  tired: '疲惫',
  poor: '状态不佳',
}

export const INJURY_AREA_LABELS: Record<InjuryArea, string> = {
  neck: '颈部',
  shoulder: '肩膀',
  elbow: '肘部',
  wrist: '手腕',
  finger: '手指',
  back: '背部',
  rib: '肋骨',
  hip: '髋部',
  knee: '膝盖',
  ankle: '脚踝',
  other: '其他',
}
