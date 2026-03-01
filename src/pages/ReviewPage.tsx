import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAllClasses } from '../utils/db'
import type { TrainingClass, Technique } from '../types'
import {
  POSITION_LABELS,
  ACTION_LABELS,
  SUBMISSION_LABELS,
} from '../types'
import type { PositionTag, ActionTag, SubmissionTag } from '../types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { subDays, isAfter } from 'date-fns'
import TechniqueDetail from '../components/TechniqueDetail'

type TimeFilter = 'week' | 'month' | '3months' | 'all'

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'week', label: '过去一周' },
  { value: 'month', label: '过去一个月' },
  { value: '3months', label: '过去三个月' },
  { value: 'all', label: '全部' },
]

function flattenTechniques(classes: TrainingClass[]): (Technique & { classDate: string; classId: string })[] {
  const result: (Technique & { classDate: string; classId: string })[] = []
  for (const cls of classes) {
    for (const t of cls.techniques) {
      result.push({ ...t, classDate: cls.date, classId: cls.id })
    }
  }
  return result
}

export default function ReviewPage() {
  const [classes, setClasses] = useState<TrainingClass[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month')
  const [positionFilter, setPositionFilter] = useState<PositionTag | ''>('')
  const [actionFilter, setActionFilter] = useState<ActionTag | ''>('')
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionTag | ''>('')

  useEffect(() => {
    getAllClasses().then(setClasses)
  }, [])

  const filteredTechniques = useMemo(() => {
    let techs = flattenTechniques(classes)

    const now = new Date()
    const cutoff =
      timeFilter === 'week'
        ? subDays(now, 7)
        : timeFilter === 'month'
        ? subDays(now, 30)
        : timeFilter === '3months'
        ? subDays(now, 90)
        : null

    if (cutoff) {
      techs = techs.filter((t) => isAfter(new Date(t.classDate), cutoff))
    }

    if (positionFilter) {
      techs = techs.filter((t) => t.tags.position === positionFilter)
    }
    if (actionFilter) {
      techs = techs.filter((t) => t.tags.action === actionFilter)
    }
    if (submissionFilter) {
      techs = techs.filter((t) => t.tags.submission === submissionFilter)
    }

    return techs.sort(
      (a, b) => new Date(b.classDate).getTime() - new Date(a.classDate).getTime()
    )
  }, [classes, timeFilter, positionFilter, actionFilter, submissionFilter])

  const positionTags: PositionTag[] = ['standing', 'passing', 'mount', 'sideControl', 'back', 'turtle']
  const actionTags: ActionTag[] = ['submission', 'escape']
  const submissionTags: SubmissionTag[] = ['jointLock', 'choke', 'pressure']

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">复盘招式</h2>

      <div className="space-y-4 mb-6">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">时间范围</p>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  timeFilter === opt.value
                    ? 'bg-bjj-primary text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">一类标签（位置）</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPositionFilter('')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                !positionFilter ? 'bg-bjj-primary text-white' : 'bg-slate-100'
              }`}
            >
              全部
            </button>
            {positionTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setPositionFilter(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  positionFilter === tag ? 'bg-bjj-primary text-white' : 'bg-slate-100'
                }`}
              >
                {POSITION_LABELS[tag]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">二类标签</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActionFilter('')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                !actionFilter ? 'bg-bjj-primary text-white' : 'bg-slate-100'
              }`}
            >
              全部
            </button>
            {actionTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActionFilter(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  actionFilter === tag ? 'bg-bjj-primary text-white' : 'bg-slate-100'
                }`}
              >
                {ACTION_LABELS[tag]}
              </button>
            ))}
          </div>
        </div>

        {actionFilter === 'submission' && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">三类标签（降服）</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSubmissionFilter('')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  !submissionFilter ? 'bg-bjj-primary text-white' : 'bg-slate-100'
                }`}
              >
                全部
              </button>
              {submissionTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSubmissionFilter(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    submissionFilter === tag ? 'bg-bjj-primary text-white' : 'bg-slate-100'
                  }`}
                >
                  {SUBMISSION_LABELS[tag]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-3">
        共 {filteredTechniques.length} 个招式
      </p>

      <ul className="space-y-3">
        {filteredTechniques.map((t) => (
          <li key={t.id}>
            <div className="mb-1">
              <Link
                to={`/class/${t.classId}`}
                className="text-xs text-slate-500 hover:text-bjj-primary"
              >
                {format(new Date(t.classDate), 'M月d日', { locale: zhCN })}
              </Link>
            </div>
            <TechniqueDetail technique={t} />
          </li>
        ))}
      </ul>

      {filteredTechniques.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          暂无符合条件的招式记录
        </div>
      )}
    </div>
  )
}
