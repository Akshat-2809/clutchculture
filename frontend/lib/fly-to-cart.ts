// Flies a copy of a product image into the navbar Garage button, then wiggles
// its icon. The button is marked with data-cart-target (icon: data-cart-icon).

const wiggle = (target: Element) =>
  target
    .querySelector("[data-cart-icon]")
    ?.animate(
      [
        { transform: "scale(1) rotate(0)" },
        { transform: "scale(1.3) rotate(-12deg)" },
        { transform: "scale(0.9) rotate(10deg)" },
        { transform: "scale(1.1) rotate(-4deg)" },
        { transform: "scale(1) rotate(0)" },
      ],
      { duration: 600, easing: "ease-out" },
    );

export function flyToCart(source: HTMLElement | null | undefined) {
  const target = document.querySelector("[data-cart-target]");
  if (!target) return;
  if (!source || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    wiggle(target);
    return;
  }

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    borderRadius: "16px",
    objectFit: "cover",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 20px 40px rgba(0,0,0,.25)",
  });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  ghost.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${dx * 0.5}px, ${dy - 80}px) scale(0.45)`,
        opacity: 0.9,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0.4 },
    ],
    { duration: 750, easing: "cubic-bezier(.5,0,.3,1)" },
  ).onfinish = () => {
    ghost.remove();
    wiggle(target);
  };
}
