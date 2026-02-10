import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) envConfig[key.trim()] = val.trim();
    });
} catch (e) {
    console.error("No .env found");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    try {
        const { data, error } = await supabase
            .rpc('get_schema_columns', { table_name: 'invoices' }); // RPC is safer if function exists, else raw query?

        // Raw query not allowed client-side usually unless RLS open.
        // But maybe I can just fetch one row and see keys?
        const { data: rows, error: rowsError } = await supabase
            .from('invoices')
            .select('*')
            .limit(1);

        if (rowsError) {
            console.error("Error fetching rows:", rowsError);
        } else {
            console.log("Invoices table columns:", rows.length > 0 ? Object.keys(rows[0]) : "Table items empty, can't infer all columns");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

checkSchema();
