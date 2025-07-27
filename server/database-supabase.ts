import { createServerSupabaseClient } from '../lib/supabase';
import { Database } from '../lib/database.types';

// Server-side Supabase client for API routes
export const supabase = createServerSupabaseClient();

// Type helpers
export type Tables = Database['public']['Tables'];
export type User = Tables['users']['Row'];
export type UserInsert = Tables['users']['Insert'];
export type UserUpdate = Tables['users']['Update'];
export type DotPhrase = Tables['dot_phrases']['Row'];
export type DotPhraseInsert = Tables['dot_phrases']['Insert'];
export type RosNote = Tables['ros_notes']['Row'];
export type RosNoteInsert = Tables['ros_notes']['Insert'];
export type UserPreset = Tables['user_presets']['Row'];
export type UserPresetInsert = Tables['user_presets']['Insert'];
export type TeamGroup = Tables['team_groups']['Row'];
export type TeamGroupInsert = Tables['team_groups']['Insert'];
export type GroupMember = Tables['group_members']['Row'];
export type GroupMemberInsert = Tables['group_members']['Insert'];
export type GroupTodo = Tables['group_todos']['Row'];
export type GroupTodoInsert = Tables['group_todos']['Insert'];
export type GroupEvent = Tables['group_events']['Row'];
export type GroupEventInsert = Tables['group_events']['Insert'];

// Database operations with Supabase
export const userQueries = {
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  },

  async createUser(userData: UserInsert) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, userData: UserUpdate) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const dotPhraseQueries = {
  async getDotPhrasesByUserId(userId: string) {
    const { data, error } = await supabase
      .from('dot_phrases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getPublicDotPhrases() {
    const { data, error } = await supabase
      .from('dot_phrases')
      .select('*')
      .eq('is_public', true)
      .order('import_count', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createDotPhrase(dotPhraseData: DotPhraseInsert) {
    const { data, error } = await supabase
      .from('dot_phrases')
      .insert(dotPhraseData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateDotPhrase(id: number, dotPhraseData: Partial<DotPhraseInsert>) {
    const { data, error } = await supabase
      .from('dot_phrases')
      .update(dotPhraseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteDotPhrase(id: number) {
    const { error } = await supabase
      .from('dot_phrases')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const rosNoteQueries = {
  async getRosNotesByUserId(userId: string) {
    const { data, error } = await supabase
      .from('ros_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createRosNote(rosNoteData: RosNoteInsert) {
    const { data, error } = await supabase
      .from('ros_notes')
      .insert(rosNoteData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteRosNote(id: number) {
    const { error } = await supabase
      .from('ros_notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const userPresetQueries = {
  async getUserPresetsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('user_presets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createUserPreset(presetData: UserPresetInsert) {
    const { data, error } = await supabase
      .from('user_presets')
      .insert(presetData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUserPreset(id: number, presetData: Partial<UserPresetInsert>) {
    const { data, error } = await supabase
      .from('user_presets')
      .update(presetData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteUserPreset(id: number) {
    const { error } = await supabase
      .from('user_presets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const teamGroupQueries = {
  async getTeamGroupsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('team_groups')
      .select(`
        *,
        group_members!inner (
          user_id,
          role,
          joined_at
        )
      `)
      .eq('group_members.user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async createTeamGroup(groupData: TeamGroupInsert) {
    const { data, error } = await supabase
      .from('team_groups')
      .insert(groupData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async joinGroup(groupId: number, userId: string, role: string = 'member') {
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getGroupTodos(groupId: number) {
    const { data, error } = await supabase
      .from('group_todos')
      .select('*')
      .eq('group_id', groupId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createGroupTodo(todoData: GroupTodoInsert) {
    const { data, error } = await supabase
      .from('group_todos')
      .insert(todoData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getGroupEvents(groupId: number) {
    const { data, error } = await supabase
      .from('group_events')
      .select('*')
      .eq('group_id', groupId)
      .order('event_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createGroupEvent(eventData: GroupEventInsert) {
    const { data, error } = await supabase
      .from('group_events')
      .insert(eventData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Helper function to get authenticated user from JWT
export const getAuthenticatedUser = async (request: any): Promise<User | null> => {
  try {
    // Get the authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get the corresponding user record from our users table
    const userData = await userQueries.getUserById(user.id);
    return userData;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
};

export default supabase;