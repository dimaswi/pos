import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Zap } from 'lucide-react';
import { formatHotkey } from '@/hooks/useHotkeys';

interface HotkeyConfig {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    callback: () => void;
    description: string;
    disabled?: boolean;
    category?: string;
}

interface HotkeyHelpProps {
    hotkeys: HotkeyConfig[];
    isVisible: boolean;
    onClose: () => void;
}

export default function HotkeyHelp({ hotkeys, isVisible, onClose }: HotkeyHelpProps) {
    if (!isVisible) return null;

    // Group hotkeys by category
    const groupedHotkeys = hotkeys.reduce((acc, hotkey) => {
        const category = hotkey.category || 'General';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(hotkey);
        return acc;
    }, {} as Record<string, HotkeyConfig[]>);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {Object.entries(groupedHotkeys).map(([category, categoryHotkeys]) => (
                        <div key={category} className="mb-6 last:mb-0">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                {category}
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {categoryHotkeys.map((hotkey, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100">
                                        <span className="text-sm text-gray-700">{hotkey.description}</span>
                                        <Badge variant="outline" className="font-mono">
                                            {formatHotkey(hotkey)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            Press <Badge variant="outline" className="font-mono mx-1">F1</Badge> to toggle this help or click outside to close
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
