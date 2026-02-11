import { supabase } from './supabase';
export { supabase };



// Remove hardcoded categories array as we will fetch from DB now.
// Kept temporarily for fallback or seeding if needed, but better to rely on DB.
export const categoriesList = [
    { id: 'single-herbs', name: 'Single Herbs', image: 'https://images.unsplash.com/photo-1615485925694-a031e464a2c4?auto=format&fit=crop&q=80&w=800' },
    { id: 'wellness-kits', name: 'Wellness Kits', image: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=800' },
    { id: 'skincare', name: 'Skincare', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800' },
    { id: 'haircare', name: 'Haircare', image: 'https://images.unsplash.com/photo-1526947425960-94d046f4377c?auto=format&fit=crop&q=80&w=800' },
    { id: 'immunity', name: 'Immunity', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800' },
];

export const brandsList = [
    { id: '1', name: 'Organic India', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Organic_India_logo.svg/1200px-Organic_India_logo.svg.png', description: 'Organic India is a multi-national company based in Lucknow, India...', origin_country: 'India' }
];

// --- BRANDS ---

export const getBrands = async () => {
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (error) {
        console.error("Error fetching brands:", error);
        return brandsList;
    }
    return data && data.length > 0 ? data : brandsList;
};

export const getBrandByName = async (name) => {
    const { data, error } = await supabase.from('brands').select('*').eq('name', name).single();
    if (error) {
        // console.error("Error fetching brand by name:", error); // Suppress error for not found, just return null
        return null;
    }
    return data;
};

export const addBrand = async (brand) => {
    const { data, error } = await supabase.from('brands').insert([brand]).select();
    if (error) throw error;
    return data;
};

export const deleteBrand = async (id) => {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;
};

// --- CATEGORIES ---

export const getCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
        console.error("Error fetching categories:", error);
        // Fallback to hardcoded if table is empty or error (during migration)
        return categoriesList;
    }
    return data && data.length > 0 ? data : categoriesList;
};

export const addCategory = async (category) => {
    const { data, error } = await supabase.from('categories').insert([category]).select();
    if (error) throw error;
    return data;
};

export const deleteCategory = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
};

// --- CONCERNS ---

export const getConcerns = async () => {
    const { data, error } = await supabase.from('concerns').select('*').order('name');
    if (error) { console.error("Error fetching concerns:", error); return []; }
    return data;
};

export const addConcern = async (concern) => {
    const { data, error } = await supabase.from('concerns').insert([concern]).select();
    if (error) throw error;
    return data;
};

export const deleteConcern = async (id) => {
    const { error } = await supabase.from('concerns').delete().eq('id', id);
    if (error) throw error;
};

// --- PRODUCTS ---

export const getProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)');
    if (error) { console.error("Error fetching products:", error); return []; }
    return data;
};

