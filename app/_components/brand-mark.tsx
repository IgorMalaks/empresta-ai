export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`logo-mark${small ? " logo-mark--small" : ""}`}
      aria-hidden="true"
    >
      <svg
        className="size-[1.15rem]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      >
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9m-4-15 8 4.5v4" />
      </svg>
    </span>
  );
}
