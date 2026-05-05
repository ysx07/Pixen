import { useEffect, useRef, useState } from 'react'
import { useRecipesStore } from '../stores/recipes'
import { usePipelineStore } from '../stores/pipeline'
import { useOrganizeStore } from '../stores/organize'
import { RECIPE_PRESETS } from '../utils/recipe-presets'
import { RecipeCard } from './RecipeCard'

interface RecipeLibraryProps {
  onClose: () => void
}

export function RecipeLibrary({ onClose }: RecipeLibraryProps) {
  const { recipes, addRecipe, deleteRecipe, duplicateRecipe, loadRecipeIntoPipeline } =
    useRecipesStore()
  const { operations } = usePipelineStore()
  const organizeConfig = useOrganizeStore((s) => s.config)

  const [saveName, setSaveName] = useState('')
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (!saveError) return
    const timer = setTimeout(() => setSaveError(null), 5000)
    return () => clearTimeout(timer)
  }, [saveError])

  useEffect(() => {
    if (!importError) return
    const timer = setTimeout(() => setImportError(null), 5000)
    return () => clearTimeout(timer)
  }, [importError])

  const handleSaveRecipe = () => {
    const trimmed = saveName.trim()
    if (trimmed.length === 0) {
      setSaveError('Recipe name cannot be empty')
      return
    }
    if (trimmed.length > 100) {
      setSaveError('Recipe name must be ≤ 100 characters')
      return
    }

    try {
      addRecipe({
        name: trimmed,
        operations,
        organize: organizeConfig.mode !== 'none' ? organizeConfig : undefined,
      })
      setSaveName('')
      setSaveOpen(false)
      setSaveError(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save recipe')
    }
  }

  const handleImportFile = async (file: File) => {
    try {
      const json = await file.text()
      const { recipe, errors } = useRecipesStore.getState().importRecipe(json)
      if (recipe) {
        setImportError(null)
      } else {
        setImportError(`Import failed: ${errors.join('; ')}`)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) {
      void handleImportFile(file)
      e.currentTarget.value = '' // Reset input
    }
  }

  const handleExportPreset = (presetId: string) => {
    const preset = RECIPE_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const json = JSON.stringify(preset, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${preset.name.toLowerCase().replace(/\s+/g, '-')}.pixen-recipe.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoadRecipe = (id: string) => {
    loadRecipeIntoPipeline(id)
    onClose()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-taupe-200 pb-2">
        <h3 className="font-serif text-xl text-taupe-900">Recipes</h3>
        <button
          onClick={onClose}
          className="rounded-md border border-taupe-300 px-3 py-1 text-xs text-taupe-700 hover:bg-taupe-100"
        >
          ← Pipeline
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setSaveOpen(!saveOpen)}
          className="rounded-md bg-sage-700 px-3 py-1 text-xs font-medium text-cream hover:bg-sage-800"
        >
          Save current
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-taupe-300 px-3 py-1 text-xs text-taupe-700 hover:bg-taupe-100"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {saveOpen && (
        <div className="mt-3 rounded-md border border-taupe-200 bg-taupe-50 p-3">
          <div className="mb-2 flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.currentTarget.value)}
              placeholder="Recipe name..."
              className="flex-1 rounded border border-taupe-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sage-500"
            />
            <button
              onClick={handleSaveRecipe}
              className="rounded-md bg-sage-700 px-2 py-1 text-xs font-medium text-cream hover:bg-sage-800"
            >
              Save
            </button>
            <button
              onClick={() => {
                setSaveOpen(false)
                setSaveName('')
              }}
              className="rounded-md border border-taupe-300 px-2 py-1 text-xs text-taupe-700 hover:bg-taupe-100"
            >
              Cancel
            </button>
          </div>
          {saveError && (
            <p className="text-xs text-error">{saveError}</p>
          )}
        </div>
      )}

      {importError && (
        <div className="mt-2 rounded-md border border-error/40 bg-error/10 p-2">
          <p className="text-xs text-error">{importError}</p>
        </div>
      )}

      <div className="mt-4 flex-1 overflow-y-auto space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-taupe-500">Built-in</p>
          <div className="space-y-2">
            {RECIPE_PRESETS.map((preset) => (
              <RecipeCard
                key={preset.id}
                recipe={preset}
                isPreset
                onLoad={handleLoadRecipe}
                onExport={() => handleExportPreset(preset.id)}
                onShare={() => {
                  const json = JSON.stringify(preset)
                  const encoded = btoa(encodeURIComponent(json))
                  const url = `${window.location.origin}${window.location.pathname}?recipe=${encoded}`
                  void navigator.clipboard.writeText(url)
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-taupe-500">
            My Recipes ({recipes.length})
          </p>
          {recipes.length === 0 ? (
            <p className="text-center text-sm text-taupe-500">
              No saved recipes yet. Build a pipeline and click Save current.
            </p>
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onLoad={handleLoadRecipe}
                  onDuplicate={duplicateRecipe}
                  onExport={() => {
                    const json = JSON.stringify(recipe, null, 2)
                    const blob = new Blob([json], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${recipe.name.toLowerCase().replace(/\s+/g, '-')}.pixen-recipe.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  onShare={() => {
                    const json = JSON.stringify(recipe)
                    const encoded = btoa(encodeURIComponent(json))
                    const url = `${window.location.origin}${window.location.pathname}?recipe=${encoded}`
                    void navigator.clipboard.writeText(url)
                  }}
                  onDelete={deleteRecipe}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
