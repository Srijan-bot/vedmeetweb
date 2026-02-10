import { supabase } from './supabase';

export const placeOrder = async (orderData) => {
    try {
        const { data, error } = await supabase.rpc('place_order', {
            p_first_name: orderData.firstName,
            p_last_name: orderData.lastName,
            p_email: orderData.email,
            p_phone: orderData.phone,
            p_address: orderData.address,
            p_shipping_address: {
                address: orderData.address,
                city: orderData.city,
                zip: orderData.zip
            },
            p_total_amount: orderData.totalAmount,
            p_payment_method: orderData.paymentMethod,
            p_coordinates: orderData.coordinates, // Pass coordinates
            p_shipping_amount: orderData.shippingCost || 0, // Pass shipping amount
            p_tax_amount: orderData.taxAmount || 0, // Pass tax amount
            p_items: orderData.items.map(item => ({
                product_id: item.id,
                variant_id: item.variantId || null,
                quantity: item.quantity,
                price: item.price
            }))
        });

        if (error) throw error;
        return data; // Returns the new order ID
    } catch (error) {
        console.error('Error placing order:', error);
        // Throw the detailed message if available, otherwise the error object
        throw error.message || error.details || error;
    }
};
