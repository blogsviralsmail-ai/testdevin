/**
 * Seed Script for EstateFlow CRM
 *
 * Run with: npx tsx scripts/seed.ts
 *
 * Prerequisites:
 * 1. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * 2. Run the migration (001_initial_schema.sql) in your Supabase project first
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log('Seeding EstateFlow CRM...');

  // 1. Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: 'Demo Real Estate Co.', slug: 'demo-real-estate' })
    .select()
    .single();

  if (orgError) {
    console.error('Failed to create org:', orgError.message);
    return;
  }

  console.log('Created organization:', org.id);

  // 2. Create users via auth
  const users = [
    { email: 'admin@estateflow.demo', password: 'demo123456', full_name: 'Rajesh Kumar', role: 'admin', phone: '+919876543210' },
    { email: 'agent1@estateflow.demo', password: 'demo123456', full_name: 'Priya Sharma', role: 'sales_agent', phone: '+919876543211' },
    { email: 'agent2@estateflow.demo', password: 'demo123456', full_name: 'Amit Patel', role: 'sales_agent', phone: '+919876543212' },
    { email: 'field@estateflow.demo', password: 'demo123456', full_name: 'Vikram Singh', role: 'field_executive', phone: '+919876543213' },
    { email: 'social@estateflow.demo', password: 'demo123456', full_name: 'Neha Gupta', role: 'social_media_manager', phone: '+919876543214' },
  ];

  const userIds: string[] = [];

  for (const user of users) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, role: user.role },
    });

    if (authError) {
      console.error(`Failed to create user ${user.email}:`, authError.message);
      continue;
    }

    const userId = authData.user.id;
    userIds.push(userId);

    await supabase
      .from('profiles')
      .update({
        organization_id: org.id,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
      })
      .eq('id', userId);

    console.log(`Created user: ${user.full_name} (${user.role})`);
  }

  // 3. Create integration settings
  await supabase.from('integration_settings').insert({
    organization_id: org.id,
    lead_assignment_mode: 'round_robin',
  });

  // 4. Create sample properties
  const properties = [
    { title: '3BHK Premium Apartment - Golf Course Road', location: 'Gurgaon', property_type: 'apartment', price: 12500000, bedrooms: 3, bathrooms: 2, size: '1800 sq ft', floor: '12th Floor', furnishing: 'semi_furnished', amenities: ['Parking', 'Swimming Pool', 'Gym', 'Club House', '24/7 Security'], description: 'Premium 3BHK apartment with panoramic views of the golf course.' },
    { title: '4BHK Luxury Villa - Sector 57', location: 'Gurgaon', property_type: 'villa', price: 35000000, bedrooms: 4, bathrooms: 4, size: '3500 sq ft', furnishing: 'fully_furnished', amenities: ['Private Garden', 'Parking', 'Smart Home', 'Terrace'], description: 'Spacious luxury villa with modern amenities.' },
    { title: '2BHK Ready to Move - Noida Extension', location: 'Noida', property_type: 'apartment', price: 4500000, bedrooms: 2, bathrooms: 2, size: '1100 sq ft', floor: '8th Floor', furnishing: 'unfurnished', amenities: ['Parking', 'Lift', 'Power Backup'], description: 'Affordable 2BHK in a prime location.' },
    { title: 'Commercial Office Space - Cyber City', location: 'Gurgaon', property_type: 'commercial', price: 22000000, size: '2200 sq ft', amenities: ['Central AC', 'Cafeteria', 'Conference Room', 'Parking'], description: 'Premium office space in Cyber City business hub.' },
    { title: 'Residential Plot - Sector 85', location: 'Gurgaon', property_type: 'plot', price: 8000000, size: '200 sq yards', description: 'Prime residential plot in developing sector.' },
    { title: '1BHK Studio Apartment', location: 'Delhi', property_type: 'apartment', price: 2800000, bedrooms: 1, bathrooms: 1, size: '550 sq ft', floor: '3rd Floor', furnishing: 'semi_furnished', amenities: ['Parking', 'Lift'], description: 'Compact studio apartment ideal for bachelors.' },
    { title: '3BHK Penthouse - MG Road', location: 'Gurgaon', property_type: 'apartment', price: 45000000, bedrooms: 3, bathrooms: 3, size: '4000 sq ft', floor: 'Top Floor', furnishing: 'fully_furnished', amenities: ['Private Terrace', 'Jacuzzi', 'Home Theatre', 'Smart Home'], description: 'Ultra-luxury penthouse with 360-degree views.' },
    { title: '2BHK Rental - Sector 29', location: 'Gurgaon', property_type: 'rental', price: 25000, bedrooms: 2, bathrooms: 2, size: '1000 sq ft', furnishing: 'fully_furnished', amenities: ['Parking', 'Gym', 'Pool'], description: 'Fully furnished rental in prime location.' },
    { title: '5BHK Farmhouse', location: 'Faridabad', property_type: 'villa', price: 75000000, bedrooms: 5, bathrooms: 5, size: '1 acre', amenities: ['Swimming Pool', 'Tennis Court', 'Lawn', 'Guest House'], description: 'Exclusive farmhouse with sprawling gardens.' },
    { title: 'Shop Space - Sohna Road', location: 'Gurgaon', property_type: 'commercial', price: 5500000, size: '400 sq ft', amenities: ['Main Road Facing', 'Parking'], description: 'Commercial shop in a busy market area.' },
  ];

  for (const prop of properties) {
    const { error } = await supabase.from('properties').insert({
      organization_id: org.id,
      ...prop,
      availability: 'available',
      tags: [],
    });
    if (error) console.error('Property error:', error.message);
  }
  console.log(`Created ${properties.length} properties`);

  // 5. Create sample leads
  const leadData = [
    { full_name: 'Rahul Sharma', phone: '+919999999001', email: 'rahul@example.com', source: '36_acre', property_type: 'apartment', budget_min: 7500000, budget_max: 12000000, preferred_location: 'Gurgaon', status: 'new', temperature: 'hot' },
    { full_name: 'Sunita Verma', phone: '+919999999002', email: 'sunita@example.com', source: 'magicbricks', property_type: 'villa', budget_min: 20000000, budget_max: 40000000, preferred_location: 'Gurgaon', status: 'contacted', temperature: 'warm' },
    { full_name: 'Ankit Gupta', phone: '+919999999003', source: 'facebook', property_type: 'apartment', budget_min: 3000000, budget_max: 5000000, preferred_location: 'Noida', status: 'interested', temperature: 'hot' },
    { full_name: 'Deepika Jain', phone: '+919999999004', email: 'deepika@example.com', source: 'housing', property_type: 'apartment', budget_min: 10000000, budget_max: 15000000, preferred_location: 'Gurgaon', status: 'site_visit_scheduled', temperature: 'hot' },
    { full_name: 'Mohit Agarwal', phone: '+919999999005', source: 'instagram', property_type: 'commercial', budget_min: 15000000, budget_max: 25000000, preferred_location: 'Gurgaon', status: 'negotiation', temperature: 'warm' },
    { full_name: 'Kavita Reddy', phone: '+919999999006', email: 'kavita@example.com', source: 'website', property_type: 'plot', budget_min: 5000000, budget_max: 10000000, preferred_location: 'Gurgaon', status: 'new', temperature: 'cold' },
    { full_name: 'Sanjay Mehta', phone: '+919999999007', source: 'referral', property_type: 'villa', budget_min: 50000000, budget_max: 80000000, preferred_location: 'Faridabad', status: 'interested', temperature: 'warm' },
    { full_name: 'Pooja Kapoor', phone: '+919999999008', email: 'pooja@example.com', source: 'facebook', property_type: 'apartment', budget_min: 2000000, budget_max: 3500000, preferred_location: 'Delhi', status: 'won', temperature: 'hot' },
    { full_name: 'Vikas Yadav', phone: '+919999999009', source: 'manual', property_type: 'apartment', budget_min: 4000000, budget_max: 6000000, preferred_location: 'Noida', status: 'not_responding', temperature: 'cold' },
    { full_name: 'Meera Chopra', phone: '+919999999010', email: 'meera@example.com', source: '36_acre', property_type: 'apartment', budget_min: 8000000, budget_max: 13000000, preferred_location: 'Gurgaon', status: 'contacted', temperature: 'warm' },
    { full_name: 'Ravi Kumar', phone: '+919999999011', source: 'magicbricks', property_type: 'commercial', budget_min: 3000000, budget_max: 6000000, preferred_location: 'Gurgaon', status: 'new', temperature: 'warm' },
    { full_name: 'Anjali Singh', phone: '+919999999012', email: 'anjali@example.com', source: 'housing', property_type: 'villa', budget_min: 25000000, budget_max: 40000000, preferred_location: 'Gurgaon', status: 'interested', temperature: 'hot' },
    { full_name: 'Karan Malhotra', phone: '+919999999013', source: 'instagram', property_type: 'apartment', budget_min: 10000000, budget_max: 20000000, preferred_location: 'Gurgaon', status: 'lost', temperature: 'cold' },
    { full_name: 'Nisha Saxena', phone: '+919999999014', source: 'website', property_type: 'rental', budget_min: 15000, budget_max: 30000, preferred_location: 'Gurgaon', status: 'new', temperature: 'warm' },
    { full_name: 'Arun Tiwari', phone: '+919999999015', email: 'arun@example.com', source: 'referral', property_type: 'plot', budget_min: 6000000, budget_max: 9000000, preferred_location: 'Gurgaon', status: 'contacted', temperature: 'warm' },
    { full_name: 'Sneha Bajaj', phone: '+919999999016', source: 'facebook', property_type: 'apartment', budget_min: 5000000, budget_max: 8000000, preferred_location: 'Noida', status: 'new', temperature: 'hot' },
    { full_name: 'Rohit Bansal', phone: '+919999999017', email: 'rohit@example.com', source: 'manual', property_type: 'commercial', budget_min: 20000000, budget_max: 30000000, preferred_location: 'Delhi', status: 'negotiation', temperature: 'hot' },
    { full_name: 'Divya Nair', phone: '+919999999018', source: 'housing', property_type: 'apartment', budget_min: 3500000, budget_max: 5500000, preferred_location: 'Noida', status: 'new', temperature: 'cold' },
    { full_name: 'Manoj Khanna', phone: '+919999999019', email: 'manoj@example.com', source: 'instagram', property_type: 'villa', budget_min: 30000000, budget_max: 50000000, preferred_location: 'Gurgaon', status: 'site_visit_scheduled', temperature: 'hot' },
    { full_name: 'Rekha Chauhan', phone: '+919999999020', source: '36_acre', property_type: 'apartment', budget_min: 6000000, budget_max: 9000000, preferred_location: 'Gurgaon', status: 'new', temperature: 'warm' },
  ];

  const agentIds = userIds.filter((_, i) => users[i]?.role === 'sales_agent');

  for (let i = 0; i < leadData.length; i++) {
    const agentId = agentIds[i % agentIds.length];
    const { error } = await supabase.from('leads').insert({
      organization_id: org.id,
      ...leadData[i],
      assigned_agent_id: agentId,
      notes: `Sample lead ${i + 1}`,
    });
    if (error) console.error('Lead error:', error.message);
  }
  console.log(`Created ${leadData.length} leads`);

  // 6. Create sample activities
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('organization_id', org.id)
    .limit(5);

  if (leads) {
    for (const lead of leads) {
      await supabase.from('activities').insert([
        { organization_id: org.id, lead_id: lead.id, user_id: agentIds[0], type: 'note', title: 'Lead created', description: 'Lead entered via seed data' },
        { organization_id: org.id, lead_id: lead.id, user_id: agentIds[0], type: 'call', title: 'Initial call made', description: 'Called lead - discussed requirements' },
      ]);
    }
    console.log('Created sample activities');
  }

  // 7. Create sample calls
  if (leads && leads.length >= 3) {
    await supabase.from('calls').insert([
      { organization_id: org.id, lead_id: leads[0].id, agent_id: agentIds[0], status: 'completed', duration: 180, outcome: 'connected', started_at: new Date().toISOString() },
      { organization_id: org.id, lead_id: leads[1].id, agent_id: agentIds[0], status: 'completed', duration: 45, outcome: 'no_answer', started_at: new Date().toISOString() },
      { organization_id: org.id, lead_id: leads[2].id, agent_id: agentIds[1] || agentIds[0], status: 'completed', duration: 300, outcome: 'connected', started_at: new Date().toISOString() },
    ]);
    console.log('Created sample calls');
  }

  // 8. Create sample follow-ups
  if (leads && leads.length >= 3) {
    await supabase.from('followups').insert([
      { organization_id: org.id, lead_id: leads[0].id, agent_id: agentIds[0], type: 'whatsapp', status: 'pending', message: 'Send property brochure', scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
      { organization_id: org.id, lead_id: leads[1].id, agent_id: agentIds[0], type: 'call', status: 'pending', message: 'Follow up on site visit', scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
      { organization_id: org.id, lead_id: leads[2].id, agent_id: agentIds[1] || agentIds[0], type: 'email', status: 'completed', message: 'Sent property comparison', scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), completed_at: new Date().toISOString() },
    ]);
    console.log('Created sample follow-ups');
  }

  // 9. Create sample attendance
  for (const uid of userIds.slice(0, 3)) {
    await supabase.from('attendance').insert({
      organization_id: org.id,
      user_id: uid,
      check_in_time: new Date(new Date().setHours(9, 15, 0)).toISOString(),
      check_in_latitude: 28.4595,
      check_in_longitude: 77.0266,
      status: 'present',
    });
  }
  console.log('Created sample attendance');

  // 10. Create sample social posts
  await supabase.from('social_posts').insert([
    { organization_id: org.id, post_type: 'instagram_post', caption: '🏠 New luxury apartments available in Gurgaon! Starting at ₹75L. #RealEstate #Gurgaon', status: 'published', assigned_to: userIds[4] || userIds[0], published_at: new Date().toISOString() },
    { organization_id: org.id, post_type: 'instagram_reel', caption: 'Take a virtual tour of our premium 3BHK apartments! 🎥', status: 'scheduled', assigned_to: userIds[4] || userIds[0], scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() },
    { organization_id: org.id, post_type: 'facebook_post', caption: 'Why Gurgaon is the best city for real estate investment in 2025', status: 'draft', assigned_to: userIds[4] || userIds[0] },
    { organization_id: org.id, post_type: 'linkedin_post', caption: 'Market update: Property prices in NCR region', status: 'idea', assigned_to: userIds[4] || userIds[0] },
  ]);
  console.log('Created sample social posts');

  console.log('\n✨ Seed completed successfully!');
  console.log('\nDemo login credentials:');
  console.log('  Admin: admin@estateflow.demo / demo123456');
  console.log('  Agent 1: agent1@estateflow.demo / demo123456');
  console.log('  Agent 2: agent2@estateflow.demo / demo123456');
}

seed().catch(console.error);
