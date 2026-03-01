import { useState } from 'react'
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react'
import type { TagTreeNode } from '../data/tags'
import type { Technique } from '../types'

interface Props {
  tree: TagTreeNode[]
  techniques: Technique[]
  onTreeChange: (tree: TagTreeNode[]) => void
  onSelectNode: (node: TagTreeNode, techniques: Technique[]) => void
}

function getTechniquesForNode(
  node: TagTreeNode,
  allTechniques: Technique[]
): Technique[] {
  if (node.type === 'position' && node.value) {
    return allTechniques.filter((t) => t.tags.position === node.value)
  }
  if (node.type === 'action' && node.value) {
    return allTechniques.filter((t) => t.tags.action === node.value)
  }
  if (node.type === 'submission' && node.value) {
    return allTechniques.filter((t) => t.tags.submission === node.value)
  }
  return []
}

function TagTreeItem({
  node,
  allTechniques,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  depth = 0,
}: {
  node: TagTreeNode
  allTechniques: Technique[]
  onSelect: (node: TagTreeNode, techs: Technique[]) => void
  onDragStart: (e: React.DragEvent, node: TagTreeNode) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, target: TagTreeNode) => void
  isDragging: string | null
  depth?: number
}) {
  const [expanded, setExpanded] = useState(!!node.children?.length)
  const techs = getTechniquesForNode(node, allTechniques)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="select-none">
      <div
        draggable
        onDragStart={(e) => onDragStart(e, node)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, node)}
        className={`flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-slate-100 cursor-pointer group ${
          isDragging === node.id ? 'opacity-50' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span
          className="text-slate-400 cursor-grab active:cursor-grabbing mr-1 opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </span>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-0.5"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={18} className="text-slate-500" />
            ) : (
              <ChevronRight size={18} className="text-slate-500" />
            )
          ) : (
            <span className="w-[18px] inline-block" />
          )}
        </button>
        <div
          className="flex-1 flex items-center gap-2"
          onClick={() => onSelect(node, techs)}
        >
          <span className="font-medium">{node.label}</span>
          {techs.length > 0 && (
            <span className="text-xs bg-bjj-primary/10 text-bjj-primary px-2 py-0.5 rounded-full">
              {techs.length}
            </span>
          )}
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="border-l border-slate-200 ml-4">
          {node.children!.map((child) => (
            <TagTreeItem
              key={child.id}
              node={child}
              allTechniques={allTechniques}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDragging={isDragging}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TagTree({
  tree,
  techniques,
  onTreeChange,
  onSelectNode,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, node: TagTreeNode) => {
    setDraggingId(node.id)
    e.dataTransfer?.setData('text/plain', node.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, target: TagTreeNode) => {
    e.preventDefault()
    setDraggingId(null)
    const sourceId = e.dataTransfer?.getData('text/plain')
    if (!sourceId || sourceId === target.id) return

    const rootIds = tree.map((t) => t.id)
    if (rootIds.includes(sourceId) && rootIds.includes(target.id)) {
      const reordered = [...tree]
      const si = reordered.findIndex((x) => x.id === sourceId)
      const ti = reordered.findIndex((x) => x.id === target.id)
      if (si >= 0 && ti >= 0) {
        const [rem] = reordered.splice(si, 1)
        const newTi = reordered.findIndex((x) => x.id === target.id)
        reordered.splice(newTi, 0, rem)
        onTreeChange(reordered)
      }
      return
    }

    const parentWithChildren = tree.find((t) => t.children?.some((c) => c.id === sourceId || c.id === target.id))
    if (parentWithChildren?.children) {
      const childIds = parentWithChildren.children!.map((c) => c.id)
      if (childIds.includes(sourceId) && childIds.includes(target.id)) {
        const reordered = [...parentWithChildren.children!]
        const si = reordered.findIndex((x) => x.id === sourceId)
        const ti = reordered.findIndex((x) => x.id === target.id)
        if (si >= 0 && ti >= 0) {
          const [rem] = reordered.splice(si, 1)
          const newTi = reordered.findIndex((x) => x.id === target.id)
          reordered.splice(newTi, 0, rem)
          onTreeChange(
            tree.map((t) =>
              t.id === parentWithChildren.id ? { ...t, children: reordered } : t
            )
          )
        }
      }
    }
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TagTreeItem
          key={node.id}
          node={node}
          allTechniques={techniques}
          onSelect={onSelectNode}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggingId}
        />
      ))}
    </div>
  )
}
