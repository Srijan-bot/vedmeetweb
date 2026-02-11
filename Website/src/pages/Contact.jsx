import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Button from '../components/Button';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Form submitted:', formData);
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="bg-sage-900 text-white py-20 text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Get in Touch</h1>
                <p className="text-sage-200 text-lg max-w-2xl mx-auto px-4">
                    Have a question about our products or need personalized advice? We're here to help.
                </p>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-serif font-bold text-sage-900 mb-6">Contact Information</h2>
                            <p className="text-stone-600 mb-8">
                                Reach out to us through any of these channels. Our support team is available Monday through Friday, 9am to 6pm EST.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-sage-100 p-3 rounded-full text-sage-700">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sage-900">Visit Us</h3>
                                    <p className="text-stone-600">123 Wellness Way<br />New York, NY 10012</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-sage-100 p-3 rounded-full text-sage-700">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sage-900">Email Us</h3>
                                    <p className="text-stone-600">hello@vedalife.com</p>
                                    <p className="text-stone-600">support@vedalife.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-sage-100 p-3 rounded-full text-sage-700">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sage-900">Call Us</h3>
                                    <p className="text-stone-600">+1 (555) 123-4567</p>
                                </div>
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="h-64 bg-sage-50 rounded-xl border border-sage-100 flex items-center justify-center text-sage-400">
                            <span className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Map Integration
                            </span>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-sage-100">
                        <h2 className="text-2xl font-serif font-bold text-sage-900 mb-6">Send us a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="5"
                                    className="w-full px-4 py-2 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                    required
                                />
                            </div>
                            <Button type="submit" size="lg" className="w-full flex items-center justify-center gap-2">
                                <Send className="h-4 w-4" /> Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
