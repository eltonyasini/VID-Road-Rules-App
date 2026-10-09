import { useEffect, useRef } from "react";

type ExitQuizDialogProps = {
  answeredCount: number;
  total: number;
  onStay: () => void;
  onExit: () => void;
};

export default function ExitQuizDialog({ answeredCount, total, onStay, onExit }: ExitQuizDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stayButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    stayButton.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog ref={dialog} className="exit-dialog" aria-labelledby="exit-title" aria-describedby="exit-description"
      onCancel={(event) => { event.preventDefault(); onStay(); }}>
      <div className="exit-dialog-content">
        <div className="exit-dialog-top">
          <span className="exit-dialog-label">YOUR PRACTICE SESSION</span>
          <button className="exit-dialog-close" type="button" aria-label="Keep practising" onClick={onStay}>×</button>
        </div>
        <div className="exit-dialog-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
            <path d="M14 6H7v20h7M13 16h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 id="exit-title">Leave this quiz?</h2>
        <p id="exit-description">Going back to the menu will clear this quiz’s progress. You can start a fresh quiz whenever you’re ready.</p>
        <div className="exit-dialog-progress">
          <div><strong>{answeredCount} of {total}</strong><span> questions answered</span></div>
          <div className="exit-dialog-track" aria-hidden="true"><div style={{ width: `${total ? answeredCount / total * 100 : 0}%` }} /></div>
        </div>
        <div className="exit-dialog-actions">
          <button ref={stayButton} className="exit-dialog-stay" type="button" onClick={onStay}>Keep practising <span aria-hidden="true">→</span></button>
          <button className="exit-dialog-leave" type="button" onClick={onExit}>Exit quiz</button>
        </div>
      </div>
    </dialog>
  );
}
