import AppLogoIcon from './app-logo-icon';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export default function AppLogo() {
    const { settings } = usePage<SharedData>().props;
    
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 text-l truncate leading-tight font-semibold">{settings.app_name}</span>
            </div>
        </>
    );
}
