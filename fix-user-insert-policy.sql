-- Fix missing INSERT policy for users table
-- This allows the trigger to create new user records when someone signs up

-- Add INSERT policy for users table (needed for the trigger)
CREATE POLICY "Allow user creation via trigger" ON public.users
    FOR INSERT WITH CHECK (true);

-- Also ensure the trigger function has proper permissions
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT INSERT, UPDATE ON public.users TO anon;

-- Make sure the function can be executed by the trigger
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;