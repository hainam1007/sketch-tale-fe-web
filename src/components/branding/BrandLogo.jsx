const assets = {
  wordmark: { src: "/brand/sketchtale-wordmark.png", width: 1093, height: 360 },
  mark: { src: "/brand/sketchtale-mark.png", width: 724, height: 543 },
  widget: { src: "/brand/sketchtale-widget.png", width: 512, height: 512 },
};

export default function BrandLogo({ variant = "wordmark", alt = "SketchTale", className = "", decorative = false }) {
  const asset = assets[variant] || assets.wordmark;
  return (
    <img
      className={`brand-logo brand-logo-${variant}${className ? ` ${className}` : ""}`}
      src={asset.src}
      alt={decorative ? "" : alt}
      width={asset.width}
      height={asset.height}
      aria-hidden={decorative ? "true" : undefined}
      decoding="async"
    />
  );
}
