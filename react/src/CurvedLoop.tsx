import * as React from 'react'
import { useRef, useEffect, useLayoutEffect, useState, useMemo, useId } from 'react'
import type { FC } from 'react'

interface CurvedLoopProps {
  marqueeText?: string
  speed?: number
  className?: string
  svgClassName?: string
  curveAmount?: number
  direction?: 'left' | 'right'
  interactive?: boolean
}

function normalizeOffset(value: number, period: number): number {
  let o = value
  const w = period
  while (o <= -w) o += w
  while (o > 0) o -= w
  return o
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = '',
  speed = 2,
  className,
  svgClassName,
  curveAmount = 400,
  direction = 'left',
  interactive = true,
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText)
    return (hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText) + '\u00A0'
  }, [marqueeText])

  const measurePathRef = useRef<SVGTextPathElement | null>(null)
  const textPathRef = useRef<SVGTextPathElement | null>(null)
  const [spacing, setSpacing] = useState(0)
  const uid = useId()
  const pathId = `curve-${uid}`
  const pathD = useMemo(
    () => `M-100,40 Q500,${40 + curveAmount} 1540,40`,
    [curveAmount],
  )

  const dragRef = useRef(false)
  const lastXRef = useRef(0)
  const dirRef = useRef<'left' | 'right'>(direction)
  const velRef = useRef(0)

  const pathLength = useMemo(() => {
    if (typeof document === 'undefined') return 2200
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', pathD)
    return p.getTotalLength() || 2200
  }, [pathD])

  const textLength = spacing
  const totalText = useMemo(() => {
    if (!textLength) return text
    const repeats = Math.ceil(pathLength / textLength) + 8
    return Array(repeats).fill(text).join('')
  }, [text, textLength, pathLength])

  const ready = spacing > 0
  const textDisplayClass = useMemo(
    () => `fill-white ${className ?? ''}`.trim(),
    [className],
  )

  useLayoutEffect(() => {
    const node = measurePathRef.current
    if (!node) return
    const len = node.getComputedTextLength()
    if (len > 0) setSpacing(len)
  }, [text, className, pathId, pathD, svgClassName])

  useEffect(() => {
    dirRef.current = direction
  }, [direction])

  useLayoutEffect(() => {
    if (!spacing || !textPathRef.current) return
    const initial = normalizeOffset(-spacing, spacing)
    textPathRef.current.setAttribute('startOffset', `${initial}px`)
  }, [spacing])

  useEffect(() => {
    if (!spacing || !ready) return
    let frame = 0
    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === 'right' ? speed : -speed
        const currentOffset = parseFloat(textPathRef.current.getAttribute('startOffset') || '0')
        const newOffset = normalizeOffset(currentOffset + delta, spacing)
        textPathRef.current.setAttribute('startOffset', `${newOffset}px`)
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [spacing, speed, ready])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return
    dragRef.current = true
    lastXRef.current = e.clientX
    velRef.current = 0
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return
    const dx = e.clientX - lastXRef.current
    lastXRef.current = e.clientX
    velRef.current = dx
    const currentOffset = parseFloat(textPathRef.current.getAttribute('startOffset') || '0')
    const newOffset = normalizeOffset(currentOffset + dx, spacing)
    textPathRef.current.setAttribute('startOffset', `${newOffset}px`)
  }

  const endDrag = () => {
    if (!interactive) return
    dragRef.current = false
    const v = velRef.current
    if (Math.abs(v) > 0.35) {
      dirRef.current = v > 0 ? 'right' : 'left'
    }
  }

  const cursorStyle = interactive ? (dragRef.current ? 'grabbing' : 'grab') : 'auto'

  return (
    <div
      className="flex w-full max-w-full min-h-0 items-center justify-center"
      style={{ visibility: ready ? 'visible' : 'hidden', cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg
        className={`block aspect-100/12 w-full max-h-[min(34vh,260px)] max-w-full select-none overflow-visible text-[clamp(2rem,6.5vw,4.5rem)] font-bold uppercase leading-none ${svgClassName ?? ''}`}
        viewBox="0 0 1440 120"
      >
        <defs>
          <path id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>
        <text
          xmlSpace="preserve"
          className={textDisplayClass}
          style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          <textPath ref={measurePathRef} href={`#${pathId}`} startOffset="0">
            {text}
          </textPath>
        </text>
        {ready && (
          <text xmlSpace="preserve" className={textDisplayClass}>
            <textPath ref={textPathRef} href={`#${pathId}`} xmlSpace="preserve">
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  )
}

export default CurvedLoop