const trendingFallback = [
    { id: '141', name: 'Ashwagandha Root Powder', image: 'https://images.unsplash.com/photo-1615485925694-a031e464a2c4?auto=format&fit=crop&q=80&w=800', category: ['Single Herbs'], brand: 'VedPure', price: 599, disc_price: 399, rating: 4.8 },
    { id: '147', name: 'Intensive Bhringraj Hair Oil', image: 'https://images.unsplash.com/photo-1526947425960-94d046f4377c?auto=format&fit=crop&q=80&w=800', category: ['Haircare'], brand: 'KeshKing', price: 299, disc_price: 249, rating: 4.7 },
    { id: '142', name: 'Triphala Churna', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800', category: ['Single Herbs'], brand: 'VedPure', price: 199, disc_price: 180, rating: 4.6 }
];

export const getTrendingProducts = async (limit = 5) => {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, image, category, brand, price, disc_price, rating')
        .order('reviews', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching trending:", error);
        return trendingFallback;
    }
    return data && data.length > 0 ? data : trendingFallback;
};

export const searchProducts = async (query) => {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
        .from('products')
        .select('id, name, image, category, brand, price, disc_price')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,meta_keywords.ilike.%${query}%`)
        .limit(10);

    if (error) { console.error("Error searching products:", error); return []; }
    return data;
};

export const getProduct = async (id) => {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) { console.error("Error fetching product:", error); return null; }
    return data;
};

export const addProduct = async (productData) => {
    const { data, error } = await supabase.from('products').insert([{
        ...productData,
        price: parseFloat(productData.price),
        stock_quantity: parseInt(productData.stock_quantity || 0),
        rating: 0,
        reviews: 0,
    }]).select();
    if (error) throw error;
    return data;
};

export const updateProduct = async (id, productData) => {
    const { error } = await supabase.from('products').update({
        ...productData,
        price: parseFloat(productData.price),
        stock_quantity: parseInt(productData.stock_quantity || 0),
    }).eq('id', id);
    if (error) throw error;
};

export const deleteProduct = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
};

export const syncAllProductOffers = async () => {
    // 1. Fetch all products and their variants
    const { data: products, error } = await supabase
        .from('products')
        .select('id, price, product_variants(id, price, discount_percentage, disc_price)');

    if (error) {
        console.error("Error fetching for sync:", error);
        return { success: false, error };
    }

    let updatedCount = 0;

    // 2. Iterate and Update
    for (const p of products) {
        if (!p.product_variants || p.product_variants.length === 0) continue;

        // Find max discount among variants
        const maxDiscountVariant = p.product_variants.reduce((prev, current) => {
            return (prev.discount_percentage || 0) > (current.discount_percentage || 0) ? prev : current;
        }, { discount_percentage: 0 });

        const newDiscount = maxDiscountVariant.discount_percentage || 0;

        // Calculate expected disc_price for product based on ITS OWN price
        const price = parseFloat(p.price || 0);
        let newDiscPrice = null;

        if (newDiscount > 0) {
            newDiscPrice = price - (price * (newDiscount / 100));
            newDiscPrice = Math.max(0, Math.round(newDiscPrice * 100) / 100);
        }

        // Update if different
        // We assume product needs update if current discount doesn't match calculated
        // Or just force update to be safe
        await supabase.from('products').update({
            discount_percentage: newDiscount,
            disc_price: newDiscPrice
        }).eq('id', p.id);

        updatedCount++;
    }

    return { success: true, count: updatedCount };
};

// --- BUNDLES / COMBOS ---

export const getBundles = async () => {
    const { data, error } = await supabase.from('bundles').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error fetching bundles:", error);
        return [];
    }
    return data;
};

export const createBundle = async (bundleData) => {
    // bundleData matches the schema: name, description, price, original_price, components, image (optional)
    const { data, error } = await supabase.from('bundles').insert([bundleData]).select();
    if (error) throw error;
    return data;
};

export const deleteBundle = async (id) => {
    const { error } = await supabase.from('bundles').delete().eq('id', id);
    if (error) throw error;
};

export const applyOffer = async (productIds, percentage) => {
    // 1. Fetch current products to calculate new prices (Supabase doesn't support convenient math updates in one go easily without stored procs for this specific math on multiple rows with different base prices, so fetching is safer/easier for this scale)
    const { data: products } = await supabase.from('products').select('id, price').in('id', productIds);

    if (!products) return;

    const updates = products.map(p => ({
        id: p.id,
        discount_percentage: percentage,
        disc_price: p.price - (p.price * (percentage / 100))
    }));

    // Perform upsert (update) for each. 
    // Ideally we'd use a single upsert if supported for bulk updates with different values, but loop is fine for small batches.
    for (const update of updates) {
        await supabase.from('products').update({
            discount_percentage: update.discount_percentage,
            disc_price: update.disc_price
        }).eq('id', update.id);
    }
};

export const removeOffer = async (productIds) => {
    // Also remove from variants if any
    // Logic: if product offer removed, removed from all its variants? Or just product level?
    // Current requirement seems to be focused on variants, but let's keep product level for backward compat or mixed usage.
    await supabase.from('products').update({
        discount_percentage: 0,
        disc_price: null
    }).in('id', productIds);
};

export const applyVariantOffer = async (variantIds, percentage) => {
    const { data: variants } = await supabase.from('product_variants').select('id, price, product_id').in('id', variantIds);

    if (!variants) return;

    // 1. Update Variants
    for (const v of variants) {
        const price = parseFloat(v.price || 0);
        let disc_price = price - (price * (percentage / 100));

        // Ensure disc_price is valid and rounded
        disc_price = Math.max(0, Math.round(disc_price * 100) / 100);

        const { error } = await supabase.from('product_variants').update({
            discount_percentage: percentage,
            disc_price: disc_price
        }).eq('id', v.id);

        if (error) {
            console.error(`Error updating variant ${v.id}:`, error);
        }
    }

    // 2. Sync to Parent Products 
    // (Take the maximum discount if multiple variants have offers, or just the last applied for simplicity in this context)
    const productIds = [...new Set(variants.map(v => v.product_id))];

    for (const pid of productIds) {
        // Fetch product price to calculate disc_price
        const { data: product } = await supabase.from('products').select('price').eq('id', pid).single();
        if (product) {
            const price = parseFloat(product.price || 0);
            let disc_price = price - (price * (percentage / 100));
            disc_price = Math.max(0, Math.round(disc_price * 100) / 100);

            await supabase.from('products').update({
                discount_percentage: percentage,
                disc_price: disc_price
            }).eq('id', pid);
        }
    }
};

export const removeVariantOffer = async (variantIds) => {
    // 1. Get products impacted
    const { data: variants } = await supabase.from('product_variants').select('product_id').in('id', variantIds);

    await supabase.from('product_variants').update({
        discount_percentage: 0,
        disc_price: null
    }).in('id', variantIds);

    // 2. Clear parent product offer if it matches (Simplification: clearing parent offer if any variant offer is removed might be aggressive, 
    // but ensures "Active Offers" view is consistent. Better logic: check if ANY other variant still has offer. 
    // For now, let's assume if you remove offers from variants, you want to clear the product badge too)
    if (variants) {
        const productIds = [...new Set(variants.map(v => v.product_id))];
        await supabase.from('products').update({
            discount_percentage: 0,
            disc_price: null
        }).in('id', productIds);
    }
};

// Dangerous: Deletes ALL products and related data
export const deleteAllProducts = async () => {
    // 1. Inventory & Stock (Delete dependents first)
    const tablesToDelete = [
        'inventory_transactions', // History
        'inventory_ledger',       // History
        'warehouse_batch_stock',  // Stock
        'warehouse_stock',        // Stock
        'product_batches',        // Batches
        'product_reviews',        // Reviews
        'order_items',            // Order Items (Orders remain but empty)
        'prescription_items',     // Prescriptons remain but empty
        'product_variants'        // Variants
    ];

    for (const table of tablesToDelete) {
        // Using neq id 000... generally works for UUID, for others we need a valid condition.
        // For efficiency, we can just delete everything where id is not null if allowed.
        // But to be safe and consistent with "all", we use a broad filter.
        let query = supabase.from(table).delete();

        // Supabase JS requires a filter for delete.
        if (table === 'order_items' || table === 'product_variants' || table === 'inventory_transactions' || table === 'inventory_ledger' || table === 'warehouse_batch_stock' || table === 'warehouse_stock' || table === 'product_batches' || table === 'product_reviews' || table === 'prescription_items') {
            // These likely have UUID ids. 
            query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        } else {
            // Fallback
            query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { error } = await query;
        if (error) console.error(`Error deleting from ${table}:`, error);
    }

    // 2. Products (Integer ID)
    const { error: prodError } = await supabase.from('products').delete().gt('id', 0);
    if (prodError) throw prodError;
};

// --- DOCTORS ---

export const getDoctors = async () => {
    const { data, error } = await supabase.from('doctors').select('*');
    if (error) { console.error("Error fetching doctors:", error); return []; }
    return data;
};

export const getDoctor = async (id) => {
    const { data, error } = await supabase.from('doctors').select('*').eq('id', id).single();
    if (error) { console.error("Error fetching doctor:", error); return null; }
    return data;
};

export const addDoctor = async (doctorData) => {
    const { data, error } = await supabase.from('doctors').insert([{
        ...doctorData,
        price: parseFloat(doctorData.price),
        rating: 5.0,
    }]).select();
    if (error) throw error;
    return data;
};

export const updateDoctor = async (id, doctorData) => {
    const { error } = await supabase.from('doctors').update({
        ...doctorData,
        price: parseFloat(doctorData.price),
    }).eq('id', id);
    if (error) throw error;
};

export const deleteDoctor = async (id) => {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw error;
};

// --- BLOGS ---

export const getBlogs = async () => {
    const { data, error } = await supabase.from('blogs').select('*').order('date', { ascending: false });
    if (error) { console.error("Error fetching blogs:", error); return []; }
    return data;
};

export const getBlog = async (slug) => { // Fetch by ID or Slug? Usually generic get is by ID, but frontend uses slug.
    const { data, error } = await supabase.from('blogs').select('*').eq('slug', slug).single();
    // If not found by slug, maybe try ID if needed, but for now slug.
    if (error) { console.error("Error fetching blog:", error); return null; }
    return data;
};

export const addBlog = async (blogData) => {
    const { data, error } = await supabase.from('blogs').insert([blogData]).select();
    if (error) throw error;
    return data;
};

export const updateBlog = async (id, blogData) => {
    const { error } = await supabase.from('blogs').update(blogData).eq('id', id);
    if (error) throw error;
};

export const deleteBlog = async (id) => {
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) throw error;
};

// --- SETTINGS ---

export const getSiteSettings = async () => {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error) { console.error("Error fetching settings:", error); return {}; }
    // Convert array to object { key: value }
    const settings = {};
    data.forEach(item => {
        settings[item.key] = item.value;
    });
    return settings;
};

export const updateSiteSetting = async (key, value) => {
    const { error } = await supabase.from('site_settings').upsert({ key, value });
    if (error) throw error;
};

// --- LEADS ---

export const getLeads = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) { console.error("Error fetching leads:", error); return []; }
    return data;
};

export const addLead = async (leadData) => {
    const { data, error } = await supabase.from('leads').insert([leadData]).select();
    if (error) throw error;
    return data;
};

export const updateLeadStatus = async (id, status) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) throw error;
};

// --- USERS / PROFILES ---

export const getProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('role');
    if (error) { console.error("Error fetching profiles:", error); return []; }
    return data;
};

export const updateProfile = async (id, updates) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
};

export const deleteProfile = async (id) => {
    // Uses the custom RPC function to delete from auth.users
    const { error } = await supabase.rpc('delete_user', { target_user_id: id });
    if (error) throw error;
};

// --- CHAT SYSTEM ---

export const getMessages = async (limit = 50) => {
    // 1. Fetch messages plain
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) { console.error("Error fetching messages:", error); return []; }
    if (!messages || messages.length === 0) return [];

    // 2. Fetch profiles for these senders
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, role')
        .in('id', senderIds);

    // 3. Merge
    const profileMap = {};
    profiles?.forEach(p => profileMap[p.id] = p);

    const enrichedMessages = messages.map(msg => ({
        ...msg,
        sender: profileMap[msg.sender_id] || { email: 'unknown' }
    }));

    return enrichedMessages.reverse(); // Return oldest to newest for chat UI
};

export const sendMessage = async ({ content, context_type, context_id, context_data, tagged_users }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.from('messages').insert([{
        sender_id: user.id,
        content,
        context_type,
        context_id,
        context_data,
        tagged_users
    }]).select();

    if (error) throw error;

    // Create notifications for tagged users
    if (tagged_users && tagged_users.length > 0) {
        const notifications = tagged_users.map(taggedUserId => ({
            user_id: taggedUserId,
            type: 'tag',
            content: `${user.email?.split('@')[0] || 'Someone'} tagged you in a message`,
            link: '/admin/chat', // Or specific link if we have message ID
            data: { message_id: data[0].id, sender_id: user.id }
        }));

        await Promise.all(notifications.map(n => addNotification(n)));
    }

    return data?.[0];
};

// --- NOTIFICATIONS ---

export const getNotifications = async (limit = 20) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) { console.error("Error fetching notifications:", error); return []; }
    return data;
};

export const addNotification = async (notification) => {
    const { error } = await supabase.from('notifications').insert([notification]);
    if (error) console.error("Error creating notification:", error);
};

export const markNotificationAsRead = async (id) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
};

export const markAllNotificationsAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

    if (error) throw error;
};

// --- STORAGE ---

export const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
};

// --- INVENTORY MANAGEMENT ---

// Warehouses
export const getWarehouses = async () => {
    const { data, error } = await supabase.from('warehouses').select('*').eq('is_active', true).order('created_at');
    if (error) { console.error("Error fetching warehouses:", error); return []; }
    return data;
};

export const addWarehouse = async (warehouse) => {
    const { data, error } = await supabase.from('warehouses').insert([warehouse]).select();
    if (error) throw error;
    return data;
};

export const updateWarehouse = async (id, updates) => {
    const { error } = await supabase.from('warehouses').update(updates).eq('id', id);
    if (error) throw error;
};

export const deleteWarehouse = async (id) => {
    const { error } = await supabase.from('warehouses').delete().eq('id', id);
    if (error) throw error;
};

// Variants
export const getVariants = async (productId) => {
    const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('created_at');
    if (error) { console.error("Error fetching variants:", error); return []; }
    return data;
};

// Also fetch all variants for the main inventory table if needed, or we might paginate.
export const getAllVariants = async () => {
    // This might be heavy, so we should probably paginate or filter in real app.
    // For now, fetching all for the table view as requested "10,000+ products" implies we need server-side pagination eventually.
    // But for MVP/Development we start with simple select.
    const { data, error } = await supabase.from('product_variants').select(`
        *,
        products (id, name, image, category, brand, product_type, hsn_code, gst_rate)
    `).order('created_at');

    if (error) { console.error("Error fetching all variants:", error); return []; }
    return data;
};

export const addVariant = async (variant) => {
    const { data, error } = await supabase.from('product_variants').insert([{
        ...variant,
        price: parseFloat(variant.price || 0),
        cost_price: parseFloat(variant.cost_price || 0),
        mrp: parseFloat(variant.mrp || 0),
        gst_rate: parseFloat(variant.gst_rate || 0),
        min_stock_level: parseInt(variant.min_stock_level || 0),
        reorder_quantity: parseInt(variant.reorder_quantity || 0),
    }]).select();
    if (error) throw error;
    return data;
};

export const updateVariant = async (id, updates) => {
    const { error } = await supabase.from('product_variants').update({
        ...updates,
        price: updates.price ? parseFloat(updates.price) : undefined,
        cost_price: updates.cost_price ? parseFloat(updates.cost_price) : undefined,
        mrp: updates.mrp ? parseFloat(updates.mrp) : undefined,
        gst_rate: updates.gst_rate ? parseFloat(updates.gst_rate) : undefined,
        min_stock_level: updates.min_stock_level ? parseInt(updates.min_stock_level) : undefined,
        reorder_quantity: updates.reorder_quantity ? parseInt(updates.reorder_quantity) : undefined,
    }).eq('id', id);
    if (error) throw error;
};

export const deleteVariant = async (id) => {
    const { error } = await supabase.from('product_variants').delete().eq('id', id);
    if (error) throw error;
};

// Transactions
export const getInventoryTransactions = async (variantId = null, warehouseId = null, limit = 50) => {
    // Legacy support or migration view
    let query = supabase.from('inventory_transactions').select(`
        *,
        warehouses (name),
        product_variants (name, sku),
        performed_by (email) 
    `).order('created_at', { ascending: false }).limit(limit);

    if (variantId) query = query.eq('variant_id', variantId);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);

    const { data, error } = await query;
    if (error) { console.error("Error fetching transactions:", error); return []; }
    return data;
};

export const getInventoryLedger = async (variantId, warehouseId, limit = 100, startDate = null, endDate = null) => {
    let query = supabase.from('inventory_ledger').select(`
        *,
        warehouses (name),
        product_variants (name, sku, price, cost_price, gst_rate),
        product_batches (batch_number, expiry_date)
    `).order('transaction_date', { ascending: false }).limit(limit);

    if (variantId) query = query.eq('variant_id', variantId);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);
    if (startDate) query = query.gte('transaction_date', new Date(startDate).toISOString());
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('transaction_date', end.toISOString());
    }

    const { data, error } = await query;
    if (error) { console.error("Error fetching ledger:", error); return []; }
    return data;
};


// ...

export const inwardStock = async ({ variant_id, warehouse_id, batch_number, expiry_date, cost_price, quantity, reason, hsn_code, gst_rate }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 0. Update Product HSN/GST if provided
    if (hsn_code || gst_rate) {
        // Fetch product_id first
        const { data: variant } = await supabase.from('product_variants').select('product_id').eq('id', variant_id).single();
        if (variant && variant.product_id) {
            await supabase.from('products').update({
                ...(hsn_code && { hsn_code }),
                ...(gst_rate && { gst_rate: parseFloat(gst_rate) })
            }).eq('id', variant.product_id);
        }
    }

    // 1. Create or Get Batch
    // Upsert batch (if batch number exists for this variant)
    const { data: batchData, error: batchError } = await supabase.from('product_batches').upsert({
        variant_id,
        batch_number,
        expiry_date,
        cost_price: parseFloat(cost_price),
        initial_quantity: parseInt(quantity),
        current_quantity: parseInt(quantity) // Ensure init quantity is set
    }, { onConflict: 'variant_id, batch_number' })
        .select()
        .maybeSingle();

    if (batchError) throw batchError;
    if (!batchData) throw new Error("Failed to create/retrieve batch");

    const batchId = batchData.id;

    // 2. Add to Warehouse Batch Stock
    const { data: currentStock } = await supabase.from('warehouse_batch_stock')
        .select('quantity')
        .eq('warehouse_id', warehouse_id)
        .eq('variant_id', variant_id)
        .eq('batch_id', batchId)
        .maybeSingle();

    const newQty = (currentStock?.quantity || 0) + parseInt(quantity);

    const { error: stockError } = await supabase.from('warehouse_batch_stock').upsert({
        warehouse_id,
        variant_id,
        batch_id: batchId,
        quantity: newQty
    });

    if (stockError) throw stockError;

    // 3. Ledger Entry
    const { error: ledgerError } = await supabase.from('inventory_ledger').insert({
        transaction_date: new Date().toISOString(),
        warehouse_id,
        variant_id,
        batch_id: batchId,
        transaction_type: 'PURCHASE',
        quantity_change: parseInt(quantity),
        running_balance: newQty,
        unit_cost: parseFloat(cost_price),
        total_value: parseFloat(cost_price) * parseInt(quantity),
        reason: reason || 'Stock Inward',
        performed_by: user.id
    });

    if (ledgerError) throw ledgerError;

    // 4. Accounting Entry (Placeholder)
    await supabase.from('accounting_ledger').insert({
        transaction_date: new Date().toISOString(),
        ledger_type: 'PURCHASE',
        account_name: 'Inventory Asset',
        debit_amount: parseFloat(cost_price) * parseInt(quantity),
        credit_amount: 0,
        reference_id: batchId,
        reference_type: 'inward_batch',
        description: `Purchased ${quantity} units of batch ${batch_number}`
    });

    // 5. Main Inventory Transaction (Triggers Stock Update)
    // CRITICAL: This was missing, causing stock not to update in the main view.
    const { error: txError } = await supabase.from('inventory_transactions').insert({
        variant_id,
        warehouse_id,
        quantity_change: parseInt(quantity),
        transaction_type: 'purchase',
        reason: reason || `Inward Batch: ${batch_number}`,
        reference_id: batchId, // Link to the batch
        performed_by: user.id
    });

    if (txError) {
        console.error("Failed to create inventory transaction:", txError);
        // Note: We might want to rollback here in a real transaction, but Supabase JS client doesn't support complex transactions easily.
        // For now, we log it. The batch exists, but the "live stock" count might not update.
        throw txError;
    }
};

// --- ACCOUNTING & REPORTING ---

export const getInventoryStats = async () => {
    // 1. Total Asset Value: Sum of (Quantity * Cost Price) from batches (or warehouse_batch_stock joined with batches)
    // Detailed accurate way:
    const { data: batchStock, error: bsError } = await supabase.from('warehouse_batch_stock').select(`
        quantity,
        product_batches (cost_price)
    `);

    if (bsError) { console.error("Error fetching stats:", bsError); return { asset_value: 0 }; }

    const asset_value = batchStock.reduce((acc, item) => {
        return acc + (item.quantity * (item.product_batches?.cost_price || 0));
    }, 0);

    return { asset_value };
};

export const getCOGS = async (startDate, endDate) => {
    // Sum of SALE transactions in ledger * unit_cost
    let query = supabase.from('inventory_ledger')
        .select('quantity_change, unit_cost, total_value')
        .eq('transaction_type', 'SALE'); // assuming uppercase from trigger/logic

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);

    const { data, error } = await query;
    if (error) { console.error("Error fetching COGS:", error); return 0; }

    // quantity_change for SALE is negative, but cost is positive value. 
    // If ledger stores total_value as (qty * cost), for sales it might be negative or positive depending on implementation.
    // In our manual inward, we calculated total_value. For sale, we might not have set it in frontend yet? 
    // Actually our trigger on DB side or logical code should handle it.
    // Let's assume absolute value for COGS.
    const cogs = data.reduce((acc, item) => acc + Math.abs(item.total_value || (item.quantity_change * item.unit_cost)), 0);
    return cogs;
};

export const getExpiringBatches = async (daysThreshold = 90) => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + daysThreshold);

    const { data, error } = await supabase.from('product_batches')
        .select(`
            *,
            product_variants (name, sku)
        `)
        .gt('current_quantity', 0) // Only stock that exists
        .lte('expiry_date', future.toISOString())
        .gte('expiry_date', today.toISOString()) // Not already expired (optional, maybe we want expired too)
        .order('expiry_date');

    if (error) { console.error("Error fetching expiring batches:", error); return []; }
    return data;
};

export const adjustStock = async ({ variant_id, warehouse_id, quantity_change, reason, type, reference_id }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.from('inventory_transactions').insert([{
        variant_id,
        warehouse_id,
        quantity_change: parseInt(quantity_change),
        transaction_type: type || 'adjustment',
        reason,
        reference_id,
        performed_by: user.id
    }]).select();

    if (error) throw error;
    return data[0];
};

export const transferStock = async ({ variant_id, source_warehouse_id, target_warehouse_id, quantity, reason }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Transaction 1: Remove from Source
    const { error: errorOut } = await supabase.from('inventory_transactions').insert({
        variant_id,
        warehouse_id: source_warehouse_id,
        quantity_change: -parseInt(quantity),
        transaction_type: 'transfer_out',
        reason: `Transfer to ${target_warehouse_id} - ${reason}`,
        performed_by: user.id
    });
    if (errorOut) throw errorOut;

    // Transaction 2: Add to Target
    const { error: errorIn } = await supabase.from('inventory_transactions').insert({
        variant_id,
        warehouse_id: target_warehouse_id,
        quantity_change: parseInt(quantity),
        transaction_type: 'transfer_in',
        reason: `Transfer from ${source_warehouse_id} - ${reason}`,
        performed_by: user.id
    });
    if (errorIn) throw errorIn;
};

// --- BATCH MANAGEMENT ---

export const getBatches = async (variantId) => {
    const { data, error } = await supabase.from('product_batches')
        .select('*')
        .eq('variant_id', variantId)
        .eq('is_active', true)
        .order('expiry_date');
    if (error) { console.error("Error fetching batches:", error); return []; }
    return data;
};



export const getWarehouseStock = async (variantId) => {
    const { data, error } = await supabase.from('warehouse_stock')
        .select('*, warehouses(name)')
        .eq('variant_id', variantId);

    if (error) throw error; // or return []
    return data || [];
};

// --- APPOINTMENTS ---

export const getAppointments = async () => {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            doctors (name, specialty, image, price)
        `)
        .order('appointment_date', { ascending: false });

    if (error) { console.error("Error fetching appointments:", error); return []; }
    return data;
};

