const textWithoutNul = { type: 'string', pattern: '^[^\\u0000]*$' } as const

const projectProperties = {
  name: { ...textWithoutNul, minLength: 1, maxLength: 120 },
  description: { anyOf: [{ ...textWithoutNul, maxLength: 2000 }, { type: 'null' }] },
} as const

export const createProjectBodySchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: projectProperties,
} as const

export const updateProjectBodySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: projectProperties,
} as const

export const projectParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
      minLength: 36,
      maxLength: 36,
    },
  },
} as const
