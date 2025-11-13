# BookingFast - Database Schema Documentation

## Overview

This document describes the complete database schema for the BookingFast application after the migration to a clean, well-organized structure.

**Migration Date:** November 13, 2025
**Total Tables:** 48
**Total Migrations:** 14

---

## Database Architecture

The database is organized into logical modules:

1. **Authentication & Users** - User profiles and authentication
2. **Team Management** - Teams, members, and invitations
3. **Business Core** - Services, bookings, clients, and settings
4. **Calendar Integration** - Google Calendar sync and availability
5. **Financial Features** - Invoices, products, and payments
6. **Subscription System** - Plans and user subscriptions
7. **Plugin Architecture** - Modular plugin system
8. **POS System** - Point of sale functionality
9. **Payment & Workflows** - Payment links and automation
10. **Notifications & Affiliates** - Notifications and referral program
11. **Audit & Platform** - History tracking and settings
12. **Functions & Triggers** - Automated database operations
13. **Storage & Realtime** - File storage and live updates
14. **Default Data** - Initial configuration

---

## Tables by Category

### 1. Authentication & User Management

#### profiles
User profiles linked to authentication system.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users |
| email | text | User email (unique) |
| full_name | text | Full name |
| avatar_url | text | Avatar image URL |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**RLS:** Public can view, users can update their own profile

---

### 2. Team Management

#### teams
Teams for multi-user collaboration.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Team name |
| owner_id | uuid | Team owner (references auth.users) |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### team_members
Team members with roles and permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| team_id | uuid | References teams |
| user_id | uuid | References auth.users |
| role | text | Role: owner, admin, member |
| permissions | text[] | Array of permissions |
| role_name | text | Display name for role |
| is_active | boolean | Active status |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### team_invitations
Pending team invitations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| team_id | uuid | References teams |
| email | text | Invited email |
| role | text | Assigned role |
| permissions | text[] | Assigned permissions |
| role_name | text | Role display name |
| status | text | Status: pending, accepted, declined, expired |
| expires_at | timestamptz | Expiration date |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

---

### 3. Business Core

#### business_settings
Business configuration and settings.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users (optional) |
| business_name | text | Business name |
| primary_color | text | Primary brand color |
| secondary_color | text | Secondary brand color |
| logo_url | text | Logo URL |
| opening_hours | jsonb | Operating hours by day |
| buffer_minutes | integer | Buffer between bookings |
| default_deposit_percentage | integer | Default deposit % |
| multiply_deposit_by_participants | boolean | Multiply deposit by participants |
| email_notifications | boolean | Email notifications enabled |
| google_calendar_enabled | boolean | Google Calendar sync enabled |
| tax_rate | numeric(5,2) | Default tax rate |
| brevo_api_key | text | Brevo API key |
| brevo_enabled | boolean | Brevo integration enabled |
| twilio_account_sid | text | Twilio account SID |
| twilio_auth_token | text | Twilio auth token |
| twilio_phone_number | text | Twilio phone number |

#### services
Services offered by the business.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Service name |
| price_ht | numeric(10,2) | Price excl. tax |
| price_ttc | numeric(10,2) | Price incl. tax |
| image_url | text | Service image |
| description | text | Description |
| duration_minutes | integer | Duration in minutes |
| capacity | integer | Max participants |
| user_id | uuid | References auth.users |
| category | text | Service category |
| is_active | boolean | Active status |
| booking_interval_minutes | integer | Booking interval |

#### clients
Client database for bookings and invoices.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| first_name | text | First name |
| last_name | text | Last name |
| email | text | Email address |
| phone | text | Phone number |
| address | text | Street address |
| city | text | City |
| postal_code | text | Postal code |
| country | text | Country |
| notes | text | Notes |
| user_id | uuid | References auth.users |

