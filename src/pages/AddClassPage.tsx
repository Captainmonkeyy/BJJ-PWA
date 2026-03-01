import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { saveClass } from '../utils/db'
import { generateId } from '../utils/id'
import type {
  TrainingClass,
  Technique,
  BodyCondition,
  InjuryArea,
} from '../types'
import {
  BODY_CONDITION_LABELS,
  INJURY_AREA_LABELS,
  POSITION_LABELS,
  ACTION_LABELS,
  SUBMISSION_LABELS,
} from '../types'
import TechniqueForm from '../components/TechniqueForm'

const BODY_OPTIONS: BodyCondition[] = ['excellent', 'good', 'normal', 'tired', 'poor']
const INJURY_OPTIONS: InjuryArea[] = [
  'neck', 'shoulder', 'elbow', 'wrist', 'finger',
  'back', 'rib', 'hip', 'knee', 'ankle', 'other',
]

export default function AddClassPage() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [bodyCondition, setBodyCondition] = useState<BodyCondition>('normal')
  const [injuries, setInjuries] = useState<{ area: InjuryArea; description?: string }[]>([])
  const [injuryArea, setInjuryArea] = useState<InjuryArea>('other')
  const [injuryDesc, setInjuryDesc] = useState('')
  const [techniques, setTechniques] = useState<Technique[]>([])
  const [showTechForm, setShowTechForm] = useState(false)
  const [editingTech, setEditingTech] = useState<Technique | null>(null)
  const [classNotes, setClassNotes] = useState('')

  const addInjury = () => {
    if (injuryArea) {
      setInjuries([...injuries, { area: injuryArea, description: injuryDesc || undefined }])
      setInjuryDesc('')
    }
  }

  const removeInjury = (idx: number) => {
    setInjuries(injuries.filter((_, i) => i !== idx))
  }

  const handleSaveTechnique = (tech: Omit<Technique, 'id' | 'classId' | 'createdAt'>) => {
    const now = new Date().toISOString()
    if (editingTech) {
      setTechniques(techniques.map((t) =>
        t.id === editingTech.id
          ? { ...tech, id: t.id, classId: t.classId, createdAt: t.createdAt }
          : t
      ))
      setEditingTech(null)
    } else {
      const classId = `class-${Date.now()}`
      setTechniques([
        ...techniques,
        {
          ...tech,
          id: generateId(),
          classId,
          createdAt: now,
        },
      ])
    }
    setShowTechForm(false)
  }

  const handleEditTechnique = (tech: Technique) => {
    setEditingTech(tech)
    setShowTechForm(true)
  }

  const removeTechnique = (id: string) => {
    setTechniques(techniques.filter((t) => t.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const classId = generateId()
    const now = new Date().toISOString()

    const cls: TrainingClass = {
      id: classId,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      bodyCondition,
      injuries,
      notes: classNotes || undefined,
      techniques: techniques.map((t) => ({
        ...t,
        classId,
        createdAt: t.createdAt || now,
      })),
      createdAt: now,
    }

    await saveClass(cls)
    navigate(`/class/${classId}`)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">记录新课程</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 日期时间 */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-medium mb-3">上课时间</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">开始时间</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">结束时间</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* 身体状态 */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-medium mb-3">身体状态</h3>
          <div className="flex flex-wrap gap-2">
            {BODY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setBodyCondition(opt)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  bodyCondition === opt
                    ? 'bg-bjj-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {BODY_CONDITION_LABELS[opt]}
              </button>
            ))}
          </div>
        </section>

        {/* 伤痛记录 */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-medium mb-3">课后伤痛</h3>
          {injuries.length > 0 && (
            <ul className="mb-3 space-y-2">
              {injuries.map((inj, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-amber-50 rounded-lg px-3 py-2"
                >
                  <span>
                    {INJURY_AREA_LABELS[inj.area]}
                    {inj.description && ` - ${inj.description}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeInjury(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <select
              value={injuryArea}
              onChange={(e) => setInjuryArea(e.target.value as InjuryArea)}
              className="border border-slate-200 rounded-lg px-3 py-2 flex-1"
            >
              {INJURY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {INJURY_AREA_LABELS[opt]}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="描述（可选）"
              value={injuryDesc}
              onChange={(e) => setInjuryDesc(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 flex-1"
            />
            <button
              type="button"
              onClick={addInjury}
              className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200"
            >
              添加
            </button>
          </div>
        </section>

        {/* 学到的招式 */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">学到的招式</h3>
            <button
              type="button"
              onClick={() => {
                setEditingTech(null)
                setShowTechForm(true)
              }}
              className="flex items-center gap-2 text-bjj-primary font-medium"
            >
              <Plus size={18} />
              添加招式
            </button>
          </div>

          {techniques.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">
              点击上方添加招式，记录本节课学到的内容
            </p>
          ) : (
            <ul className="space-y-2">
              {techniques.map((t) => (
                <li
                  key={t.id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.tags.position && POSITION_LABELS[t.tags.position]}
                      {t.tags.action && ` · ${ACTION_LABELS[t.tags.action]}`}
                      {t.tags.submission && ` · ${SUBMISSION_LABELS[t.tags.submission]}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditTechnique(t)}
                      className="text-slate-600 hover:text-bjj-primary text-sm"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTechnique(t.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 课程备注 */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-medium mb-3">课程备注</h3>
          <textarea
            value={classNotes}
            onChange={(e) => setClassNotes(e.target.value)}
            placeholder="记录本节课的总体感受..."
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </section>

        <button
          type="submit"
          className="w-full py-3 bg-bjj-primary text-white rounded-xl font-medium hover:bg-bjj-secondary transition-colors"
        >
          保存课程
        </button>
      </form>

      {showTechForm && (
        <TechniqueForm
          technique={editingTech}
          onSave={handleSaveTechnique}
          onCancel={() => {
            setShowTechForm(false)
            setEditingTech(null)
          }}
        />
      )}
    </div>
  )
}
