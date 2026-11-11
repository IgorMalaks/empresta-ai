"use client";

import Image from "next/image";
import { useState } from "react";

export function EquipmentPhoto({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!imageUrl || failedUrl === imageUrl) {
    return (
      <div
        className="photo-placeholder"
        role="img"
        aria-label={`Foto indisponível: ${name}`}
      >
        Foto indisponível
      </div>
    );
  }
  return (
    <Image
      className="equipment-photo"
      src={imageUrl}
      alt={`Foto de referência de ${name}`}
      width={800}
      height={600}
      unoptimized
      onError={() => setFailedUrl(imageUrl)}
    />
  );
}
