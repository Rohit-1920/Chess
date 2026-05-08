'use client'
import { useEffect, useRef } from 'react'
import { List } from 'lucide-react'
import { MoveResponse } from '@/types'

interface MoveHistoryProps {
  moves: MoveResponse[]
  currentFen?: string
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest move
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [moves])

  // Group moves into pairs (white/black per row)
  const pairs: [MoveResponse, MoveResponse | null][] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1] ?? null])
  }

  return (
    <div className="flex flex-col h-full bg-surface-900 rounded-xl border border-cream/[0.07] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cream/[0.07]">
        <List size={14} className="text-gold-500/60" />
        <span className="text-xs font-medium text-cream/50 uppercase tracking-widest">Moves</span>
        <span className="ml-auto text-xs text-cream/20">{moves.length} total</span>
      </div>

      {/* Move list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {pairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-cream/20 text-sm text-center">
            <span>No moves yet.</span>
            <span className="text-xs mt-1 text-cream/10">Make the first move!</span>
          </div>
        ) : (
          pairs.map(([white, black], idx) => (
            <div key={idx} className="grid grid-cols-[28px_1fr_1fr] gap-1 items-center px-1 py-0.5 rounded hover:bg-surface-800 transition-colors group">
              {/* Move number */}
              <span className="text-[11px] text-cream/20 font-mono text-right pr-1">{idx + 1}.</span>

              {/* White move */}
              <MoveCell move={white} isLatest={!black && idx === pairs.length - 1} />

              {/* Black move */}
              {black ? (
                <MoveCell move={black} isLatest={idx === pairs.length - 1} />
              ) : (
                <div />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MoveCell({ move, isLatest }: { move: MoveResponse; isLatest: boolean }) {
  const san = move.sanNotation || move.uci

  return (
    <div className={`px-2 py-1 rounded text-xs font-mono transition-all ${
      isLatest
        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/20'
        : move.isAiMove
          ? 'text-sky-300/70'
          : 'text-cream/60 hover:text-cream/80'
    }`}>
      {san}
      {move.isAiMove && (
        <span className="ml-1 text-[9px] text-sky-400/50 uppercase">ai</span>
      )}
    </div>
  )
}
