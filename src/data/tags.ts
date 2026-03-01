import type { PositionTag, ActionTag, SubmissionTag } from '../types'

// 树状结构标签定义（用于树状页面展示和拖拽排序）
export interface TagTreeNode {
  id: string
  label: string
  type: 'position' | 'action' | 'submission'
  value?: PositionTag | ActionTag | SubmissionTag
  children?: TagTreeNode[]
}

// 默认树状结构顺序（用户可拖动调整）
export const DEFAULT_TAG_TREE: TagTreeNode[] = [
  {
    id: 'pos-standing',
    label: '站立',
    type: 'position',
    value: 'standing',
  },
  {
    id: 'pos-passing',
    label: '过腿',
    type: 'position',
    value: 'passing',
  },
  {
    id: 'pos-mount',
    label: '骑乘',
    type: 'position',
    value: 'mount',
  },
  {
    id: 'pos-sideControl',
    label: '侧控',
    type: 'position',
    value: 'sideControl',
  },
  {
    id: 'pos-back',
    label: '拿背',
    type: 'position',
    value: 'back',
  },
  {
    id: 'pos-turtle',
    label: '龟防',
    type: 'position',
    value: 'turtle',
  },
  {
    id: 'act-submission',
    label: '降服',
    type: 'action',
    value: 'submission',
    children: [
      { id: 'sub-jointLock', label: '关节技', type: 'submission', value: 'jointLock' },
      { id: 'sub-choke', label: '绞技', type: 'submission', value: 'choke' },
      { id: 'sub-pressure', label: '压制降服', type: 'submission', value: 'pressure' },
    ],
  },
  {
    id: 'act-escape',
    label: '逃脱',
    type: 'action',
    value: 'escape',
  },
]
