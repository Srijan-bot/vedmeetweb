import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://fnpxnpukhqbwhrowmean.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucHhucHVraHFid2hyb3dtZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODc2MTMsImV4cCI6MjA4MDM2MzYxM30.EfE7ssBSZZmWrWLp6zFqCbsVYdQJGmC6ldI5A6njaW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY.trim(), {
    auth: { persistSession: false }
});

async function checkUser() {
    console.log("🔍 Checking User Status for: www.ksingh@gmail.com");

    // We can't query auth.users directly with anon key usually. 
    // But we CAN try to login! This is the best test.

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'www.ksingh144@gmail.com',
        password: 'password123' // Assumption: User used a standard test password or we can't test this.
        // If we don't know the password, we can only check the public profile.
    });

    if (error) {
        console.log(`❌ Login Failed: ${error.message}`);
        if (error.message.includes("Email not confirmed")) {
            console.log("👉 CAUSE: Email is NOT confirmed.");
        } else if (error.message.includes("Invalid login credentials")) {
            console.log("👉 CAUSE: Wrong Password OR Email not confirmed (Supabase hides valid email existence).");
        }
    } else {
        console.log("✅ Login SUCCEEDED (Auth is good).");
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Email Confirmed At: ${data.user.email_confirmed_at}`);

        // NOW check the role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile) {
            console.log(`   Assigned Role: ${profile.role}`);
            if (profile.role === 'agent' || profile.role === 'admin') {
                console.log("✅ Role is valid for App Login.");
            } else {
                console.log("❌ Role is 'user'. App will reject this login ('Access Denied').");
            }
        } else {
            console.log("❌ Profile NOT found (Zombie user).");
        }
    }
}

checkUser();
