"use client";

import { useState, type KeyboardEvent } from "react";
import {
    Bot,
    X,
    Send,
    MessageCircle,
    Loader2,
    User,
    Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API ?? "";

// ============================================================
// TYPES
// ============================================================

type MessageRole = "user" | "assistant";

interface ChatMessage {
    id: number;
    role: MessageRole;
    content: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function JobChatbot() {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const [message, setMessage] = useState<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            role: "assistant",
            content:
                "Hi! 👋 I'm JobPortal AI. I can help you find jobs, understand applications, prepare for interviews, and improve your career.",
        },
    ]);

    // ==========================================================
    // SEND MESSAGE
    // ==========================================================

    const sendMessage = async (): Promise<void> => {
        const text = message.trim();

        if (!text || isLoading) {
            return;
        }

        if (!API) {
            console.error("NEXT_PUBLIC_API is not configured.");

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    role: "assistant",
                    content:
                        "Backend API is not configured. Please try again later.",
                },
            ]);

            return;
        }

        // --------------------------------------------------------
        // Add user message
        // --------------------------------------------------------

        const userMessage: ChatMessage = {
            id: Date.now(),
            role: "user",
            content: text,
        };

        setMessages((prev) => [...prev, userMessage]);

        setMessage("");
        setIsLoading(true);

        try {
            // ------------------------------------------------------
            // Django API
            // ------------------------------------------------------

            const response = await fetch(`${API}/api/chatbot/`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                credentials: "include",

                body: JSON.stringify({
                    message: text,
                }),
            });

            // ------------------------------------------------------
            // Response
            // ------------------------------------------------------

            const data: {
                success?: boolean;
                reply?: string;
                message?: string;
            } = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to process your request."
                );
            }

            // ------------------------------------------------------
            // AI message
            // ------------------------------------------------------

            const assistantMessage: ChatMessage = {
                id: Date.now() + 1,
                role: "assistant",
                content:
                    data.reply ||
                    "I couldn't generate a response. Please try again.",
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: unknown) {
            console.error("Chatbot error:", error);

            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                role: "assistant",
                content:
                    error instanceof Error
                        ? error.message
                        : "Sorry, something went wrong. Please try again.",
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================================
    // ENTER KEY
    // ==========================================================

    const handleKeyDown = (
        event: KeyboardEvent<HTMLInputElement>
    ): void => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void sendMessage();
        }
    };

    // ==========================================================
    // TOGGLE CHAT
    // ==========================================================

    const toggleChat = (): void => {
        setIsOpen((previous) => !previous);
    };

    // ==========================================================
    // UI
    // ==========================================================

    return (
        <>

            {isOpen && (
                <div
                    className="
            fixed
            bottom-24
            right-3
            z-[9999]

            flex
            h-[min(570px,calc(100vh-120px))]
            w-[calc(100vw-24px)]
            max-w-[390px]
            flex-col

            overflow-hidden
            rounded-3xl

            border
            border-slate-200/70
            bg-white

            shadow-2xl
            shadow-blue-900/15
            ring-1
            ring-black/5

            animate-in
            fade-in
            slide-in-from-bottom-4
            duration-200

            sm:right-5
            sm:w-[390px]

            lg:bottom-28
          "
                    role="dialog"
                    aria-label="JobPortal AI Chat"
                >
                    {/* ==================================================
              HEADER
              CHANGED: richer 3-stop gradient, subtle glow blob,
              tighter alignment, "Online" dot now pulses.
          ================================================== */}

                    <div
                        className="
              relative
              shrink-0
              overflow-hidden

              flex
              items-center
              justify-between

              bg-gradient-to-r
              from-blue-600
              via-indigo-600
              to-blue-700

              px-4
              py-4

              text-white
            "
                    >
                        {/* decorative glow, CSS-only */}
                        <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

                        {/* Brand */}

                        <div className="relative flex items-center gap-3">
                            <div
                                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center

                  rounded-xl

                  bg-white/15
                  ring-1
                  ring-white/25
                  backdrop-blur-sm
                "
                            >
                                <Bot className="h-5 w-5" />
                            </div>

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold tracking-tight">
                                        JobPortal AI
                                    </p>

                                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                                </div>

                                <div className="mt-0.5 flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                    </span>

                                    <span className="text-[11px] text-blue-100">
                                        Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Close */}

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={toggleChat}
                            aria-label="Close chatbot"
                            className="
                relative
                h-9
                w-9
                rounded-xl
                text-white
                transition-colors
                hover:bg-white/15
                hover:text-white
              "
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* ==================================================
              MESSAGES
              CHANGED: soft dotted bg pattern for texture,
              slightly more breathing room between bubbles.
          ================================================== */}

                    <div
                        className="
              flex-1
              space-y-4
              overflow-y-auto

              bg-slate-50
              [background-image:radial-gradient(theme(colors.slate.200)_1px,transparent_1px)]
              [background-size:16px_16px]

              px-3
              py-4
              sm:px-4
            "
                    >
                        {messages.map((chatMessage) => {
                            const isUser = chatMessage.role === "user";

                            return (
                                <div
                                    key={chatMessage.id}
                                    className={`flex ${isUser
                                        ? "justify-end"
                                        : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`
                      flex
                      max-w-[88%]
                      items-end
                      gap-2

                      ${isUser
                                                ? "flex-row-reverse"
                                                : "flex-row"
                                            }
                    `}
                                    >
                                        {/* Avatar */}

                                        <div
                                            className={`
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full

                        ${isUser
                                                    ? "bg-blue-100 text-blue-600"
                                                    : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm"
                                                }
                      `}
                                        >
                                            {isUser ? (
                                                <User className="h-3.5 w-3.5" />
                                            ) : (
                                                <Bot className="h-3.5 w-3.5" />
                                            )}
                                        </div>

                                        {/* Message */}

                                        <div
                                            className={`
                        rounded-2xl
                        px-3.5
                        py-2.5

                        text-sm
                        leading-5

                        ${isUser
                                                    ? `
                              rounded-br-sm
                              bg-gradient-to-br
                              from-blue-600
                              to-blue-700
                              text-white
                              shadow-md
                              shadow-blue-600/20
                            `
                                                    : `
                              rounded-bl-sm
                              border
                              border-slate-200
                              bg-white
                              text-slate-700
                              shadow-sm
                            `
                                                }
                      `}
                                        >
                                            {chatMessage.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* ==================================================
                TYPING INDICATOR
            ================================================== */}

                        {isLoading && (
                            <div className="flex items-end gap-2">
                                <div
                                    className="
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-br
                    from-blue-500
                    to-indigo-600
                    text-white
                  "
                                >
                                    <Bot className="h-3.5 w-3.5" />
                                </div>

                                <div
                                    className="
                    rounded-2xl
                    rounded-bl-sm
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    shadow-sm
                  "
                                >
                                    <div className="flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />

                                        <span
                                            className="
                        h-1.5
                        w-1.5
                        animate-bounce
                        rounded-full
                        bg-slate-400
                        [animation-delay:150ms]
                      "
                                        />

                                        <span
                                            className="
                        h-1.5
                        w-1.5
                        animate-bounce
                        rounded-full
                        bg-slate-400
                        [animation-delay:300ms]
                      "
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ==================================================
              INPUT AREA
              CHANGED: pill-shaped input, gradient send button
              with lift-on-hover, tighter helper text.
          ================================================== */}

                    <div
                        className="
              shrink-0
              border-t
              border-slate-200
              bg-white
              p-3
            "
                    >
                        <div className="flex items-center gap-2">
                            <Input
                                value={message}
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about jobs..."
                                disabled={isLoading}
                                aria-label="Chat message"
                                className="
                   h-11
    rounded-2xl
    border-slate-200
    bg-slate-50
    pl-4
    pr-11
    text-sm

    focus-visible:border-blue-400
    focus-visible:ring-1
    focus-visible:ring-blue-300/50

    sm:h-14
    sm:pl-5
    sm:pr-14
    sm:text-base
                "
                            />

                            <Button
                                type="button"
                                size="icon"
                                onClick={() => void sendMessage()}
                                disabled={!message.trim() || isLoading}
                                aria-label="Send message"
                                className="
                  h-11
                  w-11
                  shrink-0
                  rounded-full

                  bg-gradient-to-br
                  from-blue-600
                  to-blue-700
                  text-white

                  shadow-md
                  shadow-blue-600/25

                  transition-all
                  duration-150

                  hover:-translate-y-0.5
                  hover:shadow-lg
                  hover:shadow-blue-600/35

                  disabled:cursor-not-allowed
                  disabled:translate-y-0
                  disabled:opacity-50
                  disabled:shadow-none
                "
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        <p
                            className="
                mt-2
                text-center
                text-[9px]
                leading-4
                text-slate-400
              "
                        >
                            JobPortal AI may make mistakes. Verify important
                            information.
                        </p>
                    </div>
                </div>
            )}

            {/* ========================================================
          FLOATING CHAT BUTTON
          CHANGED: added an animated pulse ring behind the button
          so it draws the eye, richer gradient, larger tap target,
          notification dot now has its own subtle pulse too.
      ======================================================== */}

            <div className="fixed bottom-4 right-4 z-[9998] sm:bottom-6 sm:right-6">
                {/* pulse ring, CSS-only, only shown when closed */}
                {!isOpen && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/40" />
                )}

                <Button
                    type="button"
                    onClick={toggleChat}
                    size="icon"
                    aria-label={
                        isOpen
                            ? "Close JobPortal AI"
                            : "Open JobPortal AI"
                    }
                    className="
            relative

            h-14
            w-14

            rounded-full

            bg-gradient-to-br
            from-blue-500
            via-blue-600
            to-indigo-700

            text-white

            shadow-xl
            shadow-blue-600/30
            ring-4
            ring-white

            transition-all
            duration-200

            hover:scale-105
            hover:shadow-2xl
            hover:shadow-blue-600/40

            active:scale-95
          "
                >
                    {isOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <MessageCircle className="h-6 w-6" />
                    )}

                    {/* Online indicator */}

                    {!isOpen && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                        </span>
                    )}
                </Button>
            </div>
        </>
    );
}