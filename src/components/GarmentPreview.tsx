type GarmentPreviewProps = {
  image: string;
  alt: string;
  color: string;
  blendMode?: "multiply" | "color-burn";
  className?: string;
};

export function GarmentPreview({
  image,
  alt,
  color,
  blendMode,
  className = "",
}: GarmentPreviewProps) {
  return (
    <div className={`relative aspect-square overflow-hidden bg-black ${className}`}>
      <img src={image} alt={alt} className="h-full w-full object-cover" />
      {blendMode ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-multiply transition-colors duration-300"
          style={{
            backgroundColor: color,
            mixBlendMode: blendMode,
            opacity: 0.55,
          }}
        />
      ) : null}
    </div>
  );
}
