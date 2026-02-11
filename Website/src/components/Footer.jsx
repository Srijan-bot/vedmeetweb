import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Button from './Button';

import logoFull from '../assets/logo-full.svg';

const Footer = () => {
    return (
        <footer className="bg-sage-900 text-sage-50 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="space-y-6">
                        <div>
                            <img src={logoFull} alt="Vedmeet" className="h-48 w-auto brightness-0 invert" />
                            <p className="text-sage-300 text-sm leading-relaxed mt-2">
                                Pure Ayurveda, Delivered. 100% genuine products sourced directly from organic farms.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-sage-200">
                                <div className="h-8 w-8 rounded-full bg-sage-800 flex items-center justify-center border border-sage-600">
                                    <span className="text-xs font-bold">100%</span>
                                </div>
                                <span className="text-sm">Authentic & Pure</span>
                            </div>
                            <div className="flex items-center gap-3 text-sage-200">
                                <div className="h-8 w-8 rounded-full bg-sage-800 flex items-center justify-center border border-sage-600">
                                    <span className="text-xs font-bold">GMP</span>
                                </div>
                                <span className="text-sm">Certified Manufacturing</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-serif font-semibold text-lg mb-4">Shop</h4>
                        <ul className="space-y-2 text-sm text-sage-300">
                            <li><Link to="/shop?category=immunity" className="hover:text-white transition-colors">Immunity</Link></li>
                            <li><Link to="/shop?category=wellness" className="hover:text-white transition-colors">General Wellness</Link></li>
                            <li><Link to="/shop?category=skincare" className="hover:text-white transition-colors">Skincare</Link></li>
                            <li><Link to="/shop?category=haircare" className="hover:text-white transition-colors">Haircare</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-serif font-semibold text-lg mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-sage-300">
                            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                            <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-serif font-semibold text-lg mb-4">Stay Connected</h4>
                        <p className="text-sage-300 text-sm mb-4">Subscribe for wellness tips and exclusive offers.</p>
                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="flex-1 bg-sage-800 border-none rounded-md px-3 py-2 text-sm text-white placeholder:text-sage-500 focus:ring-1 focus:ring-sage-400"
                            />
                            <Button size="sm" variant="secondary">Join</Button>
                        </form>
                        <div className="flex gap-4 mt-6">
                            <a href="#" className="text-sage-300 hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
                            <a href="#" className="text-sage-300 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
                            <a href="#" className="text-sage-300 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-sage-800 pt-8 text-center text-xs text-sage-400">
                    <p>&copy; {new Date().getFullYear()} Vedmeet Ayurveda. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
