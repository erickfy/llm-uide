import { create } from 'zustand'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatState = {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (text: string) => Promise<void>
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    {
      role: 'assistant',
      content:
        'Hola, soy Jarvis 🧠. Soy tu asistente de la UIDE. ¿En qué te ayudo hoy?',
    },
  ],
  isLoading: false,
  error: null,

  async sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || get().isLoading) return

    // Limpia error anterior
    set({ error: null })

    // Añadimos mensaje del usuario
    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }))

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        const msg =
          detail?.detail ??
          `Error HTTP ${res.status} al llamar al backend de Jarvis`
        throw new Error(msg)
      }

      const data: { answer: string } = await res.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer,
      }

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }))
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : 'Error inesperado llamando a Jarvis'

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `⚠️ Hubo un problema: ${msg}`,
      }

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        error: msg,
      }))
    }
  },
}))