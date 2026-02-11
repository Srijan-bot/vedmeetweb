import React, { useEffect, useRef } from 'react';
import { Package, User } from 'lucide-react';

const MentionPopup = ({
    items,
    type, // 'product' or 'user'
    position, // { top, left }
    onSelect,
    onClose
}) => {
    const popupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!items.length) return null;

    return (
        <div
            ref={popupRef}
            className="absolute z-50 bg-white rounded-lg shadow-xl border border-sage-200 w-64 max-h-48 overflow-y-auto"
            style={{ bottom: position.bottom + 24, left: position.left }} // Render above cursor
        >
            <div className="p-2 border-b border-sage-100 bg-sage-50 text-xs font-bold text-sage-500 uppercase flex items-center gap-1">
                {type === 'product' ? <Package size={12} /> : <User size={12} />}
                Select {type}
            </div>
            {items.map((item, index) => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="w-full text-left p-2 hover:bg-sage-50 focus:bg-sage-50 focus:outline-none flex items-center gap-2 transition-colors"
                >
                    {item.image && (
                        <img src={item.image} alt="" className="w-6 h-6 rounded object-cover bg-stone-100" />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-sage-900 truncate">{item.name || item.email}</p>
                        {item.price && <p className="text-xs text-saffron-600 font-bold">₹{item.price}</p>}
                        {item.role && <p className="text-xs text-stone-500 capitalize">{item.role}</p>}
                    </div>
                </button>
            ))}
        </div>
    );
};

export default MentionPopup;
