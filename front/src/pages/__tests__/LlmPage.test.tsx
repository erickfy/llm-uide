import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LlmPage } from '../LlmPage'

const sendMessageMock = vi.fn()

// Mock del store de Zustand usado dentro de LlmPage
vi.mock('../../store/chatStore', () => {
  return {
    useChatStore: () => ({
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Hola, soy Jarvis de prueba.',
        },
      ],
      isLoading: false,
      error: null,
      sendMessage: sendMessageMock,
    }),
  }
})

describe('LlmPage', () => {
  it('muestra el mensaje inicial de Jarvis', () => {
    render(<LlmPage />)

    expect(
      screen.getByText(/Jarvis de prueba/i),
    ).toBeInTheDocument()
  })

  it('envía el mensaje cuando el usuario hace click en Enviar', () => {
    render(<LlmPage />)

    const textarea = screen.getByPlaceholderText(/Escribe tu pregunta/i)
    const button = screen.getByRole('button', { name: /enviar/i })

    fireEvent.change(textarea, {
      target: { value: '¿Cuál es la capital de Francia?' },
    })
    fireEvent.click(button)

    expect(sendMessageMock).toHaveBeenCalledWith(
      '¿Cuál es la capital de Francia?',
    )
  })
})