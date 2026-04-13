import { create } from 'zustand';
import { Operation } from './pipeline';

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  operations: Operation[];
  platform?: 'instagram' | 'shopify' | 'twitter' | 'linkedin' | 'web' | 'archive';
  createdAt: number;
  updatedAt: number;
}

export interface RecipesState {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => void;
  deleteRecipe: (id: string) => void;
  getRecipe: (id: string) => Recipe | undefined;
  exportRecipe: (id: string) => string;
  importRecipe: (json: string) => Recipe | null;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  recipes: [],

  addRecipe: (recipe) => {
    const now = Date.now();
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe-${now}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      recipes: [...state.recipes, newRecipe],
    }));
    get().saveToLocalStorage();
  },

  updateRecipe: (id, updates) =>
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
    })),

  deleteRecipe: (id) => {
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.id !== id),
    }));
    get().saveToLocalStorage();
  },

  getRecipe: (id) => {
    return get().recipes.find((recipe) => recipe.id === id);
  },

  exportRecipe: (id) => {
    const recipe = get().getRecipe(id);
    if (!recipe) throw new Error('Recipe not found');
    return JSON.stringify(recipe, null, 2);
  },

  importRecipe: (json) => {
    try {
      const recipe = JSON.parse(json) as Recipe;
      // Validate basic structure
      if (!recipe.name || !Array.isArray(recipe.operations)) {
        return null;
      }
      return recipe;
    } catch {
      return null;
    }
  },

  loadFromLocalStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('pixen-recipes');
      if (stored) {
        const recipes = JSON.parse(stored) as Recipe[];
        set({ recipes });
      }
    } catch (error) {
      console.error('Failed to load recipes from localStorage:', error);
    }
  },

  saveToLocalStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const recipes = get().recipes;
      localStorage.setItem('pixen-recipes', JSON.stringify(recipes));
    } catch (error) {
      console.error('Failed to save recipes to localStorage:', error);
    }
  },
}));
