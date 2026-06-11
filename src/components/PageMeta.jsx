import { useEffect } from 'react'
import { APP_NAME } from '../config/brand'

/** Sets document title and meta description for SEO (SPA). */
export default function PageMeta({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME
    const prevTitle = document.title
    document.title = fullTitle

    let meta = document.querySelector('meta[name="description"]')
    const created = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    const prevDesc = meta.getAttribute('content')
    if (description) meta.setAttribute('content', description)

    return () => {
      document.title = prevTitle
      if (description) {
        if (created) meta.remove()
        else if (prevDesc != null) meta.setAttribute('content', prevDesc)
      }
    }
  }, [title, description])

  return null
}
