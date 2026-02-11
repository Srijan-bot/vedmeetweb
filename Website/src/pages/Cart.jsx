import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const Cart = () => {
    return (
        <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-3xl font-serif font-bold text-sage-900 mb-4">Your Cart</h1>
            <p className="text-stone-600 mb-8">Your cart is currently empty.</p>
            <Link to="/shop">
                <Button size="lg">Continue Shopping</Button>
            </Link>
        </div>
    );
};

export default Cart;
