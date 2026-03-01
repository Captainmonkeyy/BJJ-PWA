import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { getAllClasses } from '../utils/db'
import type { TrainingClass } from '../types'
import { POSITION_LABELS, ACTION_LABELS, BODY_CONDITION_LABELS } from '../types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function HomePage() {
  const [classes, setClasses] = useState<TrainingClass[]>([])

  useEffect(() => {
    getAllClasses().then(setClasses)
  }, [])

  const recentClasses = [...classes].reverse().slice(0, 10)

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">最近课程</h2>
        <Link
          to="/add"
          className="flex items-center gap-2 bg-bjj-primary text-white px-4 py-2 rounded-lg hover:bg-bjj-secondary transition-colors"
        >
          <Plus size={18} />
          记录新课
        </Link>
      </div>

      {recentClasses.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="mb-4">还没有记录任何课程</p>
          <Link
            to="/add"
            className="inline-flex items-center gap-2 text-bjj-primary font-medium"
          >
            <Plus size={20} />
            开始记录第一节课
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {recentClasses.map((cls) => (
            <li key={cls.id}>
              <Link
                to={`/class/${cls.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-bjj-primary/30 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">
                      {format(new Date(cls.date), 'M月d日 EEEE', { locale: zhCN })}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {cls.startTime && cls.endTime
                        ? `${cls.startTime} - ${cls.endTime}`
                        : '未记录时间'}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      身体状态：{BODY_CONDITION_LABELS[cls.bodyCondition]}
                    </p>
                  </div>
                  <ChevronRight className="text-slate-400" size={20} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cls.techniques.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="text-xs px-2 py-1 bg-slate-100 rounded-md"
                    >
                      {t.name}
                      {t.tags.position && ` · ${POSITION_LABELS[t.tags.position]}`}
                      {t.tags.action && ` · ${ACTION_LABELS[t.tags.action]}`}
                    </span>
                  ))}
                  {cls.techniques.length > 3 && (
                    <span className="text-xs text-slate-500">
                      +{cls.techniques.length - 3} 更多
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
