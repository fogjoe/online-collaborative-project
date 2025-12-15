import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditCardDialog } from '@/components/board/EditCardDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, Check, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { listApi, cardApi, projectApi } from '@/services/api'
import { InviteMemberDialog } from '@/components/board/InviteMemberDialog'

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

export interface Card {
  id: number
  title: string
  description?: string
  order: number
  isCompleted: boolean
  assignees: User[]
}

// The raw List object from the DB
interface DbList {
  id: number
  status: ListStatus // Changed from 'name' to 'status'
  order: number
  cards: Card[]
}

// The structure for our UI Columns
interface BoardColumn {
  id: string // This will be the DB List ID as a string
  title: string // Display Title ("To Do")
  status: ListStatus
  cards: Card[]
}

// --- Constants & Helpers ---

const COLUMN_TITLES: Record<ListStatus, string> = {
  [ListStatus.TODO]: 'To Do',
  [ListStatus.IN_PROGRESS]: 'In Progress',
  [ListStatus.DONE]: 'Done'
}

// Fractional Indexing Helper
const calculateNewOrder = (cards: Card[], destinationIndex: number): number => {
  if (!cards || cards.length === 0) return 10000
  if (destinationIndex === 0) return cards[0].order / 2
  if (destinationIndex >= cards.length) return cards[cards.length - 1].order + 10000

  const prevCard = cards[destinationIndex - 1]
  const nextCard = cards[destinationIndex]

  if (!prevCard || !nextCard) return 10000

  return (prevCard.order + nextCard.order) / 2
}

