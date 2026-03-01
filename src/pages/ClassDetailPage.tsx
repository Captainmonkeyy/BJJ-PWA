import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getClass } from '../utils/db'
import type { TrainingClass } from '../types'
import { BODY_CONDITION_LABELS, INJURY_AREA_LABELS } from '../types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import TechniqueDetail from '../components/TechniqueDetail'

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cls, setCls] = useState<TrainingClass | null>(null)

  useEffect(() => {
    if (id) getClass(id).then((c) => setCls(c ?? null))
  }, [id])

  if (!cls) return <div className="p-4">加载中...</div>

  return (
    <div className="p-4 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 mb-4"
      >
        <ArrowLeft size={20} />
        返回
      </button>

      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h2 className="text-xl font-semibold">
          {format(new Date(cls.date), 'M月d日 EEEE', { locale: zhCN })}
        </h2>
        <p className="text-slate-500 mt-1">
          {cls.startTime && cls.endTime
            ? `${cls.startTime} - ${cls.endTime}`
            : '未记录时间'}
        </p>
        <p className="text-sm mt-2">
          身体状态：{BODY_CONDITION_LABELS[cls.bodyCondition]}
        </p>
        {cls.injuries.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-amber-700">课后伤痛：</p>
            <ul className="text-sm text-amber-800">
              {cls.injuries.map((inj, i) => (
                <li key={i}>
                  {INJURY_AREA_LABELS[inj.area]}
                  {inj.description && ` - ${inj.description}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        {cls.notes && (
          <p className="text-sm text-slate-600 mt-2">{cls.notes}</p>
        )}
      </div>

      <h3 className="font-medium mb-3">学到的招式</h3>
      <ul className="space-y-3">
        {cls.techniques.map((t) => (
          <li key={t.id}>
            <TechniqueDetail technique={t} />
          </li>
        ))}
      </ul>
    </div>
  )
}
