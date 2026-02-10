import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnpxnpukhqbwhrowmean.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucHhucHVraHFid2hyb3dtZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODc2MTMsImV4cCI6MjA4MDM2MzYxM30.EfE7ssBSZZmWrWLp6zFqCbsVYdQJGmC6ldI5A6njaW8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getTrendingProducts = async (limit = 5) => {
    console.log("Fetching trending products...");
    const { data, error } = await supabase
        .from('products')
        .select('id, name, reviews')
        .order('reviews', { ascending: false })
        .limit(limit);
    if (error) { console.error("Error fetching trending:", error); return []; }
    return data;
};

const searchProducts = async (query) => {
    console.log(`Searching for "${query}"...`);
    const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, meta_keywords')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,meta_keywords.ilike.%${query}%`)
        .limit(10);

    if (error) { console.error("Error searching products:", error); return []; }
    return data;
};

const run = async () => {
    const trending = await getTrendingProducts();
    console.log("Trending Results:", trending);

    const searchRes = await searchProducts('oil');
    console.log("Search Results for 'oil':", searchRes);

    const searchRes2 = await searchProducts('a'); // Short query test
    console.log("Search Results for 'a':", searchRes2);
};

run();
