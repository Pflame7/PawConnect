import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Link } from "react-router-dom";
import { Timestamp } from "firebase/firestore";

import { useAuth } from "../../app/providers/useAuth";
import {
  deleteMessageForEveryone,
  markChatRead,
  sendMessage,
  watchChatMessages,
  watchUserChats,
} from "../../services/chats";
import type { ChatDoc, MessageDoc, UserLite } from "../../types/chat";

const CHAT_STORAGE_KEY = "pawconnect:selectedChatId";
const COMPOSER_MAX_ROWS = 5;
const CHAT_TOP_OFFSET_CLASS = "top-[72px]";
const CHAT_MAX_WIDTH_CLASS = "max-w-[1100px]";
const CONTEXT_MENU_WIDTH = 248;
const CONTEXT_MENU_HEIGHT = 56;
const VIEWPORT_MARGIN = 12;

type ChatListItem = {
  id: string;
  data: ChatDoc;
};

type MessageListItem = {
  id: string;
  data: MessageDoc;
};

type ContextMenuState = {
  messageId: string;
  left: number;
  top: number;
};

function formatTimeHHMM(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function safeToDate(
  value: ChatDoc["lastMessageAt"] | MessageDoc["createdAt"],
): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

function getOtherParticipant(params: {
  chat: ChatDoc;
  myUid: string;
}): UserLite | null {
  const allParticipants = Object.values(params.chat.participantInfo ?? {});
  return (
    allParticipants.find((participant) => participant.uid !== params.myUid) ??
    null
  );
}

function readInitialSelectedChatId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const saved = window.localStorage.getItem(CHAT_STORAGE_KEY);
  return saved ?? "";
}