export const getUserAppointments = async (userId) => {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            doctors (name, specialty, image, price)
        `)
        .eq('user_id', userId)
        .order('appointment_date', { ascending: false });

    if (error) { console.error("Error fetching user appointments:", error); return []; }
    return data;
};

export const bookAppointment = async (appointmentData) => {
    const { data: { user } } = await supabase.auth.getUser();

    // If user is logged in, attach user_id
    const payload = {
        ...appointmentData,
        user_id: user?.id || null
    };

    const { data, error } = await supabase.from('appointments').insert([payload]).select();
    if (error) throw error;
    return data[0]; // Return the created appointment
};

export const updateAppointmentStatus = async (id, status) => {
    if (error) throw error;
};

// --- ORDER HISTORY ---

export const getUserOrders = async (userId) => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (
                *,
                product:products (name, image, price)
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) { console.error("Error fetching user orders:", error); return []; }
    return data;
};

// --- SITE SETTINGS ---

export const getSetting = async (key) => {
    const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
    if (error) {
        if (error.code !== 'PGRST116') console.error(`Error fetching setting ${key}:`, error);
        return null;
    }
    return data?.value ? JSON.parse(data.value) : null;
};

export const saveSetting = async (key, value) => {
    const { error } = await supabase.from('site_settings').upsert({
        key,
        value: JSON.stringify(value)
    });
    if (error) throw error;
};
