import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../components/AuthProvider'

// Built-in dot phrases (same as main app)
const BUILT_IN_PHRASES = [
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

export interface DotPhrase {
  id?: number
  trigger: string
  content: string
  description?: string
  category?: string
  shareCode?: string
  isPublic?: boolean
}

const API_BASE_URL = (window as any).electronEnv?.REACT_APP_API_URL || 'http://localhost:5001'

export function useDotPhrases() {
  const { idToken, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const fetchDotPhrases = async (): Promise<DotPhrase[]> => {
    if (!isAuthenticated || !idToken) {
      return []
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

    return response.json()
  }

  const createDotPhrase = async (phraseData: Omit<DotPhrase, 'id'>): Promise<DotPhrase> => {
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

    return response.json()
  }

  const updateDotPhrase = async ({ id, ...phraseData }: DotPhrase): Promise<DotPhrase> => {
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

    return response.json()
  }

  const deleteDotPhrase = async (id: number): Promise<void> => {
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
  }

  // Queries
  const {
    data: dotPhrases,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dotPhrases'],
    queryFn: fetchDotPhrases,
    enabled: isAuthenticated && !!idToken,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createDotPhrase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dotPhrases'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateDotPhrase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dotPhrases'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDotPhrase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dotPhrases'] })
    },
  })

  return {
    dotPhrases: dotPhrases || [],
    builtInPhrases: BUILT_IN_PHRASES,
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