#### bookings
Customer bookings and reservations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| service_id | uuid | References services |
| date | date | Booking date |
| time | time | Booking time |
| duration_minutes | integer | Duration |
| quantity | integer | Number of participants |
| client_name | text | Client last name |
| client_firstname | text | Client first name |
| client_email | text | Client email |
| client_phone | text | Client phone |
| total_amount | numeric(10,2) | Total amount |
| payment_status | text | Status: pending, partial, completed, cancelled, refunded |
| payment_amount | numeric(10,2) | Amount paid |
| deposit_type | text | Type: percentage, fixed, full |
| deposit_amount | numeric(10,2) | Deposit amount |
| notes | text | Booking notes |
| assigned_user_id | uuid | Assigned team member |
| google_calendar_event_id | text | Google Calendar event ID |
| stripe_session_id | text | Stripe session ID |
| payment_link_id | uuid | Payment link reference |
| notification_preferences | jsonb | Notification settings |

**RLS:** Public can view and insert, authenticated can update/delete

---

### 4. Calendar Integration

#### google_calendar_tokens
Google Calendar OAuth tokens per user.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users (unique) |
| access_token | text | OAuth access token |
| refresh_token | text | OAuth refresh token |
| token_expiry | timestamptz | Token expiration |
| scope | text | OAuth scope |
| calendar_id | text | Calendar ID |

#### unavailabilities
User unavailability periods.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| date | date | Unavailable date |
| start_time | time | Start time |
| end_time | time | End time |
| reason | text | Reason |
| is_recurring | boolean | Recurring event |
| recurrence_pattern | jsonb | Recurrence pattern |

#### blocked_date_ranges
Blocked date ranges for vacation, holidays, etc.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| start_date | date | Start date |
| end_date | date | End date |
| reason | text | Reason |
| is_all_day | boolean | All day block |

---

### 5. Financial Features

#### company_info
Company information for invoices.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| company_name | text | Company name |
| siret | text | SIRET number |
| vat_number | text | VAT number |
| address | text | Address |
| city | text | City |
| postal_code | text | Postal code |
| country | text | Country |
| phone | text | Phone |
| email | text | Email |
| website | text | Website |
| logo_url | text | Logo URL |

#### products
Products and services for invoicing.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| name | text | Product name |
| description | text | Description |
| price_ht | numeric(10,2) | Price excl. tax |
| price_ttc | numeric(10,2) | Price incl. tax |
| tax_rate | numeric(5,2) | Tax rate |
| reference | text | Product reference |
| category | text | Category |
| is_active | boolean | Active status |

#### invoices
Invoices, quotes, and credit notes.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| client_id | uuid | References clients |
| invoice_number | text | Invoice number |
| issue_date | date | Issue date |
| due_date | date | Due date |
| status | text | Status: draft, sent, paid, overdue, cancelled |
| subtotal | numeric(10,2) | Subtotal |
| tax_amount | numeric(10,2) | Tax amount |
| total_amount | numeric(10,2) | Total amount |
| paid_amount | numeric(10,2) | Amount paid |
| document_type | text | Type: invoice, quote, credit_note |
| notes | text | Notes |
| payment_terms | text | Payment terms |

#### invoice_items
Line items for invoices.

#### invoice_payments
Payments and refunds for invoices.

---

### 6. Subscription System

#### subscription_plans
Available subscription plans.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Plan name (unique) |
| description | text | Description |
| price_monthly | numeric(10,2) | Monthly price |
| price_yearly | numeric(10,2) | Yearly price |
| features | jsonb | Feature list |
| is_active | boolean | Active status |
| max_team_members | integer | Max team members |
| max_bookings_per_month | integer | Max bookings per month |
| stripe_price_id | text | Stripe price ID |

**Default Plans:** Free, Pro, Enterprise

#### subscriptions
User subscriptions to plans.

#### stripe_customers
Stripe customer IDs linked to users.

#### stripe_subscriptions
Stripe subscription details.

---

### 7. Plugin Architecture

#### plugins
Available plugins and extensions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Plugin name (unique) |
| description | text | Description |
| icon | text | Icon name |
| price_monthly | numeric(10,2) | Monthly price |
| is_active | boolean | Active status |
| stripe_price_id | text | Stripe price ID |
| stripe_payment_link | text | Stripe payment link |
| features | jsonb | Feature list |
| category | text | Category |
| display_order | integer | Display order |

**Available Plugins:**
- SMS Notifications
- Email Automation
- Point of Sale
- Advanced Analytics
- Google Calendar Sync
- Affiliate Program

#### plugin_subscriptions
User subscriptions to individual plugins.

