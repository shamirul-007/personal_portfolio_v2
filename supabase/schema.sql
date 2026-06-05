-- Projects table for the portfolio admin panel
-- Run this in the Supabase SQL Editor (supabase-indigo-ocean project).

create table if not exists public.projects (
  id          bigint generated always as identity primary key,
  name        text not null,
  image       text not null,
  description text not null,
  tags        text[] not null default '{}',
  demo        text not null,
  source_code text
);

-- Server-side code uses the service_role key (bypasses RLS), so RLS can stay
-- enabled with no public policies. Enable it to be safe:
alter table public.projects enable row level security;

-- Seed with the existing projects (only if the table is empty):
insert into public.projects (name, image, description, tags, demo, source_code)
select * from (values
  ('Bit-Deposit User', 'https://i.ibb.co/mqzPFrV/Screenshot-at-Mar-07-19-48-37.png', 'Bit deposit is a familiar money transaction site for 1xBit bettors.', ARRAY['next','tailwind','styles-component','ant-design','scss','firebase']::text[], 'https://dev-user.bitdeposit.org', null),
  ('Bit-Deposit Agent', 'https://i.ibb.co/F5gBmZr/Screenshot-at-Mar-07-19-53-15.png', 'Earn money by simply referring customers to our platform! With our affiliate program', ARRAY['next','tailwind','styles-component','ant-design','scss','firebase']::text[], 'https://dev-agent.bitdeposit.org', null),
  ('Bit-Deposit Affiliate', 'https://i.ibb.co/b5XWVtH/Screenshot-at-Mar-07-19-55-21.pngg', 'Earn money by simply referring customers to our platform! With our affiliate program', ARRAY['next','tailwind','styles-component','ant-design','scss','firebase']::text[], 'https://dev-affiliate.bitdeposit.org', null),
  ('Next Agency', 'https://i.ibb.co/q7tjwv5/image.png', 'A platform for domain and hosting services providers', ARRAY['next','tailwind','styles-component','emotions-css']::text[], 'https://next-agency-two.vercel.app/', null),
  ('Next Shop Template', 'https://i.ibb.co/wCh7JFs/next-shop.png', 'E-commerce website for a shop owners', ARRAY['next','tailwind','styles-component','emotions-css']::text[], 'https://next-shop-inky-rho.vercel.app/', null),
  ('Next Startup Template', 'https://i.ibb.co/rF8fk0W/next-start-up.png', 'Startup is free Next.js template for startups and SaaS business websites comes with all the essential pages, components, and sections you need to launch a complete business website', ARRAY['next','tailwind','styles-component','emotions-css']::text[], 'https://next-startup-pn7y.vercel.app/', null),
  ('Next E-Commerce Template', 'https://i.ibb.co/1RSjx0w/next-ecommerce.png', 'House My Brand designs clothing for the young, the old & everyone in between – but most importantly, for the fashionable', ARRAY['next','tailwind','styles-component','emotions-css']::text[], 'https://next-ecommcer.vercel.app/', null),
  ('Next.js Template for SaaS', 'https://i.ibb.co/2SZpCS8/next-sass.png', 'Packed with all the key integrations you need for swift SaaS startup launch', ARRAY['next','tailwind','styles-component','emotions-css']::text[], 'https://next-solid-temp.vercel.app/', null),
  ('Next.js Template for Admin Dashboard', 'https://i.ibb.co/4MvBVYC/admin.png', 'Complete solution for admin dashboard.', ARRAY['next','tailwind','styles-component','emotions-css','apex-chart']::text[], 'https://shaon-admin-panel.vercel.app/', null),
  ('E-Commerce platform for grocery store to online shop', 'https://i.ibb.co/1GCZf23/buniyadi.png', 'A E-Commerce platform for grocery store to online shop with nextjs and tailwindcss', ARRAY['next','styles-component','emotions-css','bootstrap']::text[], 'https://buniyadi.com/', null),
  ('Drag and Drop Gallery', 'https://i.ibb.co/9bpy75Q/gallery.png', 'Online Gallery for image drag and drop with nextjs and tailwindcss', ARRAY['next','ant-design','tailwind']::text[], 'https://shamirul-islam-ollyo-test.netlify.app/', null),
  ('Online Gaming Platform', 'https://i.ibb.co/n3H2fBF/game.png', 'Browser Based gaming platform with react and bootstrap', ARRAY['react','react-router-dom','bootstrap']::text[], 'https://shaongames.netlify.app/', null),
  ('Analytics Dashboard Landing Page', 'https://i.ibb.co/Yf4C8z6/dashboard.png', 'Analytics that transform your product inside-out with react and bootstrap', ARRAY['react','react-router-dom','bootstrap']::text[], 'https://maac1.netlify.app/', null),
  ('E-Commerce platform for cloths and electronics store to online shop', 'https://i.ibb.co/PDMsfHC/e-commerce2.png', 'A E-Commerce platform for cloths and electronics store to online shop with react and bootstrap', ARRAY['react','react-router-dom','bootstrap']::text[], 'https://shaonshop.netlify.app/', null),
  ('Browser based car driving game', 'https://i.ibb.co/w6DT3s7/gmap.png', 'Browser based car driving game with react and bootstrap and google map', ARRAY['react','react-router-dom','bootstrap']::text[], 'https://shaongmap.netlify.app/', null)
) as seed(name, image, description, tags, demo, source_code)
where not exists (select 1 from public.projects);
