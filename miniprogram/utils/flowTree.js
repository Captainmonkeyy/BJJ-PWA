/**
 * 流程树工具：节点、边、树结构
 * 限制：最多3叉树，深度3（0/1/2 共3层）
 */

const MAX_BRANCHES = 3
const MAX_DEPTH = 3  // 深度0/1/2，共3层

const { STEP_STATE_LABELS, POSITION_LABELS, ACTION_LABELS } = require('./constants')

function getNodeDepth(edges, rootId, nodeId) {
  if (nodeId === rootId) return 0
  const parentEdges = edges.filter(e => e.to === nodeId)
  if (parentEdges.length === 0) return -1
  const parentId = parentEdges[0].from
  const parentDepth = getNodeDepth(edges, rootId, parentId)
  return parentDepth < 0 ? -1 : parentDepth + 1
}

function getChildCount(edges, nodeId) {
  return edges.filter(e => e.from === nodeId).length
}

function canAddBranch(edges, rootId, nodeId) {
  const depth = getNodeDepth(edges, rootId, nodeId)
  const childCount = getChildCount(edges, nodeId)
  return depth >= 0 && depth < MAX_DEPTH - 1 && childCount < MAX_BRANCHES
}

function getNodeLabel(node, techMap = {}) {
  if (!node) return ''
  if (node.type === 'tech' && node.techId) {
    const tech = techMap[node.techId]
    return tech ? tech.name : '招式'
  }
  if (node.type === 'step' && node.step) {
    const s = node.step
    const parts = []
    if (s.state) parts.push(STEP_STATE_LABELS[s.state] || s.state)
    if (s.position) parts.push(POSITION_LABELS[s.position] || s.position)
    if (s.action) parts.push(ACTION_LABELS[s.action] || s.action)
    return parts.join(' · ') || '步骤'
  }
  return node.label || '节点'
}

function buildTree(nodes, edges, rootId) {
  if (!nodes || !rootId) return []
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = { ...n, children: [] } })
  edges.forEach(e => {
    const from = nodeMap[e.from]
    if (from) {
      from.children.push({
        edge: e,
        node: nodeMap[e.to],
      })
    }
  })
  const root = nodeMap[rootId]
  return root ? [root] : []
}

function flattenTree(tree, techMap, level = 0) {
  const result = []
  function walk(items, depth, prefix = '', isLastInParent = true) {
    if (!items || !items.length) return
    items.forEach((item, idx) => {
      const node = item.node || item
      const edge = item.edge
      const label = getNodeLabel(node, techMap)
      const isLastSibling = idx === items.length - 1
      const branchPrefix = edge ? (isLastSibling ? '└─ ' : '├─ ') : ''
      const childPrefix = prefix + (isLastSibling ? '   ' : '│  ')
      result.push({
        id: node?.id || `row-${depth}-${idx}`,
        node,
        edge,
        label,
        depth,
        isFirst: idx === 0,
        isLast: isLastSibling,
        branchPrefix,
      })
      const children = node.children || []
      if (children.length) {
        walk(children, depth + 1, childPrefix, isLastSibling && isLastInParent)
      }
    })
  }
  walk(tree, level)
  return result
}

module.exports = {
  getNodeLabel,
  buildTree,
  flattenTree,
  MAX_BRANCHES,
  MAX_DEPTH,
  getNodeDepth,
  getChildCount,
  canAddBranch,
}
