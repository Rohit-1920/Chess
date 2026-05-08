'use client'
import { useState } from 'react'
import { Flag, RotateCcw, Home, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface GameControlsProps {
  onResign: () => void
  onFlipBoard: () => void
  canResign: boolean
  gameId: number
}

export function GameControls({ onResign, onFlipBoard, canResign }: GameControlsProps) {
  const [resignConfirm, setResignConfirm] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Flip board */}
        <button
          onClick={onFlipBoard}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-cream/40 hover:text-cream/70 hover:bg-surface-700 border border-cream/[0.07] transition-all"
          title="Flip board"
        >
          <RotateCcw size={12} />
          Flip
        </button>

        {/* Resign */}
        {canResign && (
          <button
            onClick={() => setResignConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-900/20 border border-red-700/20 transition-all"
            title="Resign"
          >
            <Flag size={12} />
            Resign
          </button>
        )}
      </div>

      {/* Resign confirmation modal */}
      <Modal
        isOpen={resignConfirm}
        onClose={() => setResignConfirm(false)}
        title="Resign Game?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-cream/50">
            Are you sure you want to resign? This will count as a loss.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setResignConfirm(false)} className="flex-1">
              Keep Playing
            </Button>
            <Button
              variant="danger"
              onClick={() => { onResign(); setResignConfirm(false) }}
              className="flex-1"
            >
              <Flag size={14} />
              Resign
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
