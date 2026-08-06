import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  reply?: string
  originalMessage?: string
}

const Email = ({ name, reply, originalMessage }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Respuesta de ToNOI a tu mensaje de contacto</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Hola {name ?? 'amigo del ToNOI'},</Heading>
        <Text style={paragraph}>Hemos recibido tu mensaje y te respondemos:</Text>

        {originalMessage ? (
          <Section style={quote}>
            <Text style={quoteLabel}>Tu mensaje:</Text>
            <Text style={quoteText}>{originalMessage}</Text>
          </Section>
        ) : null}

        <Section style={replyBox}>
          <Text style={replyText}>{reply ?? ''}</Text>
        </Section>

        <Text style={footer}>Un saludo,<br />Equipo del ToNOI</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Respuesta a tu mensaje de contacto',
  displayName: 'Respuesta de contacto',
  previewData: {
    name: 'Carlos',
    reply: 'Gracias por escribirnos. La clasificación se actualiza automáticamente después de cada partido.',
    originalMessage: '¿Cuándo se actualiza la clasificación?',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#111827' }
const container = { padding: '24px 32px', maxWidth: '600px' }
const heading = { fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }
const paragraph = { fontSize: '16px', lineHeight: '1.5', color: '#374151', margin: '0 0 16px' }
const quote = { backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '16px', margin: '0 0 16px' }
const quoteLabel = { fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', margin: '0 0 8px' }
const quoteText = { fontSize: '14px', lineHeight: '1.5', color: '#374151', margin: '0', fontStyle: 'italic' }
const replyBox = { backgroundColor: '#eff6ff', borderLeft: '4px solid #2563eb', padding: '16px', margin: '0 0 16px' }
const replyText = { fontSize: '16px', lineHeight: '1.6', color: '#111827', margin: '0', whiteSpace: 'pre-wrap' }
const footer = { fontSize: '14px', lineHeight: '1.5', color: '#6b7280', margin: '24px 0 0' }