export const BoardPage = () => {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  // We keep the raw lists to know which ID belongs to which Status
  const [dbLists, setDbLists] = useState<DbList[]>([])

  // We store cards in a map { listId: Card[] } for easy DND updates
  const [cardsByListId, setCardsByListId] = useState<Record<number, Card[]>>({})

  // Local state for adding cards
  const [addingCardToListId, setAddingCardToListId] = useState<number | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDesc, setNewCardDesc] = useState('')

  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [members, setMembers] = useState<User[]>([])

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // --- 1. Fetch Data ---
  useEffect(() => {
    if (!projectId) return

    listApi
      .getByProject(projectId)
      .then(response => {
        const lists: DbList[] = response.data
        setDbLists(lists)

        // Transform into our Map structure
        const newCardsMap: Record<number, Card[]> = {}
        lists.forEach(list => {
          // Ensure cards are sorted by order
          newCardsMap[list.id] = (list.cards || []).sort((a, b) => a.order - b.order)
        })
        setCardsByListId(newCardsMap)
      })
      .catch(error => {
        console.error('Failed to fetch board', error)
        toast.error('Failed to load board data')
      })

    projectApi.getDetailById(projectId).then(res => {
      if (res.data && res.data.members) {
        setMembers(res.data.members)
      }
    })
  }, [projectId])

  // --- 2. Construct UI Columns ---
  // We want FIXED columns (Todo -> In Progress -> Done) regardless of DB order
  const boardColumns: BoardColumn[] = useMemo(() => {
    // 1. Find the DB List ID for each status
    // (Assuming backend ensures 1 list per status exists)
    const getListByStatus = (status: ListStatus) => dbLists.find(l => l.status === status)

    const todoList = getListByStatus(ListStatus.TODO)
    const inProgressList = getListByStatus(ListStatus.IN_PROGRESS)
    const doneList = getListByStatus(ListStatus.DONE)

    // 2. Map to UI structure
    // If backend hasn't created the list yet, we might have a null ID (handled safely below)
    return [
      {
        id: todoList?.id.toString() || 'missing-todo',
        title: COLUMN_TITLES[ListStatus.TODO],
        status: ListStatus.TODO,
        cards: todoList ? cardsByListId[todoList.id] || [] : []
      },
      {
        id: inProgressList?.id.toString() || 'missing-inprogress',
        title: COLUMN_TITLES[ListStatus.IN_PROGRESS],
        status: ListStatus.IN_PROGRESS,
        cards: inProgressList ? cardsByListId[inProgressList.id] || [] : []
      },
      {
        id: doneList?.id.toString() || 'missing-done',
        title: COLUMN_TITLES[ListStatus.DONE],
        status: ListStatus.DONE,
        cards: doneList ? cardsByListId[doneList.id] || [] : []
      }
    ]
  }, [dbLists, cardsByListId])

  // --- 3. Drag Logic ---
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result

    // Basic validation
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    // Parse IDs
    const sourceListId = Number(source.droppableId)
    const destListId = Number(destination.droppableId)

    // Clone current state
    const newCardsMap = { ...cardsByListId }

    // Get arrays (handle moving between different lists)
    const sourceCards = [...(newCardsMap[sourceListId] || [])]
    const destCards = sourceListId === destListId ? sourceCards : [...(newCardsMap[destListId] || [])]

    // 1. Remove from Source
    const [movedCard] = sourceCards.splice(source.index, 1)

    // 2. Add to Destination
    destCards.splice(destination.index, 0, movedCard)

    // 3. Calculate New Order
    const newOrder = calculateNewOrder(destCards, destination.index)
    movedCard.order = newOrder

    // 4. Update Map & State (Optimistic)
    newCardsMap[sourceListId] = sourceCards
    newCardsMap[destListId] = destCards
    setCardsByListId(newCardsMap)

    // 5. API Call
    cardApi
      .reorder({
        cardId: Number(draggableId),
        targetListId: destListId,
        newOrder: newOrder
      })
      .then(res => {
        console.log('res: ', res)
        toast.success(res?.message || 'Card moved successfully')
      })
      .catch(() => {
        toast.error('Failed to save card position')
        // Ideally revert state here in a real app
      })
  }

  // --- 4. Create Card ---
  const handleCreateCard = (e: React.FormEvent, listId: number) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return

    cardApi
      .create({
        title: newCardTitle,
        description: newCardDesc,
        listId
      })
      .then(response => {
        const newCard = response.data

        // Update local state
        setCardsByListId(prev => ({
          ...prev,
          [listId]: [...(prev[listId] || []), newCard]
        }))

        // Reset form
        setNewCardTitle('')
        setNewCardDesc('')
        setAddingCardToListId(null)
      })
      .catch(error => {
        console.error('Failed to create card', error)
        toast.error('Failed to create card')
      })
  }

  // --- 5. Toggle Status ---
  const handleToggleCardStatus = (cardId: number, currentStatus: boolean, listId: number) => {
    // 1. Optimistic Update
    setCardsByListId(prev => {
      const listCards = prev[listId] || []
      const updatedCards = listCards.map(c => (c.id === cardId ? { ...c, isCompleted: !currentStatus } : c))
      return { ...prev, [listId]: updatedCards }
    })

    // 2. API Call
    cardApi.toggleStatus(cardId).catch(() => {
      toast.error('Failed to update status')
      // Revert logic would go here
      setCardsByListId(prev => {
        const listCards = prev[listId] || []
        const updatedCards = listCards.map(c => (c.id === cardId ? { ...c, isCompleted: currentStatus } : c))
        return { ...prev, [listId]: updatedCards }
      })
    })
  }

  // --- 6. Edit Card Logic ---
  const handleUpdateCard = async (cardId: number, data: { title: string; description: string }) => {
    // Optimistic Update
    setCardsByListId(prev => {
      const newMap = { ...prev }
      // We have to find which list this card belongs to
      for (const listId in newMap) {
        newMap[listId] = newMap[listId].map(c => (c.id === cardId ? { ...c, ...data } : c))
      }
      return newMap
    })

    // API Call
    try {
      await cardApi.update(cardId, data)
      toast.success('Card updated')
    } catch {
      toast.error('Failed to update card')
      // Ideally revert state here...
    }
  }

  // --- 7. Delete Card Logic ---
  const handleDeleteCard = async (cardId: number) => {
    // Optimistic Update
    setCardsByListId(prev => {
      const newMap = { ...prev }
      for (const listId in newMap) {
        newMap[listId] = newMap[listId].filter(c => c.id !== cardId)
      }
      return newMap
    })

    // API Call
    try {
      await cardApi.delete(cardId)
      toast.success('Card deleted')
    } catch {
      toast.error('Failed to delete card')
    }
  }

  const openEditModal = (card: Card) => {
    setSelectedCard(card)
    setIsEditModalOpen(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAssignMember = async (cardId: number, userId: number) => {
    // Optimistic Update
    setCardsByListId(prev => {
      const newMap = { ...prev }
      for (const listId in newMap) {
        newMap[listId] = newMap[listId].map(c => {
          if (c.id === cardId) {
            // Find the user object from our 'members' state
            const userToAdd = members.find(m => m.id === userId)
            if (userToAdd && !c.assignees.some(a => a.id === userId)) {
              return { ...c, assignees: [...c.assignees, userToAdd] }
            }
          }
          return c
        })
      }
      return newMap
    })

    // API Call
    await cardApi.assign(cardId, userId)
  }

  const handleUnassignMember = async (cardId: number, userId: number) => {
    // Optimistic Update
    setCardsByListId(prev => {
      const newMap = { ...prev }
      for (const listId in newMap) {
        newMap[listId] = newMap[listId].map(c => (c.id === cardId ? { ...c, assignees: c.assignees.filter(u => u.id !== userId) } : c))
      }
      return newMap
    })

    // API Call
    await cardApi.unassign(cardId, userId)
  }

  const handleInviteUser = async (email: string) => {
    if (!projectId) return
    try {
      await projectApi.addMember(Number(projectId), email)
      toast.success('Invitation sent successfully')

      // Refresh member list so they show up in dropdowns immediately
      const res = await projectApi.getDetailById(Number(projectId))
      if (res.data && res.data.members) {
        setMembers(res.data.members)
      }
    } catch {
      toast.error('Failed to invite user. Check if email exists.')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#F3F4F6]">
        {/* Header */}
        <div className="flex-none px-8 py-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Website Redesign Sprint</h1>
          {/* <Button className="bg-[#0F766E] hover:bg-[#0d655e] text-white gap-2 rounded-lg px-6 shadow-sm h-10">
            <Share2 size={18} /> Share
          </Button> */}
          <div className="flex -space-x-2 ml-4">
            {members.slice(0, 5).map(m => (
              <div key={m.id} className="h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                {m.username.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={() => setIsInviteModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <UserPlus size={16} />
          Invite Member
        </Button>

        {/* Kanban Board Container */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
            <div className="flex h-full gap-8">
              {/* Render the 3 Fixed Columns */}
              {boardColumns.map(column => {
                // If the backend hasn't created this list yet, handle it safely
                // (In a real app, you might auto-create these lists on Project creation)
                const isListReady = !column.id.startsWith('missing')
                const numericListId = isListReady ? Number(column.id) : -1

                return (
                  <div key={column.status} className="w-[320px] flex-shrink-0 flex flex-col max-h-full">
                    {/* List Header */}
                    <div className="flex-none flex items-center justify-between mb-5 px-1">
                      <h3 className="font-semibold text-slate-700 text-base">{column.title}</h3>
                      <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{column.cards.length}</span>
                    </div>

                    {/* Droppable Zone (Scrollable) */}
                    <Droppable droppableId={column.id} isDropDisabled={!isListReady}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`
                            flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar min-h-0 pr-2
                            ${snapshot.isDraggingOver ? 'bg-slate-200/50 rounded-xl' : ''}
                          `}
                        >
                          {column.cards.map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => openEditModal(card)}
                                  style={{ ...provided.draggableProps.style }}
                                  className={`
                                    bg-white p-5 rounded-xl border border-transparent group relative flex-shrink-0
                                    ${snapshot.isDragging ? 'shadow-xl ring-1 ring-[#0F766E]/20 rotate-2 scale-105 z-50' : 'shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md'}
                                    transition-all duration-200 ease-in-out
                                  `}
                                >
                                  {/* Card Content */}
                                  <div className="flex flex-col gap-1.5">
                                    <h4 className={`text-slate-900 font-semibold text-[15px] leading-snug ${card.isCompleted ? 'line-through text-slate-400' : ''}`}>{card.title}</h4>
                                    {card.description && <p className={`text-[13px] font-normal leading-relaxed ${card.isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>{card.description}</p>}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex justify-between items-center pt-3">
                                    <div className="flex -space-x-2.5 overflow-hidden py-1 pl-1">
                                      {' '}
                                      {/* Added padding so shadow doesn't get cut off */}
                                      {card.assignees &&
                                        card.assignees.map(user => (
                                          <Avatar key={user.id} className="h-8 w-8 border-2 border-white ring-2 ring-slate-100 shadow-sm transition-transform hover:z-10 hover:-translate-y-0.5">
                                            <AvatarImage src={user.avatarUrl} className="object-cover" />
                                            <AvatarFallback className="flex items-center justify-center bg-gradient-to-br from-teal-400 to-[#0F766E] text-white text-xs font-bold">
                                              {getInitials(user.username)}
                                            </AvatarFallback>
                                          </Avatar>
                                        ))}
                                    </div>

                                    <button
                                      onClick={e => {
                                        e.stopPropagation()
                                        handleToggleCardStatus(card.id, card.isCompleted, numericListId)
                                      }}
                                      className={`
                                        w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                                        border cursor-pointer hover:scale-110 active:scale-95
                                        ${
                                          card.isCompleted
                                            ? 'bg-[#10B981] border-[#10B981] text-white shadow-sm'
                                            : 'bg-white border-slate-200 text-transparent hover:border-[#10B981]/50 hover:text-[#10B981]/50'
                                        }
                                      `}
                                    >
                                      <Check size={14} strokeWidth={3} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {/* Add Card Form - Only show if list is ready */}
                          {isListReady && (
                            <div className="flex-shrink-0 pb-2">
                              {addingCardToListId === numericListId ? (
                                <div className="bg-white p-4 rounded-xl shadow-lg border border-[#0F766E] animate-in fade-in zoom-in-95 mt-1">
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
                                        handleCreateCard(e, numericListId)
                                      }
                                    }}
                                  />
                                  <div className="flex justify-end gap-2 mt-3 border-t border-slate-100 pt-2">
                                    <Button size="sm" variant="ghost" onClick={() => setAddingCardToListId(null)} className="h-7 px-2 text-slate-500 hover:text-slate-700">
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={e => handleCreateCard(e, numericListId)} className="h-7 bg-[#0F766E] hover:bg-[#0d655e] text-white px-3">
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              ) : column?.status === ListStatus.TODO ? (
                                <button
                                  onClick={() => setAddingCardToListId(numericListId)}
                                  className="flex items-center gap-2 text-white bg-[#0F766E] hover:bg-[#0d655e] hover:shadow-md px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm w-fit mt-2 opacity-90 hover:opacity-100"
                                >
                                  <Plus size={16} /> Add a card
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}

              {/* Spacer */}
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
      />

      <InviteMemberDialog isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} onInvite={handleInviteUser} />
    </DashboardLayout>
  )
}
