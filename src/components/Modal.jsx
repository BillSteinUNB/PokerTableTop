import { useEffect, useId, useRef } from "react";

export default function Modal({
  title,
  onClose,
  children,
  wide = false,
  className = "",
}) {
  const ref = useRef(null);
  const backdropPress = useRef(false);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus?.();
  }, []);
  return (
    <dialog
      className={`modal ${wide ? "wide" : ""} ${className}`}
      aria-labelledby={titleId}
      ref={ref}
      onCancel={onClose}
      onPointerDown={(event) => {
        const bounds = ref.current.getBoundingClientRect();
        backdropPress.current =
          event.target === ref.current &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom);
      }}
      onClick={(event) => {
        if (event.target === ref.current && backdropPress.current) onClose();
        backdropPress.current = false;
      }}
    >
      <div className="modal-heading">
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
