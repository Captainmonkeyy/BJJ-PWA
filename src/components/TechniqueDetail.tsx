import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Image, Mic } from 'lucide-react'
import type { Technique } from '../types'
import { POSITION_LABELS, ACTION_LABELS, SUBMISSION_LABELS } from '../types'

interface Props {
  technique: Technique
}

export default function TechniqueDetail({ technique }: Props) {
  const [expanded, setExpanded] = useState(false)

  const hasContent =
    technique.notes ||
    technique.audioUrl ||
    technique.photos.length > 0 ||
    technique.externalLinks.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-slate-50"
      >
        <div>
          <p className="font-medium">{technique.name}</p>
          <p className="text-xs text-slate-500 mt-1">
            {technique.tags.position && POSITION_LABELS[technique.tags.position]}
            {technique.tags.action && ` · ${ACTION_LABELS[technique.tags.action]}`}
            {technique.tags.submission &&
              ` · ${SUBMISSION_LABELS[technique.tags.submission]}`}
          </p>
        </div>
        {hasContent && (
          expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />
        )}
      </button>

      {expanded && hasContent && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {technique.notes && (
            <p className="text-sm text-slate-600">{technique.notes}</p>
          )}
          {technique.audioUrl && (
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Mic size={14} /> 录音
              </p>
              <audio src={technique.audioUrl} controls className="w-full" />
            </div>
          )}
          {technique.photos.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <Image size={14} /> 照片
              </p>
              <div className="flex flex-wrap gap-2">
                {technique.photos.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                    onClick={() => window.open(p, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}
          {technique.externalLinks.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <ExternalLink size={14} /> 外部链接
              </p>
              <ul className="space-y-2">
                {technique.externalLinks.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={14} />
                      {l.title || l.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
