import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  name: string;
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const [current, setCurrent] = useState(images[0]);

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_96px]">
      <div className="aspect-[4/4.8] overflow-hidden rounded-lg bg-mint sm:aspect-[4/5]">
        <img src={current} alt={name} className="h-full w-full object-cover" />
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-1">
        {images.map((src) => (
          <button
            type="button"
            key={src}
            onClick={() => setCurrent(src)}
            className={`aspect-square overflow-hidden rounded-md border-2 bg-mint ${
              current === src ? "border-forest" : "border-transparent"
            }`}
          >
            <img src={src} alt={`${name} 缩略图`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
