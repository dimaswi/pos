import { ImgHTMLAttributes, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import Logo  from '../../../public/1.png';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    const { settings } = usePage<SharedData>().props;
    const [imageError, setImageError] = useState(false);
    
    // Use settings logo if available and no error, otherwise fallback to default
    const logoSrc = settings?.app_logo && !imageError && (settings.app_logo.startsWith('/storage/') || settings.app_logo.startsWith('http')) 
        ? settings.app_logo 
        : Logo;
    
    const handleImageError = () => {
        setImageError(true);
    };
    
    return (
        <img 
            {...props} 
            src={logoSrc} 
            alt="logo"
            onError={handleImageError}
        />
    );
}
