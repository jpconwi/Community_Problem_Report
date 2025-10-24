const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
async function testConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Connected to Supabase');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
    }
}

// Initialize database (create admin user)
async function initDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        const connected = await testConnection();
        if (!connected) throw new Error('Supabase connection failed');

        // Check/create admin user
        const { data: adminUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', 'admin@community.com')
            .single();

        if (!adminUser) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            const { error } = await supabase
                .from('users')
                .insert([
                    {
                        username: 'admin',
                        password: hashedPassword,
                        email: 'admin@community.com',
                        role: 'admin'
                    }
                ]);

            if (!error) {
                console.log('✅ Admin user created');
                console.log('   📧 Email: admin@community.com');
                console.log('   🔑 Password: admin123');
            }
        }
        
        console.log('✅ Database initialized');
        return true;
    } catch (error) {
        console.error('❌ Database init error:', error);
        throw error;
    }
}

module.exports = { supabase, initDatabase, testConnection };
