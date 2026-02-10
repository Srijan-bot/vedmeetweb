import { createClient } from '@supabase/supabase-js';

// Credentials from verify_backend.js
const SUPABASE_URL = 'https://fnpxnpukhqbwhrowmean.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucHhucHVraHFid2hyb3dtZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODc2MTMsImV4cCI6MjA4MDM2MzYxM30.EfE7ssBSZZmWrWLp6zFqCbsVYdQJGmC6ldI5A6njaW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY.trim(), {
    auth: { persistSession: false }
});

async function runDebug() {
    console.log("🔍 Debugging Order Data...");

    // 0. Login (using hardcoded fallback for debug)
    console.log("🔐 Authenticating...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@vedmeet.com',
        password: 'password123'
    });

    if (authError) {
        console.error("⚠️ Login Failed (Anon Mode):", authError.message);
    } else {
        console.log(`✅ Logged in as: ${authData.user.email}`);
    }

    // 1. Fetch Latest Order Items
    console.log("🔍 Fetching LATEST Order Items...");

    // Get latest order ID
    const { data: latestOrder } = await supabase
        .from('orders')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!latestOrder) {
        console.error("❌ No orders found.");
        return;
    }

    console.log(`✅ Latest Order ID: ${latestOrder.id} (Created: ${latestOrder.created_at})`);
    const ORDER_ID = latestOrder.id;

    const { data: items, error } = await supabase
        .from('order_items')
        .select(`
            id,
            product_id,
            variant_id,
            quantity,
            price,
            product:products(name),
            variant:product_variants(id, name, sku)
        `)
        .eq('order_id', ORDER_ID);

    if (error) {
        console.error("❌ Error fetching items:", error);
    } else {
        console.log(`✅ Items Found: ${items.length}`);
        console.log(JSON.stringify(items, null, 2));

        // Check if any variant is null despite having variant_id
        items.forEach(item => {
            if (item.variant_id && !item.variant) {
                console.error(`⚠️ Item ${item.id} has variant_id ${item.variant_id} but join returned NULL. Check RLS or Foreign Key.`);
            } else if (!item.variant_id) {
                console.error(`⚠️ Item ${item.id} has NULL variant_id. Checkout process might be failing to save it.`);
            }
        });
    }
}

runDebug();
