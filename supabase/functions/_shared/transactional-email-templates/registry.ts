import type { ComponentType } from 'npm:react@18.3.1'
import { template as contactReply } from './contact-reply.tsx'

export interface TemplateEntry {
  component: ComponentType<Record<string, unknown>>
  subject: string | ((data: Record<string, unknown>) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-reply': contactReply,
}
