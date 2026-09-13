import { useEffect, useRef } from "react";
import "./RowOptionsMenu.css";

interface RowOptionsMenuProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onUpdateApplicationStatus: () => void;
}

function RowOptionsMenu({ isOpen, onToggle, onClose, onUpdateApplicationStatus }: RowOptionsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click so only one row's menu is ever open at a time.
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [isOpen, onClose]);

    return (
        <div className="row-options-menu" ref={menuRef}>
            <button
                type="button"
                className="row-options-button"
                aria-label="Row options"
                aria-expanded={isOpen}
                onClick={e => {
                    e.stopPropagation();
                    onToggle();
                }}
            >
                <svg viewBox="0 0 24 24" className="row-options-icon" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.75" fill="currentColor" stroke="none" />
                    <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none" />
                    <circle cx="12" cy="19" r="1.75" fill="currentColor" stroke="none" />
                </svg>
            </button>

            {isOpen && (
                <div className="row-options-panel" onClick={e => e.stopPropagation()}>
                    <button
                        type="button"
                        className="row-options-item"
                        onClick={() => {
                            onUpdateApplicationStatus();
                            onClose();
                        }}
                    >
                        Update Application Status
                    </button>
                </div>
            )}
        </div>
    );
}

export default RowOptionsMenu;
