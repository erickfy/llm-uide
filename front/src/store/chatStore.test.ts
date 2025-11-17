import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChatStore } from './chatStore'

describe('useChatStore', () => {
  beforeEach(() => {
    // Reseteamos el estado a algo limpio antes de cada test
    useChatStore.setState({
      messages: [],
      isLoading: false,
      error: null,
    })

    // Mock global fetch
    ;(globalThis as any).fetch = vi.fn()
  })

  it('agrega mensaje del usuario y respuesta de Jarvis cuando la API responde OK', async () => {
    const mockFetch = globalThis.fetch as unknown as ReturnType<typeof vi.fn>

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ answer: 'Hola, soy Jarvis de prueba.' }),
    } as Response)

    const { sendMessage } = useChatStore.getState()

    await sendMessage('Hola Jarvis?')

    const { messages, isLoading, error } = useChatStore.getState()

    expect(error).toBeNull()
    expect(isLoading).toBe(false)

    // Debe existir el mensaje del usuario
    expect(
      messages.some((m) => m.role === 'user' && m.content === 'Hola Jarvis?'),
    ).toBe(true)

    // Debe existir la respuesta del asistente
    expect(
      messages.some(
        (m) =>
          m.role === 'assistant' &&
          m.content.includes('Jarvis de prueba'),
      ),
    ).toBe(true)

    // Verificamos que haya llamado al endpoint
    expect(mockFetch).toHaveBeenCalled()
  })

  it('marca error cuando la API falla', async () => {
    const mockFetch = globalThis.fetch as unknown as ReturnType<typeof vi.fn>

    mockFetch.mockRejectedValue(new Error('Network error'))

    const { sendMessage } = useChatStore.getState()
    await sendMessage('Hola?')

    const { error, isLoading } = useChatStore.getState()

    expect(isLoading).toBe(false)
    expect(error).not.toBeNull()
  })
})