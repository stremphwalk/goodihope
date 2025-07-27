import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { CustomDotPhrase } from '@/components/DotPhraseManager';

// Note: This is a module-level function that can't access hooks
// We'll need to pass the token from the hook functions
const getApiHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { 'Authorization': `Bearer ${token}` }),
});

const dotPhrasesAPI = {
  async getAll(token: string): Promise<CustomDotPhrase[]> {
    const response = await fetch('/api/dot-phrases', {
      headers: getApiHeaders(token),
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch dot phrases');
    }
    const data = await response.json();
    return data.map((phrase: any) => ({
      ...phrase,
      createdAt: new Date(phrase.createdAt),
      updatedAt: new Date(phrase.updatedAt),
      sharedAt: phrase.sharedAt ? new Date(phrase.sharedAt) : undefined
    }));
  },

  async create(phrase: Omit<CustomDotPhrase, 'id' | 'createdAt' | 'updatedAt'>, token: string): Promise<CustomDotPhrase> {
    const response = await fetch('/api/dot-phrases', {
      method: 'POST',
      headers: getApiHeaders(token),
      credentials: 'include',
      body: JSON.stringify(phrase),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create dot phrase');
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  },

  async update(id: string, phrase: Partial<CustomDotPhrase>, token: string): Promise<CustomDotPhrase> {
    const response = await fetch(`/api/dot-phrases/${id}`, {
      method: 'PUT',
      headers: getApiHeaders(token),
      credentials: 'include',
      body: JSON.stringify(phrase),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update dot phrase');
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  },

  async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`/api/dot-phrases/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(token),
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete dot phrase');
    }
  },

  // Sharing API methods
  async share(id: string, token: string): Promise<{ shareCode: string; isPublic: boolean; sharedAt: Date; importCount: number }> {
    const response = await fetch(`/api/dot-phrases/${id}/share`, {
      method: 'POST',
      headers: getApiHeaders(token),
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to share dot phrase');
    }
    const data = await response.json();
    return {
      ...data,
      sharedAt: new Date(data.sharedAt)
    };
  },

  async getShared(shareCode: string): Promise<CustomDotPhrase> {
    const response = await fetch(`/api/dot-phrases/shared/${shareCode}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch shared dot phrase');
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      sharedAt: data.sharedAt ? new Date(data.sharedAt) : undefined
    };
  },

  async import(shareCode: string, customTrigger: string | undefined, token: string): Promise<{ dotPhrase: CustomDotPhrase; importedFrom: { shareCode: string; originalTrigger: string } }> {
    const response = await fetch(`/api/dot-phrases/import/${shareCode}`, {
      method: 'POST',
      headers: getApiHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ customTrigger }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import dot phrase');
    }
    const data = await response.json();
    return {
      ...data,
      dotPhrase: {
        ...data.dotPhrase,
        createdAt: new Date(data.dotPhrase.createdAt),
        updatedAt: new Date(data.dotPhrase.updatedAt)
      }
    };
  },

  async getPopular(limit: number = 10): Promise<CustomDotPhrase[]> {
    const response = await fetch(`/api/dot-phrases/shared/popular?limit=${limit}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch popular shared phrases');
    }
    const data = await response.json();
    return data.map((phrase: any) => ({
      ...phrase,
      createdAt: new Date(phrase.createdAt),
      updatedAt: new Date(phrase.updatedAt),
      sharedAt: phrase.sharedAt ? new Date(phrase.sharedAt) : undefined
    }));
  },
};

export const DOT_PHRASES_QUERY_KEY = 'dot-phrases';

export function useDotPhrases() {
  const auth = useAuth();
  
  return useQuery({
    queryKey: [DOT_PHRASES_QUERY_KEY],
    queryFn: () => {
      if (!auth.user?.id_token) {
        throw new Error('Authentication token not available');
      }
      return dotPhrasesAPI.getAll(auth.user.id_token);
    },
    enabled: auth.isAuthenticated && !!auth.user?.id_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCreateDotPhrase() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (phrase: Omit<CustomDotPhrase, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!auth.isAuthenticated || !auth.user?.id_token) {
        throw new Error('Authentication required');
      }
      return dotPhrasesAPI.create(phrase, auth.user.id_token);
    },
    onSuccess: (newPhrase) => {
      queryClient.setQueryData([DOT_PHRASES_QUERY_KEY], (oldData: CustomDotPhrase[] | undefined) => {
        return oldData ? [...oldData, newPhrase] : [newPhrase];
      });
    },
  });
}

export function useUpdateDotPhrase() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, phrase }: { id: string; phrase: Partial<CustomDotPhrase> }) => {
      if (!auth.isAuthenticated || !auth.user?.id_token) {
        throw new Error('Authentication required');
      }
      return dotPhrasesAPI.update(id, phrase, auth.user.id_token);
    },
    onSuccess: (updatedPhrase) => {
      queryClient.setQueryData([DOT_PHRASES_QUERY_KEY], (oldData: CustomDotPhrase[] | undefined) => {
        return oldData ? oldData.map(p => p.id === updatedPhrase.id ? updatedPhrase : p) : [updatedPhrase];
      });
    },
  });
}

export function useDeleteDotPhrase() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!auth.isAuthenticated || !auth.user?.id_token) {
        throw new Error('Authentication required');
      }
      return dotPhrasesAPI.delete(id, auth.user.id_token);
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData([DOT_PHRASES_QUERY_KEY], (oldData: CustomDotPhrase[] | undefined) => {
        return oldData ? oldData.filter(p => p.id !== deletedId) : [];
      });
    },
  });
}

// Sharing hooks
export function useShareDotPhrase() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!auth.isAuthenticated || !auth.user?.id_token) {
        throw new Error('Authentication required');
      }
      return dotPhrasesAPI.share(id, auth.user.id_token);
    },
    onSuccess: (shareData, phraseId) => {
      // Update the phrase in the cache with sharing info
      queryClient.setQueryData([DOT_PHRASES_QUERY_KEY], (oldData: CustomDotPhrase[] | undefined) => {
        return oldData ? oldData.map(p => 
          p.id === phraseId 
            ? { ...p, shareCode: shareData.shareCode, isPublic: shareData.isPublic, sharedAt: shareData.sharedAt, importCount: shareData.importCount }
            : p
        ) : [];
      });
    },
  });
}

export function useGetSharedDotPhrase(shareCode: string | null) {
  return useQuery({
    queryKey: ['shared-dot-phrase', shareCode],
    queryFn: () => {
      if (!shareCode) {
        throw new Error('Share code is required');
      }
      return dotPhrasesAPI.getShared(shareCode);
    },
    enabled: !!shareCode,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useImportDotPhrase() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ shareCode, customTrigger }: { shareCode: string; customTrigger?: string }) => {
      if (!auth.isAuthenticated || !auth.user?.id_token) {
        throw new Error('Authentication required');
      }
      return dotPhrasesAPI.import(shareCode, customTrigger, auth.user.id_token);
    },
    onSuccess: (importData) => {
      // Add the imported phrase to the cache
      queryClient.setQueryData([DOT_PHRASES_QUERY_KEY], (oldData: CustomDotPhrase[] | undefined) => {
        return oldData ? [...oldData, importData.dotPhrase] : [importData.dotPhrase];
      });
    },
  });
}

export function usePopularDotPhrases(limit: number = 10) {
  return useQuery({
    queryKey: ['popular-dot-phrases', limit],
    queryFn: () => dotPhrasesAPI.getPopular(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}