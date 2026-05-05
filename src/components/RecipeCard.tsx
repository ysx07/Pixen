import { useEffect, useState } from 'react'
import type { Recipe } from '../stores/recipes'
import type { Operation } from '../stores/pipeline'

interface RecipeCardProps {
  recipe: Recipe
  isPreset?: boolean
  onLoad: (id: string) => void
  onDuplicate?: (id: string) => void
  onExport: (id: string) => void
  onShare: (id: string) => void
  onDelete?: (id: string) => void
}

const OPERATION_LABELS: Record<Operation['type'], string> = {
  resize: 'Resize',
  pad: 'Pad',
  convert: 'Convert',
  compress: 'Compress',
  stripMetadata: 'Strip',
  rename: 'Rename',
  'background-removal': 'Background Removal',
  upscale: 'Upscale',
}

export function RecipeCard({
  recipe,
  isPreset = false,
  onLoad,
  onDuplicate,
  onExport,
  onShare,
  onDelete,
}: RecipeCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const formattedDate = new Date(recipe.created).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  useEffect(() => {
    if (!confirmDelete) return
    const timer = setTimeout(() => setConfirmDelete(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmDelete])

  const opSummary =
    recipe.operations.length === 0
      ? 'No operations'
      : recipe.operations
          .slice(0, 3)
          .map((op) => OPERATION_LABELS[op.type])
          .join(', ') + (recipe.operations.length > 3 ? ` +${recipe.operations.length - 3} more` : '')


  return (
    <div className="rounded-md border border-taupe-200 bg-cream p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-taupe-900">{recipe.name}</span>
            {recipe.platform && (
              <span className="shrink-0 rounded bg-taupe-100 px-1.5 py-0.5 font-mono text-[10px] uppercase text-taupe-600">
                {recipe.platform}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-taupe-500">
            <span>{recipe.operations.length} op{recipe.operations.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="mb-2 font-mono text-[10px] text-taupe-500">{opSummary}</div>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onLoad(recipe.id)}
          className="rounded-md bg-sage-700 px-2 py-1 text-xs font-medium text-cream hover:bg-sage-800"
        >
          Load
        </button>

        {!isPreset && onDuplicate && (
          <button
            onClick={() => onDuplicate(recipe.id)}
            className="rounded-md border border-taupe-300 px-2 py-1 text-xs text-taupe-700 hover:bg-taupe-100"
          >
            Duplicate
          </button>
        )}

        <button
          onClick={() => onExport(recipe.id)}
          className="rounded-md border border-taupe-300 px-2 py-1 text-xs text-taupe-700 hover:bg-taupe-100"
        >
          Export
        </button>

        <button
          onClick={() => onShare(recipe.id)}
          className="rounded-md border border-taupe-300 px-2 py-1 text-xs text-taupe-700 hover:bg-taupe-100"
        >
          Share
        </button>

        {!isPreset && onDelete && (
          <button
            onClick={() => {
              if (confirmDelete) {
                onDelete(recipe.id)
              } else {
                setConfirmDelete(true)
              }
            }}
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              confirmDelete
                ? 'border border-error/40 bg-error/10 text-error hover:bg-error/20'
                : 'border border-taupe-300 text-taupe-700 hover:bg-taupe-100'
            }`}
          >
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  )
}