function getTextareaMaxHeight(element: HTMLTextAreaElement): number {
  const computedStyle = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight);

  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    return 24 * COMPOSER_MAX_ROWS;
  }

  return lineHeight * COMPOSER_MAX_ROWS;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function ChatsPage() {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? "";

  const [search, setSearch] = useState<string>("");
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>(
    readInitialSelectedChatId,
  );
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [text, setText] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = watchUserChats({
      uid,
      onChange: (items) => {
        setChats(items);
      },
      onError: (error) => {
        console.error("watchUserChats failed", error);
      },
    });

    return () => {
      try {
        unsubscribe();
      } catch (error: unknown) {
        console.error("watchUserChats unsubscribe failed", error);
      }
    };
  }, [uid]);

  const activeChatId = useMemo(() => {
    if (!selectedChatId) return "";

    return chats.some((chat) => chat.id === selectedChatId)
      ? selectedChatId
      : "";
  }, [chats, selectedChatId]);

  const selectedChat = useMemo(() => {
    return chats.find((chat) => chat.id === activeChatId) ?? null;
  }, [activeChatId, chats]);

  const other = useMemo(() => {
    if (!selectedChat) return null;
    return getOtherParticipant({ chat: selectedChat.data, myUid: uid });
  }, [selectedChat, uid]);

  useEffect(() => {
    if (!activeChatId) return;

    const unsubscribe = watchChatMessages({
      chatId: activeChatId,
      take: 300,
      onChange: (items) => {
        setMessages(items);
      },
      onError: (error) => {
        console.error("watchChatMessages failed", error);
      },
    });

    return () => {
      try {
        unsubscribe();
      } catch (error: unknown) {
        console.error("watchChatMessages unsubscribe failed", error);
      }
    };
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId || !uid) {
      return;
    }

    if (messages.length === 0) {
      return;
    }

    void markChatRead({ chatId: activeChatId, uid }).catch((error: unknown) => {
      console.error("markChatRead while viewing active chat failed", error);
    });
  }, [activeChatId, uid, messages.length]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!selectedChatId) {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      return;
    }

    if (activeChatId) {
      window.localStorage.setItem(CHAT_STORAGE_KEY, activeChatId);
      return;
    }

    if (chats.length > 0) {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }, [activeChatId, chats.length, selectedChatId]);

  const visibleMessages = useMemo(() => {
    if (!activeChatId) return [];
    return messages;
  }, [activeChatId, messages]);

  const filteredChats = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    if (!queryText) return chats;

    return chats.filter((chat) => {
      const otherParticipant = getOtherParticipant({
        chat: chat.data,
        myUid: uid,
      });

      const name = (otherParticipant?.name ?? "").toLowerCase();
      const lastMessage = (chat.data.lastMessageText ?? "").toLowerCase();

      return name.includes(queryText) || lastMessage.includes(queryText);
    });
  }, [chats, search, uid]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";

    const maxHeight = getTextareaMaxHeight(textarea);
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [text]);

  useEffect(() => {
    if (!activeChatId) return;

    const scrollToBottom = (): void => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "auto",
      });
    };

    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom();

      window.setTimeout(() => {
        scrollToBottom();
      }, 50);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeChatId, visibleMessages.length]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeMenu = (): void => {
      setContextMenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  async function handleSend(): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!uid || !profile || !activeChatId) return;

    const me: UserLite = {
      uid,
      name: profile.name,
      avatarUrl: profile.avatarUrl ?? "",
    };

    try {
      await sendMessage({
        chatId: activeChatId,
        sender: me,
        text: trimmed,
      });

      setText("");
    } catch (error: unknown) {
      console.error("sendMessage failed", error);
    }
  }

  async function handleDeleteMessage(message: MessageListItem): Promise<void> {
    if (!activeChatId) return;
    if (!uid) return;
    if (message.data.senderId !== uid) return;

    try {
      await deleteMessageForEveryone({
        chatId: activeChatId,
        messageId: message.id,
        senderId: uid,
      });
    } catch (error: unknown) {
      console.error("deleteMessageForEveryone failed", error);
    } finally {
      setContextMenu(null);
    }
  }

  function handleOpenChat(chatId: string): void {
    setSelectedChatId(chatId);
    setContextMenu(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_STORAGE_KEY, chatId);
    }

    if (uid) {
      void markChatRead({ chatId, uid }).catch((error: unknown) => {
        console.error("markChatRead failed", error);
      });
    }
  }

  function handleBack(): void {
    setSelectedChatId("");
    setText("");
    setContextMenu(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }

  function handleComposerKeyDown(
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ): void {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSend();
  }

  function handleMessageContextMenu(
    event: ReactMouseEvent<HTMLDivElement>,
    message: MessageListItem,
  ): void {
    if (message.data.senderId !== uid) {
      return;
    }

    event.preventDefault();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = clamp(
      event.clientX - CONTEXT_MENU_WIDTH - 14,
      VIEWPORT_MARGIN,
      viewportWidth - CONTEXT_MENU_WIDTH - VIEWPORT_MARGIN,
    );

    const top = clamp(
      event.clientY - 18,
      VIEWPORT_MARGIN,
      viewportHeight - CONTEXT_MENU_HEIGHT - VIEWPORT_MARGIN,
    );

    setContextMenu({
      messageId: message.id,
      left,
      top,
    });
  }

  const contextMenuMessage = useMemo(() => {
    if (!contextMenu) return null;
    return (
      messages.find((message) => message.id === contextMenu.messageId) ?? null
    );
  }, [contextMenu, messages]);

  const inInbox = !activeChatId;

  if (inInbox) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
            Съобщения
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Твоите разговори
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-950">
            <span className="text-gray-400 dark:text-gray-500">🔎</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Търси разговор..."
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10">
            {filteredChats.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-600 dark:text-gray-300">
                Нямаш разговори още.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/10">
                {filteredChats.map((chat) => {
                  const otherParticipant = getOtherParticipant({
                    chat: chat.data,
                    myUid: uid,
                  });
                  const unread = chat.data.unreadCount?.[uid] ?? 0;
                  const lastAt = safeToDate(chat.data.lastMessageAt);
                  const timeLabel = lastAt ? formatTimeHHMM(lastAt) : "";

                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => handleOpenChat(chat.id)}
                      className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200 ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                        {otherParticipant?.avatarUrl ? (
                          <img
                            src={otherParticipant.avatarUrl}
                            alt={otherParticipant.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {(otherParticipant?.name ?? "?")
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {otherParticipant?.name ?? "Разговор"}
                          </div>
                          <div className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                            {timeLabel}
                          </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-3">
                          <div className="truncate text-sm text-gray-600 dark:text-gray-300">
                            {chat.data.lastMessageText
                              ? chat.data.lastMessageText
                              : "—"}
                          </div>

                          {unread > 0 ? (
                            <span className="inline-flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 px-2 text-[11px] font-semibold text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-64px)] bg-white dark:bg-neutral-950">
        <div className={`mx-auto w-full ${CHAT_MAX_WIDTH_CLASS}`}>
          <div className={`sticky ${CHAT_TOP_OFFSET_CLASS} z-30 mb-5`}>
            <div className="w-full rounded-[26px] border border-gray-200 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-950/80">
              <div className="flex min-h-[72px] items-center gap-4 px-5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:text-gray-200 dark:hover:bg-white/10"
                  aria-label="Назад"
                >
                  ←
                </button>

                {other ? (
                  <Link
                    to={`/caretakers/${other.uid}`}
                    className="inline-flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:hover:bg-white/10"
                    aria-label={`Отвори профила на ${other.name}`}
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gray-200 ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                      {other.avatarUrl ? (
                        <img
                          src={other.avatarUrl}
                          alt={other.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {other.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <span className="max-w-[240px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {other.name}
                    </span>
                  </Link>
                ) : (
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gray-200 ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        ?
                      </span>
                    </div>

                    <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Разговор
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pb-44">
            {visibleMessages.length === 0 ? (
              <div className="mb-6 flex justify-center">
                <span className="rounded-full bg-gray-100 px-4 py-1 text-xs text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
                  Няма съобщения
                </span>
              </div>
            ) : null}

            <div className="space-y-3">
              {visibleMessages.map((message, index) => {
                const mine = message.data.senderId === uid;
                const date = safeToDate(message.data.createdAt);
                const timeLabel = date ? formatTimeHHMM(date) : "";

                const previousMessage =
                  index > 0 ? visibleMessages[index - 1] : null;
                const previousDate = previousMessage
                  ? safeToDate(previousMessage.data.createdAt)
                  : null;

                const shouldShowDateDivider =
                  !date ||
                  !previousDate ||
                  !isSameCalendarDay(date, previousDate);

                return (
                  <div key={message.id}>
                    {date && shouldShowDateDivider ? (
                      <div className="mb-4 flex justify-center">
                        <span className="rounded-full bg-gray-100 px-4 py-1 text-xs text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
                          {formatDateLabel(date)}
                        </span>
                      </div>
                    ) : null}

                    <div
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        onContextMenu={
                          mine
                            ? (event) => {
                                handleMessageContextMenu(event, message);
                              }
                            : undefined
                        }
                        title={mine ? "Десен бутон за опции" : undefined}
                        className={`max-w-[340px] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          mine
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-gray-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.data.text}
                        </div>

                        <div
                          className={`mt-1 text-[11px] ${
                            mine
                              ? "text-white/70"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {timeLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/90">
          <div
            className={`mx-auto flex w-full ${CHAT_MAX_WIDTH_CLASS} items-end gap-3 px-0 py-4`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Напиши съобщение..."
              className="min-h-12 max-h-[120px] flex-1 resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
            />

            <button
              type="button"
              onClick={() => {
                void handleSend();
              }}
              className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-2xl bg-orange-500 text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
              aria-label="Изпрати"
            >
              ➤
            </button>
          </div>
        </div>
      </div>

      {contextMenu && contextMenuMessage ? (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setContextMenu(null)}
          onContextMenu={(event) => {
            event.preventDefault();
            setContextMenu(null);
          }}
        >
          <div
            className="fixed"
            style={{
              left: `${contextMenu.left}px`,
              top: `${contextMenu.top}px`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              <div className="absolute top-4 -right-1 h-3 w-3 rotate-45 border-r border-b border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900" />

              <button
                type="button"
                onClick={() => {
                  void handleDeleteMessage(contextMenuMessage);
                }}
                className="relative flex h-14 w-[248px] cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 text-left shadow-xl transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:focus-visible:ring-red-300/30"
              >
                <span className="text-lg text-red-500" aria-hidden="true">
                  🗑
                </span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Изтрий съобщението
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}