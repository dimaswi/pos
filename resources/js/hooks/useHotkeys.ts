import { useEffect, useCallback } from 'react';

interface HotkeyConfig {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    callback: () => void;
    description: string;
    disabled?: boolean;
}

export const useHotkeys = (hotkeys: HotkeyConfig[]) => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ignore if user is typing in an input field
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
            return;
        }

        hotkeys.forEach(hotkey => {
            if (hotkey.disabled) return;

            const keyMatch = event.key.toLowerCase() === hotkey.key.toLowerCase();
            const ctrlMatch = !!hotkey.ctrlKey === event.ctrlKey;
            const altMatch = !!hotkey.altKey === event.altKey;
            const shiftMatch = !!hotkey.shiftKey === event.shiftKey;

            if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
                event.preventDefault();
                hotkey.callback();
            }
        });
    }, [hotkeys]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};

export const formatHotkey = (hotkey: HotkeyConfig): string => {
    const parts = [];
    if (hotkey.ctrlKey) parts.push('Ctrl');
    if (hotkey.altKey) parts.push('Alt');
    if (hotkey.shiftKey) parts.push('Shift');
    parts.push(hotkey.key.toUpperCase());
    return parts.join(' + ');
};
