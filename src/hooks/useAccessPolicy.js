import { useState, useEffect } from 'react'
import { apiFetch, parseJsonResponse } from '../utils/fetchApi'

let cache = null

export function useAccessPolicy() {
  const [policy, setPolicy] = useState(
    () => cache || { loading: !cache, documentIdOnlyAccess: false, recoveryPasswordEnabled: true },
  )

  useEffect(() => {
    if (cache) {
      setPolicy({ ...cache, loading: false })
      return
    }

    apiFetch('/api/health')
      .then((r) => parseJsonResponse(r))
      .then((data) => {
        cache = {
          documentIdOnlyAccess: Boolean(data.documentIdOnlyAccess),
          recoveryPasswordEnabled: data.recoveryPasswordEnabled !== false,
        }
        setPolicy({ ...cache, loading: false })
      })
      .catch(() => {
        setPolicy({ documentIdOnlyAccess: false, recoveryPasswordEnabled: true, loading: false })
      })
  }, [])

  return policy
}
