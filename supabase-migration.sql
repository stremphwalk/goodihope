-- AriNote Database Schema Migration for Supabase
-- Run this in your Supabase SQL editor

-- Note: Supabase automatically handles JWT secrets, so we don't need to set them manually

-- Create users table (will integrate with Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    custom_identifier TEXT UNIQUE, -- 4 letters + 2 numbers format
    email_verified BOOLEAN DEFAULT false,
    reset_token TEXT,
    reset_token_expires TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_sessions table (may not be needed with Supabase auth)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create dot_phrases table
CREATE TABLE IF NOT EXISTS public.dot_phrases (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    trigger TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    share_code TEXT UNIQUE,
    is_public BOOLEAN DEFAULT false,
    shared_at TIMESTAMP,
    import_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ros_notes table
CREATE TABLE IF NOT EXISTS public.ros_notes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    patient_name TEXT NOT NULL,
    patient_dob TEXT NOT NULL,
    patient_mrn TEXT NOT NULL,
    selections JSONB NOT NULL,
    medications JSONB NOT NULL DEFAULT '{"homeMedications":[],"hospitalMedications":[]}',
    generated_note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_presets table
CREATE TABLE IF NOT EXISTS public.user_presets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    title TEXT NOT NULL,
    is_favorite BOOLEAN DEFAULT false,
    symptoms JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, title) -- Ensure unique titles per user
);

-- Create team_groups table
CREATE TABLE IF NOT EXISTS public.team_groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by_user_id UUID REFERENCES public.users(id) NOT NULL,
    invite_code TEXT UNIQUE NOT NULL, -- 6-character invite code
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL -- Auto-expire after 7 days
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES public.team_groups(id) NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'creator' or 'member'
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id) -- Prevent duplicate memberships
);

-- Create group_todos table
CREATE TABLE IF NOT EXISTS public.group_todos (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES public.team_groups(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_by_user_id UUID REFERENCES public.users(id) NOT NULL,
    status TEXT DEFAULT 'todo' NOT NULL, -- 'todo' | 'in_progress' | 'review' | 'done'
    position INTEGER DEFAULT 0 NOT NULL, -- Position within status column
    assigned_to_user_id UUID REFERENCES public.users(id),
    completed BOOLEAN DEFAULT false, -- Backward compatibility
    completed_by_user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Create group_events table
CREATE TABLE IF NOT EXISTS public.group_events (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES public.team_groups(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    created_by_user_id UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_custom_identifier ON public.users(custom_identifier);
CREATE INDEX IF NOT EXISTS idx_dot_phrases_user_id ON public.dot_phrases(user_id);
CREATE INDEX IF NOT EXISTS idx_dot_phrases_trigger ON public.dot_phrases(trigger);
CREATE INDEX IF NOT EXISTS idx_ros_notes_user_id ON public.ros_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presets_user_id ON public.user_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_team_groups_invite_code ON public.team_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_todos_group_id ON public.group_todos(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_group_id ON public.group_events(group_id);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dot_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ros_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'email' = email);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Dot phrases policies
CREATE POLICY "Users can view own dot phrases" ON public.dot_phrases
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own dot phrases" ON public.dot_phrases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dot phrases" ON public.dot_phrases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dot phrases" ON public.dot_phrases
    FOR DELETE USING (auth.uid() = user_id);

-- ROS notes policies
CREATE POLICY "Users can view own ros notes" ON public.ros_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ros notes" ON public.ros_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ros notes" ON public.ros_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ros notes" ON public.ros_notes
    FOR DELETE USING (auth.uid() = user_id);

-- User presets policies
CREATE POLICY "Users can view own presets" ON public.user_presets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets" ON public.user_presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets" ON public.user_presets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets" ON public.user_presets
    FOR DELETE USING (auth.uid() = user_id);

-- Team groups policies (more complex - users can see groups they're members of)
CREATE POLICY "Users can view groups they created or are members of" ON public.team_groups
    FOR SELECT USING (
        auth.uid() = created_by_user_id OR
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = team_groups.id AND user_id = auth.uid()
        )
    );

-- Group members policies
CREATE POLICY "Users can view group members for their groups" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
        )
    );

-- Group todos policies
CREATE POLICY "Group members can view todos" ON public.group_todos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = group_todos.group_id AND user_id = auth.uid()
        )
    );

-- Group events policies
CREATE POLICY "Group members can view events" ON public.group_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = group_events.group_id AND user_id = auth.uid()
        )
    );

-- Function to sync Supabase auth users with our users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, name, email_verified, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.email_confirmed_at IS NOT NULL,
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        email_verified = EXCLUDED.email_verified,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record when someone signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow anon users to sign up
GRANT INSERT ON public.users TO anon;