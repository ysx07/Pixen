import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Operation } from './pipeline'
import type { OrganizeConfig } from '../types'
import { validateRecipeSchema } from '../utils/recipe-schema'
import { usePipelineStore } from './pipeline'
import { useOrganizeStore } from './organize'

export interface Recipe {
  id: string
  name: string
  version: number
  created: string // ISO 8601
  updatedAt: number
  description?: string
  operations: Operation[]
  organize?: OrganizeConfig
  platform?: 'instagram' | 'shopify' | 'twitter' | 'web' | 'archive'
}

export interface RecipesState {
  recipes: Recipe[]
  addRecipe: (recipe: Omit<Recipe, 'id' | 'version' | 'created' | 'updatedAt'>) => Recipe
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id' | 'version' | 'created'>>) => void
  deleteRecipe: (id: string) => void
  duplicateRecipe: (id: string) => Recipe | null
  getRecipe: (id: string) => Recipe | undefined
  exportRecipe: (id: string) => string
  importRecipe: (json: string) => { recipe: Recipe | null; errors: string[] }
  loadRecipeIntoPipeline: (id: string) => void
}

export const useRecipesStore = create<RecipesState>()(
  persist(
    (set, get) => ({
      recipes: [],

      addRecipe: (recipe) => {
        const newRecipe: Recipe = {
          ...recipe,
          id: crypto.randomUUID(),
          version: 1,
          created: new Date().toISOString(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          recipes: [...state.recipes, newRecipe],
        }))
        return newRecipe
      },

      updateRecipe: (id, updates) => {
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === id
              ? {
                  ...recipe,
                  ...updates,
                  updatedAt: Date.now(),
                }
              : recipe
          ),
        }))
      },

      deleteRecipe: (id) => {
        set((state) => ({
          recipes: state.recipes.filter((recipe) => recipe.id !== id),
        }))
      },

      duplicateRecipe: (id) => {
        const recipe = get().getRecipe(id)
        if (!recipe) return null
        return get().addRecipe({
          name: `${recipe.name} (copy)`,
          description: recipe.description,
          operations: recipe.operations,
          organize: recipe.organize,
          platform: recipe.platform,
        })
      },

      getRecipe: (id) => {
        return get().recipes.find((recipe) => recipe.id === id)
      },

      exportRecipe: (id) => {
        const recipe = get().getRecipe(id)
        if (!recipe) throw new Error('Recipe not found')
        return JSON.stringify(recipe, null, 2)
      },

      importRecipe: (json) => {
        try {
          const parsed = JSON.parse(json) as Record<string, unknown>
          const validation = validateRecipeSchema(parsed)

          if (!validation.valid) {
            return { recipe: null, errors: validation.errors }
          }

          const newRecipe = get().addRecipe({
            name: parsed.name as string,
            description: parsed.description as string | undefined,
            operations: parsed.operations as Operation[],
            organize: parsed.organize as OrganizeConfig | undefined,
            platform: parsed.platform as 'instagram' | 'shopify' | 'twitter' | 'web' | 'archive' | undefined,
          })

          return { recipe: newRecipe, errors: [] }
        } catch (err) {
          return {
            recipe: null,
            errors: [err instanceof Error ? err.message : 'Failed to parse JSON'],
          }
        }
      },

      loadRecipeIntoPipeline: (id) => {
        const recipe = get().getRecipe(id)
        if (!recipe) return

        // Clear current pipeline and load recipe operations
        usePipelineStore.getState().clearPipeline()
        recipe.operations.forEach((op) => {
          usePipelineStore.getState().addOperation(op)
        })

        // Load organize config if present
        if (recipe.organize) {
          useOrganizeStore.setState({ config: recipe.organize })
        }
      },
    }),
    {
      name: 'pixen-recipes',
      partialize: (state) => ({ recipes: state.recipes }),
      version: 1,
    }
  )
)
