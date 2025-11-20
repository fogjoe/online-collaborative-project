import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd'
import { boardsApi, listsApi, cardsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Plus, X } from 'lucide-react'
import { CardModal } from '@/components/CardModal'

interface TaskCard {
  id: string
  title: string
  description?: string
  order: number
  listId: string
}

interface List {
  id: string
  name: string
  order: number
  cards: TaskCard[]
}

interface Board {
  id: string
  name: string
  lists: List[]
}

export const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  useEffect(() => {
    if (boardId) {
      fetchBoard()
    }
  }, [boardId])

  const fetchBoard = async () => {
    try {
      const data = await boardsApi.getOne(boardId!)
      // Sort lists by order
      data.lists.sort((a: List, b: List) => a.order - b.order)
      // Sort cards in each list by order
      data.lists.forEach((list: List) => {
        list.cards.sort((a: TaskCard, b: TaskCard) => a.order - b.order)
      })
      setBoard(data)
    } catch (error) {
      console.error('Failed to fetch board', error)
    } finally {
      setLoading(false)
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result

    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // Handle List Reordering
    if (type === 'LIST') {
      const newLists = Array.from(board!.lists)
      const [movedList] = newLists.splice(source.index, 1)
      newLists.splice(destination.index, 0, movedList)

      setBoard({ ...board!, lists: newLists })

      try {
        await listsApi.update(draggableId, {
          order: destination.index
        })
      } catch (error) {
        console.error('Failed to update list position', error)
        fetchBoard()
      }
      return
    }

    // Handle Card Reordering
    if (type === 'CARD') {
      const sourceList = board?.lists.find(l => l.id === source.droppableId)
      const destList = board?.lists.find(l => l.id === destination.droppableId)

      if (!sourceList || !destList) return

      // Optimistic Update
      const newBoard = { ...board! }
      const sourceListIndex = newBoard.lists.findIndex(l => l.id === source.droppableId)
      const destListIndex = newBoard.lists.findIndex(l => l.id === destination.droppableId)

      const [movedCard] = newBoard.lists[sourceListIndex].cards.splice(source.index, 1)
      movedCard.listId = destination.droppableId
      newBoard.lists[destListIndex].cards.splice(destination.index, 0, movedCard)

      setBoard(newBoard)

      // API Call
      try {
        await cardsApi.update(draggableId, {
          listId: destination.droppableId,
          order: destination.index
        })
      } catch (error) {
        console.error('Failed to update card position', error)
        fetchBoard()
      }
    }
  }

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim() || !boardId) return

    try {
      await listsApi.create({
        name: newListTitle,
        boardId,
        order: board?.lists.length || 0
      })
      setNewListTitle('')
      setIsAddingList(false)
      fetchBoard()
    } catch (error) {
      console.error('Failed to create list', error)
    }
  }

  const handleAddCard = async (listId: string, title: string) => {
    try {
      await cardsApi.create({
        title,
        listId,
        order: 0 // Should be calculated
      })
      fetchBoard()
    } catch (error) {
      console.error('Failed to create card', error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!board) return <div className="p-8">Board not found</div>

  return (
    <div className="h-screen flex flex-col bg-[#F4F5F7]">
      {/* Board Header */}
      <div className="h-14 bg-white border-b px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-800">{board.name}</h1>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">Board</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="LIST">
            {(provided: DroppableProvided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex h-full gap-4 items-start">
                {board.lists.map((list, index) => (
                  <Draggable key={list.id} draggableId={list.id} index={index}>
                    {(provided: DraggableProvided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="w-72 shrink-0 bg-gray-100 rounded-lg p-2 flex flex-col max-h-full">
                        <div className="flex justify-between items-center p-2 mb-2">
                          <h3 className="font-semibold text-sm text-gray-700">{list.name}</h3>
                          <MoreHorizontal size={16} className="text-gray-500 cursor-pointer" />
                        </div>

                        <Droppable droppableId={list.id} type="CARD">
                          {(provided: DroppableProvided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 overflow-y-auto min-h-[10px]">
                              {list.cards?.map((card, cardIndex) => (
                                <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                                  {(provided: DraggableProvided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="bg-white p-3 rounded shadow-sm mb-2 text-sm hover:bg-gray-50 group cursor-pointer"
                                      onClick={() => setSelectedCardId(card.id)}
                                    >
                                      {card.title}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <div className="mt-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                            onClick={() => {
                              const title = prompt('Card Title:')
                              if (title) handleAddCard(list.id, title)
                            }}
                          >
                            <Plus size={16} className="mr-2" /> Add a card
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Add List Button */}
                <div className="w-72 shrink-0">
                  {isAddingList ? (
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Input autoFocus value={newListTitle} onChange={e => setNewListTitle(e.target.value)} placeholder="Enter list title..." className="mb-2 bg-white" />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleAddList}>
                          Add List
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsAddingList(false)}>
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="ghost" className="w-full justify-start bg-white/30 hover:bg-white/50 text-gray-700" onClick={() => setIsAddingList(true)}>
                      <Plus size={16} className="mr-2" /> Add another list
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {selectedCardId && <CardModal cardId={selectedCardId} onClose={() => setSelectedCardId(null)} onUpdate={fetchBoard} />}
    </div>
  )
}
