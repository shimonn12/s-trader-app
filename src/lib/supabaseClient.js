import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase Project URL and Anon Key
const supabaseUrl = 'https://dvejurtzpchvsutfeciw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZWp1cnR6cGNodnN1dGZlY2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjQ3NDAsImV4cCI6MjA4ODc0MDc0MH0.0_zmFqJJ6yVg45VnPlZoB07zCRgO-wwNsWMD_Cf0kTk';

export const supabase = createClient(supabaseUrl, supabaseKey);
