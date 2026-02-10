import { createClient } from '@supabase/supabase-js';

// Configuration (Hardcoded for verification to bypass env loading complexities)
const SUPABASE_URL = 'https://fnpxnpukhqbwhrowmean.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucHhucHVraHFid2hyb3dtZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODc2MTMsImV4cCI6MjA4MDM2MzYxM30.EfE7ssBSZZmWrWLp6zFqCbsVYdQJGmC6ldI5A6njaW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY.trim(), {
    auth: {
        persistSession: false
    }
});

async function runDiagnosis() {
    console.log("🔍 Starting Backend Diagnosis...");
    console.log("--------------------------------");

    // 1. Create a random user
    const timestamp = Date.now();
    const email = `www.ksingh+${timestamp}@gmail.com`;
    const password = 'password123';

    console.log(`1. Signing up user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error("❌ Sign Up Failed:", error.message);
        return;
    }

    const userId = data.user?.id;
    if (!userId) {
        console.error("❌ User ID not returned.");
        return;
    }
    console.log(`✅ User created! ID: ${userId}`);

    // 2. Poll briefly just to see if trigger worked (give it 2s)
    console.log("2. Checking if trigger auto-created profile...");
    await new Promise(r => setTimeout(r, 2000));

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile) {
        console.log("✅ Profile exists! Trigger is WORKING.");
        console.log("The issue might be resolved, or intermittent.");
        return;
    }

    console.log("⚠️ Profile NOT found. Trigger likely failed.");
    console.log("3. Attempting MANUAL INSERT to reveal the error...");

    // 3. Manual Insert to expose constraint errors
    // accessible because of 'Users can insert their own profile' policy
    const { error: insertError } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            email: email,
            role: 'user' // Try valid 'user' role first
        });

    if (insertError) {
        console.error("\n❌❌ MANUAL INSERT ERROR (reveals root cause):");
        console.error(JSON.stringify(insertError, null, 2));
        console.log("\nIf this says 'violates check constraint', then the constraints weren't updated.");
        console.log("If this says 'violates row-level security', then policies aren't correct.");
    } else {
        console.log("\n✅ Manual insert SUCCEEDED.");
        console.log("This means the table accepts the data, but the TRIGGER itself is missing or broken.");
        console.log("Action: Re-run the trigger creation SQL.");
    }
}

runDiagnosis();
