import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditCardDialog } from '@/components/board/EditCardDialog'
import { InviteMemberDialog } from '@/components/board/InviteMemberDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, Check, UserPlus, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { listApi, cardApi, projectApi } from '@/services/api'
import { CardLabelsPreview } from '@/components/board/CardLabelsPreview'

enum ListStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface User {
  id: number
  username: string
  email: string
  avatarUrl?: string
}

export interface Label {
  id: number
  name: string
  color: string
}

export interface Card {
  id: number
  title: string
  description?: string
  order: number
  isCompleted: boolean
  assignees: User[]
  labels: Label[]
}

interface DbList {
  id: number
  status: ListStatus
  order: number
  cards: Card[]
}

interface BoardColumn {
  id: string
  title: string
  status: ListStatus
  cards: Card[]
}

// --- Constants & Helpers ---
const COLUMN_TITLES: Record<ListStatus, string> = {
  [ListStatus.TODO]: 'To Do',
  [ListStatus.IN_PROGRESS]: 'In Progress',
  [ListStatus.DONE]: 'Done'
}

const calculateNewOrder = (cards: Card[], destinationIndex: number): number => {
  if (!cards || cards.length === 0) return 10000
  if (destinationIndex === 0) return cards[0].order / 2
  if (destinationIndex >= cards.length) return cards[cards.length - 1].order + 10000

  const prevCard = cards[destinationIndex - 1]
  const nextCard = cards[destinationIndex]
  return (prevCard.order + nextCard.order) / 2
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// --- Main Component ---
export const BoardPage = () => {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  // --- State ---
  const [dbLists, setDbLists] = useState<DbList[]>([])
  const [cardsByListId, setCardsByListId] = useState<Record<number, Card[]>>({})
  const [members, setMembers] = useState<User[]>([])

  // UI State
  const [addingCardToListId, setAddingCardToListId] = useState<number | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDesc, setNewCardDesc] = useState('')

  // Modals
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!projectId) return

    try {
      const [listRes, projectRes] = await Promise.all([listApi.getByProject(projectId), projectApi.getDetailById(projectId)])

      const lists: DbList[] = listRes.data
      setDbLists(lists)

      // Transform into Map
      const newCardsMap: Record<number, Card[]> = {}
      lists.forEach(list => {
        newCardsMap[list.id] = (list.cards || []).sort((a, b) => a.order - b.order)
      })
      setCardsByListId(newCardsMap)

      if (projectRes.data?.members) {
        setMembers(projectRes.data.members)
      }
    } catch (error) {
      console.error('Failed to fetch board', error)
      toast.error('Failed to load board data')
    }
  }, [projectId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  // --- Computed Columns ---
  const boardColumns: BoardColumn[] = useMemo(() => {
    const getListByStatus = (status: ListStatus) => dbLists.find(l => l.status === status)

    return Object.values(ListStatus).map(status => {
      const list = getListByStatus(status)
      return {
        id: list?.id.toString() || `missing-${status}`,
        title: COLUMN_TITLES[status],
        status: status,
        cards: list ? cardsByListId[list.id] || [] : []
      }
    })
  }, [dbLists, cardsByListId])

  // --- Helpers for Optimistic Updates ---
  const updateLocalCardState = (cardId: number, updater: (card: Card) => Card) => {
    setCardsByListId(prev => {
      const newMap = { ...prev }
      for (const listId in newMap) {
        newMap[listId] = newMap[listId].map(c => (c.id === cardId ? updater(c) : c))
      }
      return newMap
    })
  }

  const deleteLocalCardState = (cardId: number) => {
    setCardsByListId(prev => {
      const newMap = { ...prev }
      for (const listId in newMap) {
        newMap[listId] = newMap[listId].filter(c => c.id !== cardId)
      }
      return newMap
    })
  }

  // --- Event Handlers ---

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourceListId = Number(source.droppableId)
    const destListId = Number(destination.droppableId)
    const cardId = Number(draggableId)

    // Clone & Logic
    const newCardsMap = { ...cardsByListId }
    const sourceCards = [...(newCardsMap[sourceListId] || [])]
    const destCards = sourceListId === destListId ? sourceCards : [...(newCardsMap[destListId] || [])]

    const [movedCard] = sourceCards.splice(source.index, 1)
    destCards.splice(destination.index, 0, movedCard)

    const newOrder = calculateNewOrder(destCards, destination.index)
    movedCard.order = newOrder

    // Optimistic Update
    newCardsMap[sourceListId] = sourceCards
    newCardsMap[destListId] = destCards
    setCardsByListId(newCardsMap)

    // API Call
    cardApi.reorder({ cardId, targetListId: destListId, newOrder }).catch(() => {
      toast.error('Failed to save position')
      fetchData() // Revert on failure
    })
  }

  const handleCreateCard = async (e: React.FormEvent, listId: number) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return

    try {
      const res = await cardApi.create({ title: newCardTitle, description: newCardDesc, listId })
      setCardsByListId(prev => ({
        ...prev,
        [listId]: [...(prev[listId] || []), res.data]
      }))
      setNewCardTitle('')
      setNewCardDesc('')
      setAddingCardToListId(null)
    } catch {
      toast.error('Failed to create card')
    }
  }

  const handleToggleCardStatus = (cardId: number, currentStatus: boolean) => {
    updateLocalCardState(cardId, c => ({ ...c, isCompleted: !currentStatus }))
    cardApi.toggleStatus(cardId).catch(() => {
      toast.error('Failed to update status')
      updateLocalCardState(cardId, c => ({ ...c, isCompleted: currentStatus })) // Revert
    })
  }

  const handleUpdateCard = async (cardId: number, data: { title: string; description: string; labels: Label[] }) => {
    updateLocalCardState(cardId, c => ({ ...c, ...data }))
    try {
      await cardApi.update(cardId, {
        title: data.title,
        description: data.description,
        labelIds: data.labels.map(label => label.id)
      })
      toast.success('Card updated')
    } catch {
      toast.error('Failed to update card')
      fetchData()
    }
  }

  const handleDeleteCard = async (cardId: number) => {
    deleteLocalCardState(cardId)
    try {
      await cardApi.delete(cardId)
      toast.success('Card deleted')
    } catch {
      toast.error('Failed to delete card')
      fetchData()
    }
  }

  const handleAssignMember = async (cardId: number, userId: number) => {
    const userToAdd = members.find(m => m.id === userId)
    if (!userToAdd) return

    updateLocalCardState(cardId, c => {
      if (c.assignees.some(a => a.id === userId)) return c
      return { ...c, assignees: [...c.assignees, userToAdd] }
    })
    await cardApi.assign(cardId, userId)
  }

  const handleUnassignMember = async (cardId: number, userId: number) => {
    updateLocalCardState(cardId, c => ({
      ...c,
      assignees: c.assignees.filter(u => u.id !== userId)
    }))
    await cardApi.unassign(cardId, userId)
  }

  const handleInviteUser = async (email: string) => {
    try {
      await projectApi.addMember(projectId, email)
      toast.success('Invitation sent')
      // Refresh members
      const res = await projectApi.getDetailById(projectId)
      if (res.data?.members) setMembers(res.data.members)
    } catch {
      toast.error('User not found or already added')
    }
  }

  // --- Render Helpers ---
  const renderHeader = () => (
    <div className="flex-none px-8 py-6 flex items-center justify-between border-b border-white/10">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Website Redesign Sprint</h1>

      {/* Improved Member Invite Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center -space-x-2">
          {members.slice(0, 5).map(m => (
            <Avatar key={m.id} className="h-9 w-9 border-2 border-white ring-1 ring-slate-200">
              <AvatarImage src={m.avatarUrl} />
              <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold">{getInitials(m.username)}</AvatarFallback>
            </Avatar>
          ))}
          {members.length > 5 && (
            <div className="h-9 w-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">+{members.length - 5}</div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-300 mx-1" />

        <Button onClick={() => setIsInviteModalOpen(true)} className="rounded-full h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium gap-2 shadow-sm transition-all">
          <UserPlus size={14} />
          Invite
        </Button>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#F3F4F6]">
        {renderHeader()}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 py-8">
            <div className="flex h-full gap-8">
              {boardColumns.map(column => {
                const isListReady = !column.id.startsWith('missing')
                const numericListId = isListReady ? Number(column.id) : -1

                return (
                  <div key={column.status} className="w-[320px] flex-shrink-0 flex flex-col max-h-full">
                    {/* List Header */}
                    <div className="flex-none flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-700 text-base">{column.title}</h3>
                        <span className="text-xs font-medium text-slate-500 bg-white shadow-sm border border-slate-100 px-2 py-0.5 rounded-full">{column.cards.length}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>

                    {/* Droppable Zone */}
                    <Droppable droppableId={column.id} isDropDisabled={!isListReady}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`
                            flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar min-h-0 pr-2 pb-4
                            transition-colors duration-200
                            ${snapshot.isDraggingOver ? 'bg-slate-200/40 rounded-xl' : ''}
                          `}
                        >
                          {column.cards.map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => {
                                    setSelectedCard(card)
                                    setIsEditModalOpen(true)
                                  }}
                                  style={{ ...provided.draggableProps.style }}
                                  className={`
                                    bg-white p-4 rounded-xl border group relative flex-shrink-0 cursor-pointer
                                    ${
                                      snapshot.isDragging
                                        ? 'shadow-2xl ring-1 ring-teal-600/20 rotate-2 scale-105 z-50 border-teal-600/20'
                                        : 'shadow-sm border-slate-200/60 hover:shadow-md hover:border-slate-300/60'
                                    }
                                    transition-all duration-200 ease-in-out
                                  `}
                                >
                                  {/* Card Content */}
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className={`text-slate-900 font-medium text-[15px] leading-snug ${card.isCompleted ? 'line-through text-slate-400' : ''}`}>{card.title}</h4>
                                    </div>

                                    {card.description && <p className={`text-[13px] line-clamp-2 ${card.isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>{card.description}</p>}

                                    <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-50 gap-2">
                                      {/* Avatars - Left */}
                                      <div className="flex -space-x-2 flex-shrink-0">
                                        {card.assignees?.slice(0, 3).map(user => (
                                          <Avatar key={user.id} className="h-6 w-6 border-2 border-white ring-1 ring-slate-100">
                                            <AvatarImage src={user.avatarUrl} />
                                            <AvatarFallback className="text-[9px] bg-teal-50 text-teal-700 font-bold">{getInitials(user.username)}</AvatarFallback>
                                          </Avatar>
                                        ))}
                                        {card.assignees && card.assignees.length > 3 && (
                                          <span className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-medium text-slate-500">
                                            +{card.assignees.length - 3}
                                          </span>
                                        )}
                                      </div>

                                      {/* Labels - Center */}
                                      <div className="flex-1 flex justify-center">
                                        <CardLabelsPreview labels={card.labels} />
                                      </div>

                                      {/* Complete button - Right */}
                                      <button
                                        onClick={e => {
                                          e.stopPropagation()
                                          handleToggleCardStatus(card.id, card.isCompleted)
                                        }}
                                        className={`
                                          h-6 w-6 rounded-full flex items-center justify-center transition-all flex-shrink-0
                                          ${card.isCompleted ? 'bg-emerald-500 text-white shadow-sm scale-110' : 'bg-slate-100 text-slate-300 hover:bg-emerald-100 hover:text-emerald-500'}
                                        `}
                                      >
                                        <Check size={12} strokeWidth={3} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {/* Add Card Input Area */}
                          {isListReady && (
                            <div className="mt-1">
                              {addingCardToListId === numericListId ? (
                                <div className="bg-white p-3 rounded-xl shadow-lg border border-teal-600 ring-1 ring-teal-600/20 animate-in fade-in zoom-in-95">
                                  <input
                                    autoFocus
                                    placeholder="Card Title..."
                                    className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent mb-2"
                                    value={newCardTitle}
                                    onChange={e => setNewCardTitle(e.target.value)}
                                  />
                                  <textarea
                                    placeholder="Description..."
                                    className="w-full text-xs text-slate-600 placeholder:text-slate-300 resize-none outline-none bg-transparent min-h-[40px]"
                                    value={newCardDesc}
                                    onChange={e => setNewCardDesc(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && !e.shiftKey) handleCreateCard(e, numericListId)
                                    }}
                                  />
                                  <div className="flex justify-end gap-2 mt-2">
                                    <Button size="sm" variant="ghost" onClick={() => setAddingCardToListId(null)} className="h-6 text-xs px-2 hover:bg-slate-50">
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={e => handleCreateCard(e, numericListId)} className="h-6 text-xs bg-teal-700 hover:bg-teal-800 text-white px-3">
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              ) : column.status === ListStatus.TODO ? (
                                <>
                                  <button
                                    onClick={() => setAddingCardToListId(numericListId)}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-slate-200 dashed-border"
                                  >
                                    <Plus size={16} /> Add Card
                                  </button>
                                </>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
              <div className="w-8 flex-shrink-0" />
            </div>
          </div>
        </DragDropContext>
      </div>

      <EditCardDialog
        card={selectedCard}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateCard}
        onDelete={handleDeleteCard}
        projectMembers={members}
        onAssign={handleAssignMember}
        onUnassign={handleUnassignMember}
        projectId={Number(projectId)}
        onCardUpdate={fetchData}
      />

      <InviteMemberDialog isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onInvite={handleInviteUser} />
    </DashboardLayout>
  )
}
