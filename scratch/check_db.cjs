
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dvejurtzpchvsutfeciw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZWp1cnR6cGNodnN1dGZlY2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjQ3NDAsImV4cCI6MjA4ODc0MDc0MH0.0_zmFqJJ6yVg45VnPlZoB07zCRgO-wwNsWMD_Cf0kTk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('profiles')
        .select('username, email')
        .ilike('username', 'shimon%');
    
    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
