@@ .. @@
 CREATE POLICY "Super admins can manage app versions"
   ON app_versions
   FOR ALL
   TO authenticated
-  USING (
-    EXISTS (
-      SELECT 1 FROM users 
-      WHERE users.id = auth.uid() 
-      AND users.is_super_admin = true
-    )
-  )
-  WITH CHECK (
-    EXISTS (
-      SELECT 1 FROM users 
-      WHERE users.id = auth.uid() 
-      AND users.is_super_admin = true
-    )
-  );
+  USING (public.is_super_admin())
+  WITH CHECK (public.is_super_admin());

 -- Create function to update updated_at
@@ .. @@
 CREATE OR REPLACE FUNCTION set_current_version(version_id uuid)
 RETURNS void AS $$
 BEGIN
+  -- Check if user is super admin
+  IF NOT public.is_super_admin() THEN
+    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
+  END IF;
+  
   -- Remove current flag from all versions
   UPDATE app_versions SET is_current = false;
