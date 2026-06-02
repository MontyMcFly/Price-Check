const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yremoxnhieijusfggeao.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZW1veG5oaWVpanVzZmdnZWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NzY3MzksImV4cCI6MjA5MDE1MjczOX0.YG35HXha-37avjJ2O6NCisApHBCg8uygZnzLejU8yKI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles:', data);
  }
}

check();
