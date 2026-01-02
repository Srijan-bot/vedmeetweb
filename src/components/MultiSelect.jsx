import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

const MultiSelect = ({ options, value = [], onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionId) => {
        const newValue = value.includes(optionId)
            ? value.filter(id => id !== optionId)
            : [...value, optionId];
        onChange(newValue);
    };

    const removeOption = (e, optionId) => {
        e.stopPropagation();
        onChange(value.filter(id => id !== optionId));
    };

    const selectedOptions = options.filter(opt => value.includes(opt.id));

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-sage-200 rounded-md bg-white cursor-pointer min-h-[42px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-sage-500"
            >
                {selectedOptions.length === 0 && (
                    <span className="text-stone-400 text-sm">{placeholder}</span>
                )}

                {selectedOptions.map(opt => (
                    <span key={opt.id} className="bg-sage-100 text-sage-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        {opt.name}
                        <button
                            onClick={(e) => removeOption(e, opt.id)}
                            className="hover:text-sage-900 rounded-full p-0.5"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}

                <div className="ml-auto pointer-events-none text-stone-400">
                    <ChevronDown size={16} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-sage-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.length > 0 ? (
                        options.map(opt => (
                            <div
                                key={opt.id}
                                onClick={() => toggleOption(opt.id)}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-sage-50 flex items-center justify-between"
                            >
                                <span className={value.includes(opt.id) ? 'font-medium text-sage-900' : 'text-stone-600'}>
                                    {opt.name}
                                </span>
                                {value.includes(opt.id) && <Check size={16} className="text-sage-600" />}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-stone-400 italic">No options available</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
