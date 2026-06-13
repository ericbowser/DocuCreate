import { useEffect } from 'react'
import { APP_NAME } from '../config/brand'

function upsertLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  const created = !el
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  const previous = el.getAttribute('href')
  el.setAttribute('href', href)
  return { el, created, previous }
}

function upsertMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  const created = !el
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  const previous = el.getAttribute('content')
  el.setAttribute('content', content)
  return { el, created, previous }
}

function restoreLink({ el, created, previous }) {
  if (created) el.remove()
  else if (previous != null) el.setAttribute('href', previous)
  else el.removeAttribute('href')
}

function restoreMeta({ el, created, previous }) {
  if (created) el.remove()
  else if (previous != null) el.setAttribute('content', previous)
  else el.removeAttribute('content')
}

/** Sets document title, meta description, canonical URL, and robots for SEO (SPA). */
export default function PageMeta({ title, description, canonical, noindex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME
    const prevTitle = document.title
    document.title = fullTitle

    const descMeta = description ? upsertMeta('description', description) : null
    const canonLink = canonical ? upsertLink('canonical', canonical) : null
    const robotsMeta = noindex ? upsertMeta('robots', 'noindex, follow') : null

    return () => {
      document.title = prevTitle
      if (descMeta) restoreMeta(descMeta)
      if (canonLink) restoreLink(canonLink)
      if (robotsMeta) restoreMeta(robotsMeta)
    }
  }, [title, description, canonical, noindex])

  return null
}