#### team_member_plugin_permissions
Plugin permissions for team members.

---

### 8. POS System

#### pos_settings, pos_categories, pos_products
Point of sale configuration, categories, and products.

#### pos_transactions, pos_transaction_items
POS sales transactions and line items.

---

### 9. Payment & Workflows

#### payment_links
Payment links for easy customer payments.

#### email_workflows, email_templates
Automated email workflows and templates.

#### sms_workflows, sms_templates, sms_logs
Automated SMS workflows, templates, and delivery logs.

---

### 10. Notifications & Affiliates

#### notifications
User notifications and alerts.

#### affiliates, affiliate_referrals, affiliate_commissions, affiliate_settings
Affiliate partners, referrals, commissions, and settings.

#### access_codes, code_redemptions
Access codes for discounts and features.

#### onesignal_logs
OneSignal push notification logs.

---

### 11. Audit & Platform

#### booking_history
Audit trail for booking modifications.

#### multi_user_settings
Per-user configuration settings.

#### platform_settings
Platform-wide configuration settings.

#### app_versions
Application version tracking.

#### admin_sessions
Admin user impersonation sessions for support.

---

## Database Functions

### Utility Functions

- `update_updated_at_column()` - Automatically updates updated_at timestamp
- `create_profile_for_user()` - Creates profile on user signup
- `track_booking_changes()` - Tracks booking modifications to history
- `notify_booking_event()` - Creates notifications for booking events
- `user_has_active_subscription(uuid)` - Checks if user has active subscription
- `user_has_plugin_access(uuid, uuid)` - Checks plugin access
- `get_user_active_plugins(uuid)` - Returns list of active plugins

---

## Storage Buckets

1. **avatars** - User profile avatars (public, 5MB limit)
2. **service-images** - Service images (public, 10MB limit)
3. **invoices** - Generated invoice PDFs (private, 10MB limit)
4. **company-logos** - Company logos (public, 5MB limit)

---

## Realtime Configuration

Tables with realtime updates enabled:
- bookings
- notifications
- services
- team_members
- team_invitations
- unavailabilities
- blocked_date_ranges
- invoices
- pos_transactions

---

## Security (RLS)

All tables have Row Level Security (RLS) enabled with appropriate policies:

- **Public tables:** Services, plugins, subscription plans (read-only for anon)
- **User-specific:** Users can only access their own data
- **Team-based:** Team members can access team data based on permissions
- **Service role:** Edge functions have elevated permissions for webhooks

---

## Migration Files

The database was created with 14 clean, well-organized migration files:

1. `20251113000001_authentication_and_users.sql` - User profiles
2. `20251113000002_team_management.sql` - Teams and members
3. `20251113000003_business_core.sql` - Services, bookings, clients
4. `20251113000004_calendar_integration.sql` - Calendar sync
5. `20251113000005_financial_features.sql` - Invoices and products
6. `20251113000006_subscription_system.sql` - Subscription plans
7. `20251113000007_plugin_architecture.sql` - Plugin system
8. `20251113000008_pos_system.sql` - Point of sale
9. `20251113000009_payment_and_workflows.sql` - Payments and automation
10. `20251113000010_notifications_and_affiliates.sql` - Notifications and referrals
11. `20251113000011_audit_and_platform.sql` - Audit and settings
12. `20251113000012_functions_and_triggers.sql` - Database automation
13. `20251113000013_storage_and_realtime.sql` - Storage and realtime
14. `20251113000014_default_data_seeding.sql` - Initial data

---

## Backup Information

Previous migration files (261 files) have been backed up to:
`/tmp/cc-agent/59838046/project/supabase/migrations_backup/`

---

## Next Steps

1. Test all application features with the new database
2. Verify all Edge Functions work correctly
3. Test authentication flows (signup, login, password reset)
4. Test booking creation from public iframe
5. Verify realtime updates work for bookings and notifications
6. Test team management and permissions
7. Verify plugin subscriptions and access control
8. Test POS system functionality
9. Verify invoice generation and payment tracking
10. Test affiliate program features

---

## Support

For issues or questions about the database schema:
- Check migration files for detailed comments
- Review RLS policies for access control issues
- Verify Edge Function permissions
- Check logs for trigger execution
