import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

const PageLoader = () => {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        fetch('/Background.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('Error loading animation:', err));
    }, []);

    if (!animationData) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm">
            <div className="w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
                <Lottie
                    animationData={animationData}
                    loop={true}
                    className="w-full h-full"
                />
            </div>
        </div>
    );
};

export default PageLoader;
