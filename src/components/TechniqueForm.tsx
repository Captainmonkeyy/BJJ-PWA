import { useState, useRef } from 'react'
import { Mic, Image } from 'lucide-react'
import type { Technique, PositionTag, ActionTag, SubmissionTag } from '../types'
import { POSITION_LABELS, ACTION_LABELS, SUBMISSION_LABELS } from '../types'

const POSITION_OPTIONS: PositionTag[] = ['standing', 'passing', 'mount', 'sideControl', 'back', 'turtle']
const ACTION_OPTIONS: ActionTag[] = ['submission', 'escape']
const SUBMISSION_OPTIONS: SubmissionTag[] = ['jointLock', 'choke', 'pressure']

interface Props {
  technique: Technique | null
  onSave: (tech: Omit<Technique, 'id' | 'classId' | 'createdAt'>) => void
  onCancel: () => void
}

export default function TechniqueForm({ technique, onSave, onCancel }: Props) {
  const [name, setName] = useState(technique?.name ?? '')
  const [position, setPosition] = useState<PositionTag | ''>(technique?.tags.position ?? '')
  const [action, setAction] = useState<ActionTag | ''>(technique?.tags.action ?? '')
  const [submission, setSubmission] = useState<SubmissionTag | ''>(technique?.tags.submission ?? '')
  const [notes, setNotes] = useState(technique?.notes ?? '')
  const [photos, setPhotos] = useState<string[]>(technique?.photos ?? [])
  const [links, setLinks] = useState<{ url: string; title?: string }[]>(technique?.externalLinks ?? [])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | undefined>(technique?.audioUrl)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setPhotos((p) => [...p, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx))
  }

  const addLink = () => {
    if (newLinkUrl.trim()) {
      setLinks([...links, { url: newLinkUrl.trim(), title: newLinkTitle.trim() || undefined }])
      setNewLinkUrl('')
      setNewLinkTitle('')
    }
  }

  const removeLink = (idx: number) => {
    setLinks((l) => l.filter((_, i) => i !== idx))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('录音失败:', err)
      alert('无法访问麦克风，请检查权限')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('请输入招式名称')
      return
    }
    onSave({
      name: name.trim(),
      tags: {
        position: position || undefined,
        action: action || undefined,
        submission: action === 'submission' ? (submission || undefined) : undefined,
      },
      notes: notes || undefined,
      photos,
      audioUrl,
      externalLinks: links,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h3 className="font-semibold">{technique ? '编辑招式' : '添加招式'}</h3>
          <button type="button" onClick={onCancel} className="text-slate-500">
            取消
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">招式名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：十字固、三角锁"
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">一类标签（位置）</label>
            <div className="flex flex-wrap gap-2">
              {POSITION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPosition(opt as PositionTag)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    position === opt ? 'bg-bjj-primary text-white' : 'bg-slate-100'
                  }`}
                >
                  {POSITION_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">二类标签</label>
            <div className="flex flex-wrap gap-2">
              {ACTION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setAction(opt as ActionTag)
                    if (opt !== 'submission') setSubmission('')
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    action === opt ? 'bg-bjj-primary text-white' : 'bg-slate-100'
                  }`}
                >
                  {ACTION_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>

          {action === 'submission' && (
            <div>
              <label className="block text-sm font-medium mb-2">三类标签（降服细分）</label>
              <div className="flex flex-wrap gap-2">
                {SUBMISSION_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSubmission(opt as SubmissionTag)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      submission === opt ? 'bg-bjj-primary text-white' : 'bg-slate-100'
                    }`}
                  >
                    {SUBMISSION_LABELS[opt]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">文字备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录招式要点、步骤..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">录音</label>
            {audioUrl ? (
              <div className="flex items-center gap-2">
                <audio src={audioUrl} controls className="flex-1" />
                <button
                  type="button"
                  onClick={() => setAudioUrl(undefined)}
                  className="text-red-500 text-sm"
                >
                  删除
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isRecording ? 'bg-red-100 text-red-700' : 'bg-slate-100'
                }`}
              >
                <Mic size={18} />
                {isRecording ? '停止录音' : '开始录音'}
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">照片</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddPhoto}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt="" className="w-20 h-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:border-bjj-primary"
              >
                <Image size={24} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">外部链接</label>
            <div className="space-y-2">
              {links.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate text-blue-600 text-sm"
                  >
                    {l.title || l.url}
                  </a>
                  <button type="button" onClick={() => removeLink(i)} className="text-red-500">
                    ×
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="标题（可选）"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
                <button type="button" onClick={addLink} className="px-3 py-2 bg-slate-100 rounded-lg">
                  添加
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-slate-200 rounded-lg"
            >
              取消
            </button>
            <button type="submit" className="flex-1 py-2 bg-bjj-primary text-white rounded-lg">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
