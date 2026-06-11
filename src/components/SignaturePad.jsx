import { useRef, useState } from 'react'
import { HiCheck } from '../icons'

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineWidth   = 2.5
    ctx.strokeStyle = '#0f172a'
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setIsEmpty(false)
  }

  const stop = () => {
    if (!drawing.current) return
    drawing.current = false
    if (!isEmpty) onChange?.(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange?.(null)
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        className="w-full border-2 border-dashed border-line dark:border-line-dark rounded-xl bg-white cursor-crosshair touch-none"
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted">
          {isEmpty ? 'Draw your signature above using mouse or touch' : (
            <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
              Signature captured <HiCheck className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          )}
        </p>
        {!isEmpty && (
          <button type="button" onClick={clear}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors font-medium">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
