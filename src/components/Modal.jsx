import { useEffect, useId, useRef } from "react";

export default function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => previous?.focus?.();
  }, []);
  return (
    <dialog
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby={titleId}
      ref={ref}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
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
