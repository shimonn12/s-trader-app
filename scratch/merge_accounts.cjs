
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dvejurtzpchvsutfeciw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZWp1cnR6cGNodnN1dGZlY2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjQ3NDAsImV4cCI6MjA4ODc0MDc0MH0.0_zmFqJJ6yVg45VnPlZoB07zCRgO-wwNsWMD_Cf0kTk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function merge() {
    try {
        console.log("🚀 Starting Merge...");

        // 1. Delete the new empty account 'shimon123'
        console.log("🗑 Deleting account 'shimon123'...");
        const { error: delError } = await supabase
            .from('profiles')
            .delete()
            .eq('username', 'shimon123');
        
        if (delError) throw delError;

        // 2. Update 'shimon' to be 'shimon123' with correct email
        console.log("🔄 Updating account 'shimon' to 'shimon123'...");
        const { error: upError } = await supabase
            .from('profiles')
            .update({ 
                username: 'shimon123', 
                email: 'shukronshimon@gmail.com' 
            })
            .eq('username', 'shimon');
        
        if (upError) throw upError;

        console.log("✅ Merge successful! Account 'shimon' is now 'shimon123' with the correct email.");
    } catch (e) {
        console.error("❌ Merge failed:", e.message);
    }
}

merge();
