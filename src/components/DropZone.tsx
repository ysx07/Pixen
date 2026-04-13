import { useCallback, useRef, useState } from 'react';

interface DropZoneProps {
  onFile: (file: File) => void;
}

export function DropZone({ onFile }: DropZoneProps) {
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFirstImage = useCallback(
    (files: FileList | File[] | null) => {
      if (!files) return;
      const list = Array.from(files);
      const image = list.find((f) => f.type.startsWith('image/'));
      if (image) onFile(image);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHovering(true);
      }}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHovering(false);
        pickFirstImage(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        hovering
          ? 'border-sage-500 bg-sage-50'
          : 'border-taupe-300 bg-taupe-50 hover:bg-taupe-100'
      }`}
    >
      <p className="font-serif text-lg text-taupe-900">Drop an image here</p>
      <p className="mt-1 text-sm text-taupe-600">or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => pickFirstImage(e.currentTarget.files)}
      />
    </div>
  );
}
