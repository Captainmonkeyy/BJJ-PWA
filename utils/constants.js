/* 第一维度：位置标签 (Position Tags) - 动作发生时的初始身体相对状态 */
const POSITION_LABELS = {
  closedGuard: '封闭防守',
  halfGuard: '半防守',
  openGuard: '开放防守',
  deepHalf: '深半防守',
  sideControl: '侧向压制',
  mount: '骑乘位',
  northSouth: '南北位',
  kob: '浮固',
  backControl: '拿背',
  standing: '站立',
  turtle: '龟缩位',
  /* 兼容旧数据 */
  passing: '过腿',
  back: '拿背',
}

/* 第二维度：动作类型标签 (Action Tags) - 在该位置下执行的动作目标 */
const ACTION_LABELS = {
  sub: '降服',
  escape: '逃脱',
  pass: '过腿',
  sweep: '扫技',
  td: '抱摔',
  sprawl: '防抱摔',
  control: '控制',
  /* 兼容旧数据 */
  drill: '移动',
  submission: '降服',
}

const BODY_CONDITION_LABELS = {
  excellent: '精力充沛',
  good: '状态良好',
  normal: '一般',
  tired: '疲惫',
  poor: '状态不佳',
}

const INJURY_AREA_LABELS = {
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

const BODY_OPTIONS = ['excellent', 'good', 'normal', 'tired', 'poor']
const INJURY_OPTIONS = ['neck', 'shoulder', 'elbow', 'wrist', 'finger', 'back', 'rib', 'hip', 'knee', 'ankle', 'other']
const POSITION_OPTIONS = ['closedGuard', 'halfGuard', 'openGuard', 'deepHalf', 'sideControl', 'mount', 'northSouth', 'kob', 'backControl', 'standing', 'turtle']
/** 新建招式 · 动作类型预设（与 flow 画布步骤选项 STEP_ACTION_OPTIONS 可独立） */
const ACTION_OPTIONS = ['sub', 'escape', 'pass', 'sweep', 'td', 'sprawl', 'control']

/** 添加/编辑招式时的预设位置（九项） */
const TECH_POSITION_OPTIONS = [
  'sidePin',
  'kob',
  'mount',
  'backControl',
  'turtle',
  'halfGuard',
  'closedGuard',
  'openGuard',
  'standing',
]
const TECH_POSITION_LABELS = {
  sidePin: '侧控',
  kob: '浮固',
  mount: '骑乘',
  backControl: '拿背',
  turtle: '龟防',
  halfGuard: '半防',
  closedGuard: '全防',
  openGuard: '开放式防守',
  standing: '站立',
}

const LEGACY_TECH_POSITION_LABELS = {
  guard: '全防',
  kneePin: '浮固',
}

function formatTechPosition(value) {
  if (!value) return ''
  if (TECH_POSITION_LABELS[value]) return TECH_POSITION_LABELS[value]
  if (LEGACY_TECH_POSITION_LABELS[value]) return LEGACY_TECH_POSITION_LABELS[value]
  return POSITION_LABELS[value] || value
}

function formatTechAction(value) {
  if (!value) return ''
  return ACTION_LABELS[value] || value
}

/** 将任意招式位置键归到当前预设九项之一（统计/日历摘要用），无法识别则为 other */
const POSITION_KEY_TO_TECH_STAT = {
  guard: 'closedGuard',
  closedGuard: 'closedGuard',
  halfGuard: 'halfGuard',
  openGuard: 'openGuard',
  deepHalf: 'halfGuard',
  sidePin: 'sidePin',
  sideControl: 'sidePin',
  northSouth: 'sidePin',
  passing: 'sidePin',
  kneePin: 'kob',
  kob: 'kob',
  mount: 'mount',
  backControl: 'backControl',
  back: 'backControl',
  turtle: 'turtle',
  standing: 'standing',
}

function mapPositionToBaseSix(positionKey) {
  if (!positionKey || typeof positionKey !== 'string') return 'other'
  if (TECH_POSITION_OPTIONS.indexOf(positionKey) >= 0) return positionKey
  return POSITION_KEY_TO_TECH_STAT[positionKey] || 'other'
}

// 流程起始：上位/下位
const START_POSITION_OPTIONS = ['top', 'bottom']
const START_POSITION_LABELS = { top: '上位', bottom: '下位' }
// 上位动作
const TOP_ACTION_OPTIONS = ['sub', 'td', 'pass']
const TOP_ACTION_LABELS = { sub: '降服', td: '抱摔', pass: '过腿' }
// 下位动作
const BOTTOM_ACTION_OPTIONS = ['closedGuard', 'halfGuard', 'openGuard', 'deepHalf']
const BOTTOM_ACTION_LABELS = { closedGuard: '封闭防守', halfGuard: '半防守', openGuard: '开放防守', deepHalf: '深半防守' }

// 步骤状态：压制/逃脱
const STEP_STATE_OPTIONS = ['control', 'escape']
const STEP_STATE_LABELS = { control: '压制', escape: '逃脱' }
// 步骤位置（用于步骤勾选）
const STEP_POSITION_OPTIONS = ['closedGuard', 'halfGuard', 'openGuard', 'deepHalf', 'sideControl', 'mount', 'northSouth', 'kob', 'backControl', 'turtle']
const STEP_ACTION_OPTIONS = ['sub', 'escape', 'pass', 'sweep', 'td', 'sprawl', 'control']

/** 实战表现 · 上课状态（预设；另支持本地自定义字符串标签） */
const SESSION_CLASS_STATE_OPTIONS = ['stateGreat', 'stateOk', 'stateFair', 'stateTired', 'stateRecovering']
const SESSION_CLASS_STATE_LABELS = {
  stateGreat: '状态很好',
  stateOk: '尚可',
  stateFair: '一般',
  stateTired: '疲惫',
  stateRecovering: '伤后恢复中',
  great: '状态很好',
  ok: '一般',
  fatigued: '疲惫',
  recovering: '伤后恢复',
  crowded: '课很满',
  light: '轻松',
}

function formatSessionClassStateLabel(val) {
  if (val == null || val === '') return ''
  const s = String(val)
  if (SESSION_CLASS_STATE_LABELS[s]) return SESSION_CLASS_STATE_LABELS[s]
  return s
}

/** 实战表现 · 疼痛部位标签（预设 + 自定义） */
const SESSION_PAIN_AREA_OPTIONS = ['painNone', 'painFoot', 'painLeg', 'painElbow', 'painNeck', 'painTorso']
const SESSION_PAIN_AREA_LABELS = {
  painNone: '无不适',
  painFoot: '脚',
  painLeg: '腿',
  painElbow: '手肘',
  painNeck: '脖子',
  painTorso: '躯干',
}

function formatSessionPainTagLabel(val) {
  if (val == null || val === '') return ''
  const s = String(val)
  if (SESSION_PAIN_AREA_LABELS[s]) return SESSION_PAIN_AREA_LABELS[s]
  return s
}

module.exports = {
  POSITION_LABELS,
  ACTION_LABELS,
  BODY_CONDITION_LABELS,
  INJURY_AREA_LABELS,
  BODY_OPTIONS,
  INJURY_OPTIONS,
  POSITION_OPTIONS,
  ACTION_OPTIONS,
  TECH_POSITION_OPTIONS,
  TECH_POSITION_LABELS,
  formatTechPosition,
  formatTechAction,
  mapPositionToBaseSix,
  START_POSITION_OPTIONS,
  START_POSITION_LABELS,
  TOP_ACTION_OPTIONS,
  TOP_ACTION_LABELS,
  BOTTOM_ACTION_OPTIONS,
  BOTTOM_ACTION_LABELS,
  STEP_STATE_OPTIONS,
  STEP_STATE_LABELS,
  STEP_POSITION_OPTIONS,
  STEP_ACTION_OPTIONS,
  SESSION_CLASS_STATE_OPTIONS,
  SESSION_CLASS_STATE_LABELS,
  formatSessionClassStateLabel,
  SESSION_PAIN_AREA_OPTIONS,
  SESSION_PAIN_AREA_LABELS,
  formatSessionPainTagLabel,
}
