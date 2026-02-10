import { createClient } from '@supabase/supabase-js';

// Configuration (Hardcoded for verification to bypass env loading issues)
const SUPABASE_URL = 'https://fnpxnpukhqbwhrowmean.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucHhucHVraHFid2hyb3dtZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODc2MTMsImV4cCI6MjA4MDM2MzYxM30.EfE7ssBSZZmWrWLp6zFqCbsVYdQJGmC6ldI5A6njaW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY.trim(), {
    auth: {
        persistSession: false
    }
});

async function runTest() {
    console.log("Starting Backend Verification Test...");

    // 1. Create a random user
    const timestamp = Date.now();
    const email = `test_auto_${timestamp}@example.com`;
    const password = 'password123';

    console.log(`1. Attempting to create user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error("❌ Sign Up Failed:", error.message);
        process.exit(1);
    }

    const userId = data.user?.id;
    if (!userId) {
        console.error("❌ User ID not returned.");
        process.exit(1);
    }

    console.log(`✅ User created. ID: ${userId}`);

    // 2. Check for Profile (Polling)
    console.log("2. Waiting for Profile trigger...");

    let profileFound = false;
    for (let i = 0; i < 10; i++) { // 10 attempts
        await new Promise(r => setTimeout(r, 1000)); // 1 sec wait

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profile) {
            console.log("✅ Profile FOUND!");
            console.log("   Role:", profile.role);
            console.log("   Email:", profile.email);
            profileFound = true;
            break;
        } else {
            // console.log(`   Attempt ${i+1}: Profile not found yet... (${profileError?.code} - ${profileError?.message})`);
        }
    }

    if (profileFound) {
        console.log("\n✅✅ SUCCESS: Backend Trigger is WORKING.");
    } else {
        console.error("\n❌❌ FAILURE: Profile was NOT created after 10 seconds.");
        console.error("The SQL Trigger 'on_auth_user_created' is likely missing or failing.");
    }

    // Cleanup (Optional - Delete the test user if possible, but requires Service Role usually)
    // For now, we leave it.
}

runTest();
