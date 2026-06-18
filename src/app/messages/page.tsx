// Правая панель раздела «Сообщения», когда чат ещё не выбран.
export default function MessagesIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
        </svg>
      </div>
      <p className="mt-4 font-display text-lg font-bold">Сообщения</p>
      <p className="mt-1 text-sm text-muted">
        Выберите переписку слева, чтобы открыть чат.
      </p>
    </div>
  );
}
