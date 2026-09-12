import { useEffect, useRef, useState } from "react";
import "./HamburgerMenu.css";

export interface NavItem {
    label: string;
    active?: boolean;
    onSelect?: () => void;
}

interface HamburgerMenuProps {
    items: NavItem[];
}

function HamburgerMenu({ items }: HamburgerMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click or Escape so the menu doesn't linger after navigating away.
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = (item: NavItem) => {
        item.onSelect?.();
        setIsOpen(false);
    };

    return (
        <div className="hamburger-menu" ref={menuRef}>
            <button
                type="button"
                className="hamburger-button"
                aria-label="Toggle navigation menu"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(prev => !prev)}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {isOpen && (
                <nav className="hamburger-panel" aria-label="Site navigation">
                    <ul>
                        {items.map(item => (
                            <li key={item.label}>
                                <button
                                    type="button"
                                    className={item.active ? "nav-item nav-item-active" : "nav-item"}
                                    onClick={() => handleSelect(item)}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
}

export default HamburgerMenu;
