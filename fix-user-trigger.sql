-- Fix the user creation trigger function
-- The issue is that the trigger is not properly getting the auth.uid()

-- Drop the existing trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a corrected function that properly handles the auth user ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Use NEW.id directly instead of auth.uid() since this runs on auth.users
    INSERT INTO public.users (id, email, name, email_verified, created_at)
    VALUES (
        NEW.id,  -- Use the auth user's ID directly
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email_confirmed_at IS NOT NULL,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the users table allows inserts
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT INSERT, UPDATE ON public.users TO anon;