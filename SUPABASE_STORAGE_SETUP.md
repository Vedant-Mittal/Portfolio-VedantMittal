# Supabase Storage Setup Instructions

## ✅ What's Already Done
- The "storage" bucket has been created in your Supabase project
- The bucket is set to public
- File size limit: 10MB
- Allowed file types: PNG, JPEG, JPG, GIF, WebP, SVG

## 🔧 What You Need To Do
Set up storage policies to allow image uploads. Follow these steps:

### Step 1: Go to Your Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard/project/hiritewzhsokvkioctfe
2. Sign in if needed

### Step 2: Navigate to Storage Policies
1. Click on **"Storage"** in the left sidebar
2. Click on the **"Policies"** tab at the top
3. You should see the "storage" bucket listed

### Step 3: Create Upload Policy
1. Click on **"New Policy"** button
2. Choose **"For full customization"** (or custom policy)
3. Fill in the following:
   - **Policy name**: `Authenticated users can upload`
   - **Allowed operation**: `INSERT` (select the INSERT checkbox)
   - **Target roles**: `authenticated`
   - **USING expression**: Leave empty
   - **WITH CHECK expression**: `bucket_id = 'storage'`
4. Click **"Review"** then **"Save policy"**

### Step 4: Create Update Policy
1. Click on **"New Policy"** button again
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name**: `Authenticated users can update`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**: `bucket_id = 'storage'`
   - **WITH CHECK expression**: Leave empty or use `bucket_id = 'storage'`
4. Click **"Review"** then **"Save policy"**

### Step 5: Create Delete Policy
1. Click on **"New Policy"** button again
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name**: `Authenticated users can delete`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: `bucket_id = 'storage'`
   - **WITH CHECK expression**: Leave empty
4. Click **"Review"** then **"Save policy"**

### Step 6: Create Public Read Policy
1. Click on **"New Policy"** button one more time
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Target roles**: Leave as `public` (or all roles)
   - **USING expression**: `bucket_id = 'storage'`
   - **WITH CHECK expression**: Leave empty
4. Click **"Review"** then **"Save policy"**

## ✨ After Setup
Once you've created all 4 policies, image uploads should work in your portfolio editor!

Test it by:
1. Going to `/admin/portfolio` in your app
2. Adding a new design
3. Clicking the "Upload Image" button
4. Selecting an image file

The upload should now work successfully!

## 🆘 Alternative: Quick Policy Setup via SQL Editor
If you prefer, you can also set up all policies at once using SQL:

1. Go to **"SQL Editor"** in your Supabase dashboard
2. Click **"New query"**
3. Paste this SQL and run it:

```sql
-- Enable RLS if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create all policies
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'storage' );

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'storage' );

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'storage' );

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'storage' );
```

4. Click **"Run"** to execute the SQL
5. Policies will be created automatically!

This SQL method is faster and creates all policies at once.
