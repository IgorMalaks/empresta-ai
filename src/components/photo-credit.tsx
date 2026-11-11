function photoSource(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    if (["pixabay.com", "www.pixabay.com"].includes(url.hostname))
      return { url, name: "Pixabay", home: "https://pixabay.com/" };
    if (["pexels.com", "www.pexels.com"].includes(url.hostname))
      return { url, name: "Pexels", home: "https://www.pexels.com/" };
  } catch {
    return null;
  }
  return null;
}

export function PhotoCredit({ sources }: { sources: string[] }) {
  const providers = new Map<string, string>();
  for (const value of sources) {
    const source = photoSource(value);
    if (source) providers.set(source.name, source.home);
  }
  if (!providers.size) return null;
  return (
    <p className="photo-credit">
      Fotos:{" "}
      {Array.from(providers, ([name, home], index) => (
        <span key={name}>
          {index > 0 && ", "}
          <a href={home} target="_blank" rel="noopener noreferrer">
            {name}
          </a>
        </span>
      ))}
    </p>
  );
}

export function PhotographerCredit({
  photographer,
  sourceUrl,
}: {
  photographer: string | null;
  sourceUrl: string | null;
}) {
  const source = photoSource(sourceUrl);
  if (!photographer || !source) return null;
  return (
    <p className="photo-credit">
      Foto por{" "}
      <a href={source.url.href} target="_blank" rel="noopener noreferrer">
        {photographer}
      </a>{" "}
      no {source.name}.
    </p>
  );
}
