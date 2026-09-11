import { ToastMessage } from "../hooks/useJobAssessmentPolling";
import "./ToastContainer.css";

interface ToastContainerProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    onClick={() => onDismiss(toast.id)}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

export default ToastContainer;
