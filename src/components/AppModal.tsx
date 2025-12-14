// src/components/AppModal.tsx
import React, { useEffect } from "react";

type Props = {
  open: boolean;
  title?: string;
  text?: string;

  /** іконка зверху (можна вимкнути: icon={null}) */
  icon?: string | null;

  /** кастомний контент всередині (для адмінки) */
  children?: React.ReactNode;

  /** кастомний футер (кнопки) */
  footer?: React.ReactNode;

  /** ширина картки */
  width?: number | string; // напр. 560 або "min(92vw, 720px)"

  /** максимальна висота контенту (щоб був скрол) */
  maxBodyHeight?: number | string; // напр. 52vh

  /** закривати по кліку на фон */
  closeOnBackdrop?: boolean;

  onClose: () => void;
};

export default function AppModal({
  open,
  title = "Magic Time",
  text,
  icon = "/ui/popap.png",
  children,
  footer,
  width = "min(92vw, 680px)",
  maxBodyHeight = "52vh",
  closeOnBackdrop = true,
  onClose,
}: Props) {
  // Закриття по ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" ? onClose() : null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const body = children ? (
    <div className="modal-body">{children}</div>
  ) : text ? (
    <div className="modal-text">{text}</div>
  ) : null;

  return (
    <div
      className="app-modal"
      role="dialog"
      aria-modal="true"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width }}>
        {icon ? (
          <div className="modal-icon-wrap">
            <img className="modal-icon" src={icon} alt="" />
          </div>
        ) : (
          <div style={{ height: 10 }} />
        )}

        <div className="modal-title">{title}</div>

        {body ? (
          <div className="modal-body-wrap" style={{ maxHeight: maxBodyHeight }}>
            {body}
          </div>
        ) : null}

        <div className="modal-footer">
          {footer ?? (
            <button className="modal-btn" onClick={onClose}>
              Гаразд
            </button>
          )}
        </div>
      </div>

      <style>{`
        .app-modal{
          position:fixed; inset:0; z-index:1000;
          background: rgba(0,0,0,.55);
          display:grid; place-items:center;
          backdrop-filter: blur(2px);
          padding: 18px 0;
        }
        .modal-card{
          position:relative;
          border-radius:18px;
          padding:22px 18px 16px;
          background: rgba(22,28,40,.96);
          border:1px solid rgba(255,255,255,.08);
          box-shadow: 0 12px 40px rgba(0,0,0,.45), inset 0 0 0 1px rgba(0,0,0,.2);
          text-align:center;
          color:#eaf8f7;
        }
        .modal-icon-wrap{
          width:78px; height:78px; margin:-58px auto 8px;
          border-radius:999px; background: radial-gradient(ellipse at center, rgba(10,240,220,.25), transparent 60%);
          display:grid; place-items:center;
        }
        .modal-icon{
          width:78px; height:78px; object-fit:contain; filter: drop-shadow(0 0 8px rgba(0,255,230,.25));
        }
        .modal-title{
          font-weight:900; letter-spacing:.3px; font-size:20px;
          color:#cfeeed; margin:6px 0 10px;
        }

        .modal-body-wrap{
          overflow:auto;
          padding: 0 2px;
        }

        .modal-text{
          font-size:16px; line-height:1.35; color:#eaf8f7; opacity:.92;
          margin-bottom:14px;
          white-space: pre-wrap;
        }

        .modal-body{
          text-align:left;
          font-size:14px;
          line-height:1.35;
          opacity:.95;
          padding-bottom: 12px;
        }

        .modal-footer{
          margin-top: 10px;
        }

        .modal-btn{
          appearance:none; border:0; cursor:pointer;
          padding:12px 16px; border-radius:12px; font-weight:900;
          background: linear-gradient(180deg, #53ffa6 0%, #15d3c0 100%);
          color:#041d17; width:100%;
        }
      `}</style>
    </div>
  );
}
