import { useRef, useState, type FormEvent } from "react";
import { useChatStore } from "../store/chatStore";

export function LlmPage() {
  const { messages, isLoading, sendMessage } = useChatStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
    setInput("");

    // scroll al final
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <div className="page-container">
      <div className="panel">
        <div className="panel-header">
          <h2>Asistente LLM</h2>
          <p>Jarvis conectado a tu backend en FastAPI/Ollama.</p>
        </div>

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message chat-message--${msg.role}`}
              >
                <div className="chat-message-role">
                  {msg.role === "user" ? "Tú" : "Jarvis"}
                </div>
                <div className="chat-message-content">{msg.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSubmit}>
            <textarea
              className="chat-input"
              placeholder="Escribe tu pregunta para Jarvis... (Enter para enviar, Shift+Enter para salto de línea)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading) {
                    handleSubmit(e as any);
                  }
                }
              }}
              rows={3}
            />
            <div className="chat-input-footer">
              <span className="chat-hint">
                Jarvis responde en español y se enfoca en estudiantes UIDE.
              </span>
              <button
                type="submit"
                className="chat-send-button"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? "Generando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
