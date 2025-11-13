/*
  # Add employee role

  1. New Role
    - `employee` role with limited permissions
    - Based on viewer role but with additional booking permissions
    - Can view and create bookings but cannot modify or delete

  2. Permissions
    - Dashboard: view_dashboard, view_stats
    - Calendar: view_calendar, view_bookings_list, view_all_bookings, create_booking
    - Services: view_services
    - Clients: view_clients
    - Payments: view_payments
*/

-- Insert employee role
INSERT INTO roles (id, name, description, permissions, is_default, created_at, updated_at)
VALUES (
  'employee',
  'Employé',
  'Gestion limitée des réservations et consultation',
  '[
    "view_dashboard",
    "view_stats",
    "view_calendar",
    "view_bookings_list",
    "view_all_bookings",
    "create_booking",
    "view_services",
    "view_clients",
    "view_payments"
  ]'::jsonb,
  false,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = now();
