import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

const positions = {
    top: '-translate-x-1/2 left-1/2 bottom-full mb-2',
    bottom: '-translate-x-1/2 left-1/2 top-full mt-2',
    left: '-translate-y-1/2 top-1/2 right-full mr-2',
    right: '-translate-y-1/2 top-1/2 left-full ml-2',
};

/**
 * Lightweight tooltip wrapping any trigger element.
 *
 * @param {{
 *   content: string|ReactNode,
 *   position?: 'top'|'bottom'|'left'|'right',
 *   delay?: number,
 *   children: ReactNode,
 * }} props
 */
export default function Tooltip({ content, position = 'top', delay = 400, children, className }) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null);

    const show = () => {
        timerRef.current = setTimeout(() => setVisible(true), delay);
    };
    const hide = () => {
        clearTimeout(timerRef.current);
        setVisible(false);
    };

    useEffect(() => () => clearTimeout(timerRef.current), []);

    return (
        <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
            {children}
            {visible && content && (
                <div
                    className={cn(
                        'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white',
                        'bg-surface-700 border border-edge/10 rounded-lg shadow-panel whitespace-nowrap',
                        'pointer-events-none animate-slide-in',
                        positions[position],
                        className
                    )}
                >
                    {content}
                </div>
            )}
        </div>
    );
}
