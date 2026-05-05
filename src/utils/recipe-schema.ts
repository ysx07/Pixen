export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const VALID_OPERATION_TYPES = [
  'resize',
  'pad',
  'convert',
  'compress',
  'stripMetadata',
  'rename',
  'background-removal',
  'upscale',
] as const

const VALID_CONVERT_FORMATS = ['jpeg', 'png', 'webp', 'avif'] as const
const VALID_ORGANIZE_MODES = ['none', 'date', 'name_pattern', 'size_limit', 'combined'] as const

export function validateRecipeSchema(data: unknown): ValidationResult {
  const errors: string[] = []

  // Top-level object check
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Recipe must be a non-null object'] }
  }

  const recipe = data as Record<string, unknown>

  // Required fields
  if (typeof recipe.name !== 'string' || recipe.name.trim().length === 0) {
    errors.push('Recipe.name must be a non-empty string')
  } else if (recipe.name.length > 100) {
    errors.push('Recipe.name must be ≤ 100 characters')
  }

  if (typeof recipe.version !== 'number' || !Number.isInteger(recipe.version)) {
    errors.push('Recipe.version must be an integer')
  }

  if (typeof recipe.created !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(recipe.created)) {
    errors.push('Recipe.created must be a valid ISO 8601 timestamp')
  }

  if (!Array.isArray(recipe.operations)) {
    errors.push('Recipe.operations must be an array')
  } else {
    recipe.operations.forEach((op, idx) => {
      if (op === null || typeof op !== 'object' || Array.isArray(op)) {
        errors.push(`Operation[${idx}] must be an object`)
        return
      }

      const operation = op as Record<string, unknown>
      const opType = operation.type

      if (typeof opType !== 'string') {
        errors.push(`Operation[${idx}].type must be a string`)
        return
      }

      if (!VALID_OPERATION_TYPES.includes(opType as typeof VALID_OPERATION_TYPES[number])) {
        errors.push(`Operation[${idx}].type must be one of: ${VALID_OPERATION_TYPES.join(', ')}`)
        return
      }

      // Type-specific required fields
      switch (opType) {
        case 'resize':
          if (typeof operation.width !== 'number' || operation.width <= 0) {
            errors.push(`Operation[${idx}].width must be a positive number`)
          }
          if (typeof operation.height !== 'number' || operation.height <= 0) {
            errors.push(`Operation[${idx}].height must be a positive number`)
          }
          if (typeof operation.mode !== 'string') {
            errors.push(`Operation[${idx}].mode must be a string`)
          }
          break

        case 'pad':
          (['top', 'right', 'bottom', 'left'] as const).forEach((field) => {
            if (typeof operation[field] !== 'number' || operation[field] < 0) {
              errors.push(`Operation[${idx}].${field} must be a non-negative number`)
            }
          })
          if (typeof operation.fillMode !== 'string') {
            errors.push(`Operation[${idx}].fillMode must be a string`)
          }
          break

        case 'convert':
          if (typeof operation.format !== 'string' || !VALID_CONVERT_FORMATS.includes(operation.format as typeof VALID_CONVERT_FORMATS[number])) {
            errors.push(`Operation[${idx}].format must be one of: ${VALID_CONVERT_FORMATS.join(', ')}`)
          }
          break

        case 'compress':
          if (typeof operation.quality !== 'number' || operation.quality < 1 || operation.quality > 100) {
            errors.push(`Operation[${idx}].quality must be a number between 1 and 100`)
          }
          break

        case 'rename':
          if (typeof operation.pattern !== 'string') {
            errors.push(`Operation[${idx}].pattern must be a string`)
          }
          break

        case 'stripMetadata':
        case 'background-removal':
        case 'upscale':
          // No required fields for these
          break
      }
    })
  }

  // Optional organize field
  if (recipe.organize !== undefined) {
    if (recipe.organize === null || typeof recipe.organize !== 'object' || Array.isArray(recipe.organize)) {
      errors.push('Recipe.organize must be an object if present')
    } else {
      const organize = recipe.organize as Record<string, unknown>
      if (
        typeof organize.mode !== 'string' ||
        !VALID_ORGANIZE_MODES.includes(organize.mode as typeof VALID_ORGANIZE_MODES[number])
      ) {
        errors.push(`Recipe.organize.mode must be one of: ${VALID_ORGANIZE_MODES.join(', ')}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
