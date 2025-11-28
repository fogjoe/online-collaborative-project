import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Share2, Plus, Check } from 'lucide-react'
import { listApi, cardApi } from '@/services/api'

// --- Types ---
interface Card {
  id: number
  title: string
  description?: string
  order: number
  isCompleted: boolean
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

  // Add Card State
  const [addingCardToListId, setAddingCardToListId] = useState<number | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDesc, setNewCardDesc] = useState('')

  // --- 1. Fetch Data ---
  useEffect(() => {
    if (!projectId) return
    const fetchLists = async () => {
      try {
        const response = await listApi.getByProject(projectId)
        setLists(response.data)
      } catch (error) {
        console.error('Failed to fetch lists', error)
      }
    }
    fetchLists()
  }, [projectId])

  // --- 2. Drag Logic ---
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return

    const newLists = [...lists]
    const sourceList = newLists.find(l => l.id.toString() === source.droppableId)
    const destList = newLists.find(l => l.id.toString() === destination.droppableId)

    if (sourceList && destList) {
      const [movedCard] = sourceList.cards.splice(source.index, 1)
      destList.cards.splice(destination.index, 0, movedCard)
      setLists(newLists)
      // TODO: Call Backend API
    }
  }

  // --- 3. Create Card Logic ---
  const handleCreateCard = async (e: React.FormEvent, listId: number) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return

    try {
      const response = await cardApi.create({
        title: newCardTitle,
        description: newCardDesc,
        listId
      })

      const newCard = response.data

      setLists(
        lists.map(list => {
          if (list.id === listId) {
            return { ...list, cards: [...list.cards, newCard] }
          }
          return list
        })
      )

      setNewCardTitle('')
      setNewCardDesc('')
      setAddingCardToListId(null)
    } catch (error) {
      console.error('Failed to create card', error)
    }
  }

  return (
    <DashboardLayout>
      {/* Page Background: Light Gray matching the image */}
      <div className="flex flex-col h-full bg-[#F3F4F6]">
        {/* Header Section */}
        <div className="flex-none px-8 py-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Website Redesign Sprint</h1>

          {/* Share Button (Teal) */}
          <Button className="bg-[#0F766E] hover:bg-[#0d655e] text-white gap-2 rounded-lg px-6 shadow-sm h-10">
            <Share2 size={18} /> Share
          </Button>
        </div>

        {/* Kanban Board Area */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
            <div className="flex h-full gap-8">
              {' '}
              {/* Increased gap for cleaner look */}
              {lists.map(list => (
                <div key={list.id} className="w-[320px] flex-shrink-0 flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-5 px-1">
                    <h3 className="font-semibold text-slate-700 text-base">{list.name}</h3>
                  </div>

                  {/* Droppable Zone */}
                  <Droppable droppableId={list.id.toString()}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 flex flex-col gap-4 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/30 rounded-xl' : ''}`}
                      >
                        {list.cards.map((card, index) => (
                          <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                                className={`
                                  bg-white p-5 rounded-xl border border-transparent group relative
                                  ${snapshot.isDragging ? 'shadow-xl ring-1 ring-[#0F766E]/20 rotate-2 scale-105 z-50' : 'shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md'}
                                  transition-all duration-200 ease-in-out
                                `}
                              >
                                {/* Card Content */}
                                <div className="flex flex-col gap-1.5">
                                  {/* Title */}
                                  <h4 className="text-slate-900 font-semibold text-[15px] leading-snug">{card.title}</h4>

                                  {/* Description (Grey Text) */}
                                  {card.description && <p className="text-slate-500 text-[13px] font-normal leading-relaxed">{card.description}</p>}
                                </div>

                                {/* Footer: Completed Status Icon */}
                                <div className="flex justify-end mt-3 pt-2">
                                  <div
                                    className={`
                                    w-6 h-6 rounded-full flex items-center justify-center transition-colors
                                    ${card.isCompleted ? 'bg-[#10B981] text-white' : 'bg-slate-100 text-slate-300'}
                                  `}
                                  >
                                    <Check size={14} strokeWidth={3} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* --- Add Card Area --- */}
                        {addingCardToListId === list.id ? (
                          <div className="bg-white p-4 rounded-xl shadow-lg border border-[#0F766E] animate-in fade-in zoom-in-95">
                            <input
                              autoFocus
                              placeholder="Card Title..."
                              className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none bg-transparent mb-2"
                              value={newCardTitle}
                              onChange={e => setNewCardTitle(e.target.value)}
                            />
                            <textarea
                              placeholder="Description (optional)..."
                              className="w-full text-xs text-slate-600 placeholder:text-slate-300 resize-none outline-none bg-transparent min-h-[40px]"
                              value={newCardDesc}
                              onChange={e => setNewCardDesc(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleCreateCard(e, list.id)
                                }
                              }}
                            />
                            <div className="flex justify-end gap-2 mt-3 border-t border-slate-100 pt-2">
                              <Button size="sm" variant="ghost" onClick={() => setAddingCardToListId(null)} className="h-8 px-2 text-slate-500">
                                Cancel
                              </Button>
                              <Button size="sm" onClick={e => handleCreateCard(e, list.id)} className="h-8 bg-[#0F766E] hover:bg-[#0d655e] text-white px-4">
                                Add
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Add Button matching the Teal pill style in the image */
                          <button
                            onClick={() => setAddingCardToListId(list.id)}
                            className="flex items-center gap-2 text-white bg-[#0F766E] hover:bg-[#0d655e] px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm w-fit mt-2"
                          >
                            <Plus size={16} /> Add a card
                          </button>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
              {/* Placeholder for Add List (Optional visual balance) */}
              <div className="w-[320px] flex-shrink-0 opacity-0 pointer-events-none"></div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </DashboardLayout>
  )
}
