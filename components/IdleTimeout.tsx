"use client";

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

interface IdleTimeoutProps {
    timeoutMinutes?: number;
}

export default function IdleTimeout({ timeoutMinutes = 30 }: IdleTimeoutProps) {
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleActivity = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log("Session expired due to inactivity. Signing out...");
                signOut({ callbackUrl: '/login?expired=true' });
            }, timeoutMinutes * 60 * 1000);
        };

        // Initialize the first timeout
        handleActivity();

        // Listen for user activity
        const events = [
            'mousemove', 'mousedown', 'keydown', 
            'DOMMouseScroll', 'mousewheel', 
            'touchmove', 'MSPointerMove'
        ];
        
        events.forEach(event => document.addEventListener(event, handleActivity));

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => document.removeEventListener(event, handleActivity));
        };
    }, [timeoutMinutes]);

    return null; // This component doesn't render anything
}
