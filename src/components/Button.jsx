import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    const variants = {
        primary: 'bg-sage-600 text-white hover:bg-sage-700 shadow-md',
        secondary: 'bg-earth-200 text-earth-900 hover:bg-earth-300',
        outline: 'border-2 border-sage-600 text-sage-600 hover:bg-sage-50',
        ghost: 'hover:bg-sage-100 text-sage-700',
        link: 'text-sage-700 underline-offset-4 hover:underline',
    };

    const sizes = {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
    };

    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
});

Button.displayName = 'Button';

export default Button;
