import { FormEvent, useMemo, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiChatWidgetProps {
  token: string | null;
  isAuthenticated: boolean;
}

const BOT_WELCOME =
  "Hola. Soy tu asistente IA. Puedo responder preguntas sobre datos actuales de la plataforma y orientarte con informacion general del sistema.";

export function AiChatWidget({ token, isAuthenticated }: AiChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: BOT_WELCOME },
  ]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const canUseChat = Boolean(token) && isAuthenticated;

  const visibleMessages = useMemo(() => messages.slice(-16), [messages]);

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!canUseChat || isSending) return;

    const text = inputValue.trim();
    if (!text) return;

    const nextUserMessage: ChatMessage = { role: "user", content: text };
    const nextConversation = [...messages, nextUserMessage];

    setInputValue("");
    setError(null);
    setMessages(nextConversation);
    setIsSending(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          history: nextConversation.slice(-8),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || "No se pudo consultar al asistente");
      }

      const payload = (await response.json()) as { reply?: string };
      const assistantReply = String(payload.reply || "").trim();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            assistantReply || "No pude generar una respuesta en este momento.",
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo consultar al asistente",
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Tuve un problema tecnico para responder. Intenta nuevamente en unos segundos.",
        },
      ]);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  if (!canUseChat) return null;

  return (
    <div className="ai-chat-widget" aria-live="polite">
      {isOpen && (
        <section
          className="ai-chatbox"
          role="dialog"
          aria-label="Asistente de datos"
        >
          <header className="ai-chatbox-header">
            <div>
              <h3>Asistente IA</h3>
              <p>Preguntame por datos y estado de la plataforma.</p>
            </div>
            <button
              type="button"
              className="ai-chat-close"
              aria-label="Cerrar asistente"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="ai-chat-messages">
            {visibleMessages.map((message, index) => (
              <article
                key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                className={`ai-chat-bubble ${message.role === "user" ? "user" : "assistant"}`}
              >
                {message.content}
              </article>
            ))}
            {isSending && (
              <article className="ai-chat-bubble assistant ai-chat-loading">
                Escribiendo respuesta...
              </article>
            )}
            <div ref={endRef} />
          </div>

          {error && <p className="ai-chat-error">{error}</p>}

          <form className="ai-chat-form" onSubmit={sendMessage}>
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ejemplo: cuantas areas verdes hay?"
              maxLength={420}
            />
            <button type="submit" disabled={isSending || !inputValue.trim()}>
              Enviar
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="ai-chat-launcher"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        onClick={() => {
          setIsOpen((prev) => !prev);
          scrollToBottom();
        }}
      >
        <span aria-hidden="true">✦</span>
        <span>IA</span>
      </button>
    </div>
  );
}
