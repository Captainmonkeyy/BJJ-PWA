import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllClasses } from '../utils/db'
import { getTagTreeOrder, saveTagTreeOrder } from '../utils/db'
import type { TrainingClass, Technique } from '../types'
import type { TagTreeNode } from '../data/tags'
import TagTree from '../components/TagTree'
import TechniqueDetail from '../components/TechniqueDetail'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

function flattenTechniques(classes: TrainingClass[]): (Technique & { classId: string; classDate: string })[] {
  const result: (Technique & { classId: string; classDate: string })[] = []
  for (const cls of classes) {
    for (const t of cls.techniques) {
      result.push({ ...t, classId: cls.id, classDate: cls.date })
    }
  }
  return result
}

export default function TagTreePage() {
  const [tree, setTree] = useState<TagTreeNode[]>([])
  const [classes, setClasses] = useState<TrainingClass[]>([])
  const [selectedTechniques, setSelectedTechniques] = useState<Technique[]>([])
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null)

  useEffect(() => {
    getTagTreeOrder().then(setTree)
    getAllClasses().then(setClasses)
  }, [])

  const techniques = flattenTechniques(classes)

  const handleTreeChange = async (newTree: TagTreeNode[]) => {
    setTree(newTree)
    await saveTagTreeOrder(newTree)
  }

  const handleSelectNode = (_node: TagTreeNode, techs: Technique[]) => {
    setSelectedTechniques(techs)
    setSelectedNodeLabel(_node.label)
  }

  return (
    <div className="p-4 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold mb-2">标签树</h2>
        <p className="text-sm text-slate-500 mb-4">
          拖动标签可调整顺序，点击标签查看该分类下的招式
        </p>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <TagTree
            tree={tree}
            techniques={techniques}
            onTreeChange={handleTreeChange}
            onSelectNode={handleSelectNode}
          />
        </div>
      </div>

      <div className="flex-1 min-w-0 lg:max-w-md">
        <h2 className="text-lg font-semibold mb-2">
          {selectedNodeLabel ? `「${selectedNodeLabel}」下的招式` : '选择标签查看招式'}
        </h2>
        <div className="bg-white rounded-xl p-4 shadow-sm max-h-[60vh] overflow-y-auto">
          {selectedTechniques.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              {selectedNodeLabel
                ? '该标签下暂无招式记录'
                : '点击左侧标签查看对应招式'}
            </p>
          ) : (
            <ul className="space-y-3">
              {selectedTechniques.map((t) => (
                <li key={t.id}>
                  <div className="mb-1">
                    <Link
                      to={`/class/${(t as Technique & { classId: string }).classId}`}
                      className="text-xs text-slate-500 hover:text-bjj-primary"
                    >
                      {format(
                        new Date((t as Technique & { classDate: string }).classDate),
                        'M月d日',
                        { locale: zhCN }
                      )}
                    </Link>
                  </div>
                  <TechniqueDetail technique={t} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
