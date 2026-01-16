import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Search, SlidersHorizontal } from 'lucide-react'
import { searchApi } from '@/services/api'
import type { SearchQueryParams, SearchResponse, SearchType } from '@/types/search'

type SearchSelection =
  | { type: 'project'; id: number; name: string }
  | { type: 'card'; id: number; title: string; projectId: number }
  | { type: 'comment'; id: number; cardId: number; cardTitle: string; projectId: number }

interface GlobalSearchProps {
  defaultProjectId?: number
  onSelectResult?: (result: SearchSelection) => void
}

const DEFAULT_TYPES: SearchType[] = ['projects', 'cards', 'comments']

export const GlobalSearch = ({ defaultProjectId, onSelectResult }: GlobalSearchProps) => {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilters, setTypeFilters] = useState<Record<SearchType, boolean>>({
    projects: true,
    cards: true,
    comments: true
  })
  const [projectId, setProjectId] = useState(defaultProjectId ? String(defaultProjectId) : '')
  const [assignedUserId, setAssignedUserId] = useState('')
  const [labelIdsInput, setLabelIdsInput] = useState('')
  const [dueDateFrom, setDueDateFrom] = useState('')
  const [dueDateTo, setDueDateTo] = useState('')
  const [completionFilter, setCompletionFilter] = useState<'all' | 'true' | 'false'>('all')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (defaultProjectId && !projectId) {
      setProjectId(String(defaultProjectId))
    }
  }, [defaultProjectId, projectId])

  const params = useMemo<SearchQueryParams>(() => {
    const filters = DEFAULT_TYPES.filter(type => typeFilters[type])
    const parsedProjectId = Number(projectId)
    const parsedAssignedUserId = Number(assignedUserId)
    const labelIds = labelIdsInput
      .split(',')
      .map(entry => Number(entry.trim()))
      .filter(entry => Number.isFinite(entry))

    return {
      q: query.trim(),
      filters: filters.length ? filters : undefined,
      projectId: Number.isFinite(parsedProjectId) && parsedProjectId > 0 ? parsedProjectId : undefined,
      assignedUserId: Number.isFinite(parsedAssignedUserId) && parsedAssignedUserId > 0 ? parsedAssignedUserId : undefined,
      labelIds: labelIds.length ? labelIds : undefined,
      dueDateFrom: dueDateFrom || undefined,
      dueDateTo: dueDateTo || undefined,
      isCompleted: completionFilter === 'all' ? undefined : completionFilter === 'true'
    }
  }, [query, typeFilters, projectId, assignedUserId, labelIdsInput, dueDateFrom, dueDateTo, completionFilter])

  useEffect(() => {
    if (!params.q) {
      setResults(null)
      return
    }

    let isActive = true
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await searchApi.search(params)
        if (!isActive) return
        setResults(response.data)
      } catch (error) {
        if (!isActive) return
        console.error('Search failed', error)
        setResults({ projects: [], cards: [], comments: [] })
      } finally {
        if (isActive) setIsLoading(false)
      }
    }, 250)

    return () => {
      isActive = false
      clearTimeout(timer)
    }
  }, [params])

  const hasResults =
    !!results &&
    (results.projects.length > 0 || results.cards.length > 0 || results.comments.length > 0)

  const handleSelect = (result: SearchSelection) => {
    if (!onSelectResult) return
    onSelectResult(result)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search projects, cards, or comments..."
            className="w-full rounded-full border border-slate-200 bg-white px-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
          {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={16} />}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(prev => !prev)}
          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
            showFilters ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            {DEFAULT_TYPES.map(type => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={typeFilters[type]}
                  onChange={() => setTypeFilters(prev => ({ ...prev, [type]: !prev[type] }))}
                />
                {type[0].toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder="Project ID"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <input
              value={assignedUserId}
              onChange={e => setAssignedUserId(e.target.value)}
              placeholder="Assigned User ID"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <input
              value={labelIdsInput}
              onChange={e => setLabelIdsInput(e.target.value)}
              placeholder="Label IDs (comma-separated)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <select
              value={completionFilter}
              onChange={e => setCompletionFilter(e.target.value as 'all' | 'true' | 'false')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
            >
              <option value="all">Completion: All</option>
              <option value="true">Completion: Completed</option>
              <option value="false">Completion: Incomplete</option>
            </select>
            <input
              type="date"
              value={dueDateFrom}
              onChange={e => setDueDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <input
              type="date"
              value={dueDateTo}
              onChange={e => setDueDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
        </div>
      )}

      {isOpen && params.q && (
        <div
          className="absolute z-20 mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-lg"
          onMouseLeave={() => setIsOpen(false)}
        >
          {!hasResults && !isLoading && (
            <div className="text-xs text-slate-400 text-center py-4">No matches yet.</div>
          )}

          {hasResults && results && (
            <div className="space-y-4 text-sm">
              {results.projects.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Projects</div>
                  <div className="space-y-2">
                    {results.projects.map(project =>
                      onSelectResult ? (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleSelect({ type: 'project', id: project.id, name: project.name })}
                          className="block w-full text-left rounded-lg border border-transparent px-3 py-2 hover:border-teal-200 hover:bg-teal-50"
                        >
                          <div className="font-medium text-slate-800">{project.name}</div>
                          {project.description && <div className="text-xs text-slate-500 line-clamp-1">{project.description}</div>}
                        </button>
                      ) : (
                        <Link
                          key={project.id}
                          to={`/board/${project.id}`}
                          className="block rounded-lg border border-transparent px-3 py-2 hover:border-teal-200 hover:bg-teal-50"
                        >
                          <div className="font-medium text-slate-800">{project.name}</div>
                          {project.description && <div className="text-xs text-slate-500 line-clamp-1">{project.description}</div>}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}

              {results.cards.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cards</div>
                  <div className="space-y-2">
                    {results.cards.map(card =>
                      onSelectResult ? (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleSelect({ type: 'card', id: card.id, title: card.title, projectId: card.projectId })}
                          className="block w-full text-left rounded-lg border border-transparent px-3 py-2 hover:border-teal-200 hover:bg-teal-50"
                        >
                          <div className="font-medium text-slate-800">{card.title}</div>
                          <div className="text-xs text-slate-500">
                            {card.projectName}
                            {card.isCompleted ? ' · Completed' : ''}
                          </div>
                        </button>
                      ) : (
                        <Link
                          key={card.id}
                          to={`/board/${card.projectId}`}
                          className="block rounded-lg border border-transparent px-3 py-2 hover:border-teal-200 hover:bg-teal-50"
                        >
                          <div className="font-medium text-slate-800">{card.title}</div>
                          <div className="text-xs text-slate-500">
                            {card.projectName}
                            {card.isCompleted ? ' · Completed' : ''}
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}

              {results.comments.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Comments</div>
                  <div className="space-y-2">
                    {results.comments.map(comment =>
                      onSelectResult ? (
                        <button
                          key={comment.id}
                          type="button"
                          onClick={() =>
                            handleSelect({
                              type: 'comment',
                              id: comment.id,
                              cardId: comment.cardId,
                              cardTitle: comment.cardTitle,
                              projectId: comment.projectId
                            })
                          }
                          className="block w-full text-left rounded-lg border border-transparent px-3 py-2 hover:border-teal-200 hover:bg-teal-50"
                        >
                          <div className="text-xs text-slate-500">{comment.projectName}</div>
                          <div className="font-medium text-slate-800 line-clamp-1">{comment.cardTitle}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{comment.content}</div>
                        </button>
                      ) : (
                        <Link
                          key={comment.id}
                          to={`/board/${comment.projectId}`}
                          className="block rounded-lg border border-transparent px-3 py-2 hover:border-teal-200 hover:bg-teal-50"
                        >
                          <div className="text-xs text-slate-500">{comment.projectName}</div>
                          <div className="font-medium text-slate-800 line-clamp-1">{comment.cardTitle}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{comment.content}</div>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
