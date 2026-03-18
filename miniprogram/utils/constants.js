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
  pass: '过人',
  td: '抱摔',
  sweep: '扫技',
  escape: '逃脱',
  sprawl: '防摔',
  drill: '移动',
  /* 兼容旧数据 */
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
const ACTION_OPTIONS = ['sub', 'pass', 'td', 'sweep', 'escape', 'sprawl', 'drill']

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
const STEP_ACTION_OPTIONS = ['sub', 'pass', 'td', 'sweep', 'escape']

module.exports = {
  POSITION_LABELS,
  ACTION_LABELS,
  BODY_CONDITION_LABELS,
  INJURY_AREA_LABELS,
  BODY_OPTIONS,
  INJURY_OPTIONS,
  POSITION_OPTIONS,
  ACTION_OPTIONS,
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
}
