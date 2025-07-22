import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../components/AuthProvider'
import { useMemo, useCallback } from 'react'
import { apiResponseCache } from '../lib/intelligentCache'

// Optimized version of the dot phrases hook with intelligent caching
export interface DotPhrase {
  id?: number
  trigger: string
  content: string
  description?: string
  category?: string
  shareCode?: string
  isPublic?: boolean
}

// Built-in phrases cached in memory
const BUILT_IN_PHRASES_CACHE = [
  {
    trigger: '/dm2',
    content: 'DM2\n- Traitement actuel :\n- A1c :\n- RAC :',
    description: 'Diabetes Mellitus Type 2 template',
    category: 'endocrine'
  },
  {
    trigger: '/plan',
    content: 'The patient will be started on [[Tazocin|Ceftriaxone|Meropenem]] for [[5 days|7 days|10 days]].',
    description: 'Treatment plan with options',
    category: 'general'
  },
  {
    trigger: '/date',
    content: '[[DATE]]',
    description: 'Insert current date',
    category: 'general'
  },
  {
    trigger: '/calc',
    content: '[[CALC]]',
    description: 'Open calculation modal',
    category: 'general'
  },
  {
    trigger: '/chest',
    content: 'Chest: [[Clear to auscultation bilaterally|Decreased air entry|Wheeze noted|Crackles noted]]',
    description: 'Chest examination findings',
    category: 'respiratory'
  },
  {
    trigger: '/heart',
    content: 'Heart: [[Regular rate and rhythm|Irregular rhythm|Murmur noted|S3 gallop]], no murmurs',
    description: 'Cardiac examination findings',
    category: 'cardiac'
  },
  {
    trigger: '/neuro',
    content: 'Neurological: [[Alert and oriented x3|Confused|Lethargic]], [[normal reflexes|hyperreflexic|hyporeflexic]]',
    description: 'Neurological examination',
    category: 'neurological'
  },
  {
    trigger: '/allergies',
    content: 'Allergies: [[NKDA|Penicillin|Sulfa|Other - see chart]]',
    description: 'Allergy information',
    category: 'general'
  }
]

// Get API URL from electron environment or fallback
const getApiUrl = () => {
  if (typeof window !== 'undefined' && 'electronEnv' in window && window.electronEnv) {
    return window.electronEnv.REACT_APP_API_URL
  }
  return 'http://localhost:5001'
}

const API_BASE_URL = getApiUrl()

