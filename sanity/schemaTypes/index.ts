import { type SchemaTypeDefinition } from 'sanity'
import { settingsType } from './settings'
import { pageType } from './page'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [settingsType, pageType],
}
