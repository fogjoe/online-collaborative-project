import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Plus, Share2, X, Loader2 } from 'lucide-react'
import { listApi, cardApi } from '@/services/api'

// --- Types ---
interface Card {
  id: number
  title: string
  order: number
}

interface List {
  id: number
  name: string
  order: number
  cards: Card[]
}

export const BoardPage = () => {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // State for "Add List"
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState('')

  // State for "Add Card" (Tracks which list is currently adding a card)
  const [addingCardToListId, setAddingCardToListId] = useState<number | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')

  // --- 1. Fetch Data on Load ---
  useEffect(() => {
    if (!projectId) return
    const fetchLists = async () => {
      try {
        const response = await listApi.getByProject(projectId)
        setLists(response.data)
      } catch (error) {
        console.error('Failed to fetch lists', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLists()
  }, [projectId])

  // --- 2. Handlers ---

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    try {
      const response = await listApi.create({ name: newListName, projectId })
      const newList = response.data.data
      // Optimistically update UI: Add new list with empty cards array
      setLists([...lists, { ...newList, cards: [] }])

      // Reset state
      setNewListName('')
      setIsAddingList(false)
    } catch (error) {
      console.error('Failed to create list', error)
    }
  }

  const handleCreateCard = async (e: React.FormEvent, listId: number) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return

    try {
      const response = await cardApi.create({ title: newCardTitle, listId })
      const newCard = response.data.data

      // Optimistically update UI: Find the list and add the card
      setLists(
        lists.map(list => {
          if (list.id === listId) {
            return { ...list, cards: [...list.cards, newCard] }
          }
          return list
        })
      )

      // Reset state
      setNewCardTitle('')
      setAddingCardToListId(null)
    } catch (error) {
      console.error('Failed to create card', error)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Board Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-800">Project Board #{projectId}</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 text-slate-600">
            <Share2 size={16} /> Share
          </Button>
        </div>
      </div>

      {/* Board Canvas (Horizontal Scroll) */}
      <div className="p-6 h-[calc(100vh-85px)] overflow-x-auto bg-slate-100">
        <div className="flex items-start gap-6 h-full">
          {/* --- Render Existing Lists --- */}
          {lists.map(list => (
            <div key={list.id} className="w-80 flex-shrink-0 flex flex-col max-h-full">
              {/* List Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-slate-700 text-sm">{list.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">{list.cards.length}</span>
                  <MoreHorizontal size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[50px] pr-2">
                {list.cards.map(card => (
                  <div key={card.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:border-teal-500 cursor-pointer group">
                    <h4 className="text-slate-800 text-sm leading-snug">{card.title}</h4>
                  </div>
                ))}

                {/* --- Add Card Form (Per List) --- */}
                {addingCardToListId === list.id ? (
                  <form onSubmit={e => handleCreateCard(e, list.id)} className="mt-2">
                    <textarea
                      autoFocus
                      placeholder="Enter a title for this card..."
                      className="w-full p-3 rounded-lg border border-teal-500 shadow-sm text-sm focus:outline-none resize-none h-20 block"
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleCreateCard(e, list.id)
                        }
                      }}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                        Add Card
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAddingCardToListId(null)}>
                        <X size={18} />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingCardToListId(list.id)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm p-2 rounded-lg hover:bg-slate-200 transition-colors mt-1 text-left"
                  >
                    <Plus size={16} /> Add a card
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* --- Add List Form (Column) --- */}
          <div className="w-80 flex-shrink-0">
            {isAddingList ? (
              <form onSubmit={handleCreateList} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <Input autoFocus placeholder="Enter list title..." className="mb-3 border-teal-500 focus-visible:ring-0" value={newListName} onChange={e => setNewListName(e.target.value)} />
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                    Add List
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingList(false)}>
                    <X size={18} />
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full h-12 flex items-center justify-center gap-2 bg-white/50 hover:bg-white/80 text-slate-600 rounded-xl font-medium transition-colors border border-transparent hover:border-slate-300"
              >
                <Plus size={20} /> Add another list
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
