import { useEffect, useRef, useState } from "react";

export default function Reveal({
  as: Component = "div",
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 650,
  once = true,
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.12,
  style,
  ...props
}) {
  const element = useRef(null);
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && !window.IntersectionObserver,
  );

  useEffect(() => {
    if (!element.current) return undefined;
    const node = element.current;
    if (!window.IntersectionObserver) {
      return undefined;
    }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  const revealDuration =
    typeof duration === "number" ? `${duration}ms` : duration;

  return (
    <Component
      ref={element}
      className={`landing-reveal landing-reveal--${direction} ${visible ? "is-visible" : ""} ${className}`}
      style={{
        ...style,
        "--reveal-delay": `${delay}ms`,
        "--reveal-duration": revealDuration,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
