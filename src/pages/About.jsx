import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Heart, Users, Globe } from 'lucide-react';

const About = () => {
    const values = [
        {
            icon: <Leaf className="h-8 w-8 text-sage-600" />,
            title: "Authenticity",
            description: "We source our ingredients directly from traditional Ayurvedic farms in Kerala, ensuring 100% purity and potency."
        },
        {
            icon: <Heart className="h-8 w-8 text-sage-600" />,
            title: "Compassion",
            description: "Our products are cruelty-free and vegetarian. We believe in healing without harm to any living being."
        },
        {
            icon: <Globe className="h-8 w-8 text-sage-600" />,
            title: "Sustainability",
            description: "From eco-friendly packaging to ethical sourcing, we are committed to protecting our planet."
        },
        {
            icon: <Users className="h-8 w-8 text-sage-600" />,
            title: "Community",
            description: "We support local farmers and artisans, ensuring fair wages and preserving traditional knowledge."
        }
    ];

    return (
        <div className="pb-20">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=2000"
                        alt="Ayurvedic preparation"
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative z-10 container mx-auto px-4 text-center text-white">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-serif font-bold mb-6"
                    >
                        Our Journey
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl max-w-2xl mx-auto text-sage-100"
                    >
                        Bridging ancient wisdom with modern wellness.
                    </motion.p>
                </div>
            </section>

            {/* Story Section */}
            <section className="container mx-auto px-4 md:px-6 py-20">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-900">Rooted in Tradition</h2>
                    <p className="text-lg text-stone-600 leading-relaxed">
                        Vedmeet began with a simple mission: to make the profound healing wisdom of Ayurveda accessible to the modern world.
                        Born from a personal journey of healing, we realized that true wellness comes not from quick fixes, but from balance and harmony with nature.
                    </p>
                    <p className="text-lg text-stone-600 leading-relaxed">
                        We spent years traveling across India, meeting with Vaidyas (Ayurvedic physicians) and farmers, to find the purest ingredients and most authentic formulations.
                        Every product we offer is a testament to this journey—crafted with care, respect, and a deep understanding of the human body.
                    </p>
                </div>
            </section>

            {/* Values Section */}
            <section className="bg-sage-50 py-20">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-900 mb-4">Our Core Values</h2>
                        <p className="text-stone-600">The principles that guide everything we do.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
                                <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto">
                                    {value.icon}
                                </div>
                                <h3 className="text-xl font-serif font-bold text-sage-900">{value.title}</h3>
                                <p className="text-stone-600 text-sm leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founder Section */}
            <section className="container mx-auto px-4 md:px-6 py-20">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2">
                        <img
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"
                            alt="Founder"
                            className="rounded-2xl shadow-lg w-full max-w-md mx-auto"
                        />
                    </div>
                    <div className="md:w-1/2 space-y-6">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-900">Meet the Founder</h2>
                        <h3 className="text-xl font-medium text-earth-600">Dr. Ananya Sharma</h3>
                        <p className="text-stone-600 leading-relaxed">
                            "Ayurveda is not just a system of medicine; it is a way of life. My goal with Vedmeet is to empower you to take charge of your health using the simple, yet powerful tools that nature has provided us."
                        </p>
                        <p className="text-stone-600 leading-relaxed">
                            With over 15 years of clinical experience and a deep passion for herbal medicine, Dr. Sharma oversees every formulation to ensure it meets the highest standards of safety and efficacy.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