export function useOptimizedDotPhrases() {
  const { idToken, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  // Optimized fetch function with caching
  const fetchDotPhrases = useCallback(async (): Promise<DotPhrase[]> => {
    if (!isAuthenticated || !idToken) {
      return []
    }

    const cacheKey = `dot-phrases-${idToken}`
    
    // Check cache first
    const cached = apiResponseCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const response = await fetch(`${API_BASE_URL}/api/dot-phrases`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dot phrases')
    }

    const data = await response.json()
    
    // Cache the response
    apiResponseCache.set(cacheKey, data, 300000) // 5 minute cache
    
    return data
  }, [idToken, isAuthenticated])

  // Debounced API operations to prevent excessive calls
  const createDotPhrase = useCallback(async (phraseData: Omit<DotPhrase, 'id'>): Promise<DotPhrase> => {
    if (!isAuthenticated || !idToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE_URL}/api/dot-phrases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(phraseData),
    })

    if (!response.ok) {
      throw new Error('Failed to create dot phrase')
    }

    const result = await response.json()
    
    // Invalidate cache
    const cacheKey = `dot-phrases-${idToken}`
    apiResponseCache.delete(cacheKey)
    
    return result
  }, [idToken, isAuthenticated])

  const updateDotPhrase = useCallback(async ({ id, ...phraseData }: DotPhrase): Promise<DotPhrase> => {
    if (!isAuthenticated || !idToken || !id) {
      throw new Error('Not authenticated or missing ID')
    }

    const response = await fetch(`${API_BASE_URL}/api/dot-phrases/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(phraseData),
    })

    if (!response.ok) {
      throw new Error('Failed to update dot phrase')
    }

    const result = await response.json()
    
    // Invalidate cache
    const cacheKey = `dot-phrases-${idToken}`
    apiResponseCache.delete(cacheKey)
    
    return result
  }, [idToken, isAuthenticated])

  const deleteDotPhrase = useCallback(async (id: number): Promise<void> => {
    if (!isAuthenticated || !idToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE_URL}/api/dot-phrases/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to delete dot phrase')
    }

    // Invalidate cache
    const cacheKey = `dot-phrases-${idToken}`
    apiResponseCache.delete(cacheKey)
  }, [idToken, isAuthenticated])

  // Optimized query with intelligent caching
  const {
    data: dotPhrases,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dotPhrases', idToken],
    queryFn: fetchDotPhrases,
    enabled: isAuthenticated && !!idToken,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary API calls
    refetchOnMount: false,
  })

  // Memoized mutations with optimistic updates
  const createMutation = useMutation<DotPhrase, Error, Omit<DotPhrase, 'id'>>({
    mutationFn: createDotPhrase,
    onMutate: async (newPhrase: Omit<DotPhrase, 'id'>) => {
      await queryClient.cancelQueries({ queryKey: ['dotPhrases', idToken] });
      const previousPhrases = queryClient.getQueryData<DotPhrase[]>(['dotPhrases', idToken]) || [];
      queryClient.setQueryData(['dotPhrases', idToken], [...previousPhrases, { ...newPhrase, id: Date.now() }]);
      return { previousPhrases };
    },
    onError: (_err, _newPhrase, context) => {
      const typedContext = context as { previousPhrases: DotPhrase[] } | undefined;
      if (typedContext?.previousPhrases) {
        queryClient.setQueryData(['dotPhrases', idToken], typedContext.previousPhrases);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dotPhrases', idToken] });
    },
  });

  const updateMutation = useMutation<DotPhrase, Error, DotPhrase>({
    mutationFn: updateDotPhrase,
    onMutate: async (updatedPhrase: DotPhrase) => {
      await queryClient.cancelQueries({ queryKey: ['dotPhrases', idToken] });
      const previousPhrases = queryClient.getQueryData<DotPhrase[]>(['dotPhrases', idToken]) || [];
      queryClient.setQueryData(['dotPhrases', idToken], previousPhrases.map(phrase => phrase.id === updatedPhrase.id ? updatedPhrase : phrase));
      return { previousPhrases };
    },
    onError: (_err, _updatedPhrase, context) => {
      const typedContext = context as { previousPhrases: DotPhrase[] } | undefined;
      if (typedContext?.previousPhrases) {
        queryClient.setQueryData(['dotPhrases', idToken], typedContext.previousPhrases);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dotPhrases', idToken] });
    },
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: deleteDotPhrase,
    onMutate: async (deletedId: number) => {
      await queryClient.cancelQueries({ queryKey: ['dotPhrases', idToken] });
      const previousPhrases = queryClient.getQueryData<DotPhrase[]>(['dotPhrases', idToken]) || [];
      queryClient.setQueryData(['dotPhrases', idToken], previousPhrases.filter(phrase => phrase.id !== deletedId));
      return { previousPhrases };
    },
    onError: (_err, _deletedId, context) => {
      const typedContext = context as { previousPhrases: DotPhrase[] } | undefined;
      if (typedContext?.previousPhrases) {
        queryClient.setQueryData(['dotPhrases', idToken], typedContext.previousPhrases);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dotPhrases', idToken] });
    },
  });

  // Memoized built-in phrases
  const builtInPhrases = useMemo(() => BUILT_IN_PHRASES_CACHE, [])

  // Memoized combined phrases for better performance
  const allPhrases = useMemo(() => {
    return [...builtInPhrases, ...(dotPhrases ?? [])]
  }, [builtInPhrases, dotPhrases])

  return {
    dotPhrases: dotPhrases || [],
    builtInPhrases,
    allPhrases,
    isLoading,
    error,
    createDotPhrase: createMutation.mutate,
    updateDotPhrase: updateMutation.mutate,
    deleteDotPhrase: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}