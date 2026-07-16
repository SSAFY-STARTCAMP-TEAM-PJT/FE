export const LOCATION_MAP_CACHE_TTL_MS = 5 * 60 * 1000
export const LOCATION_MAP_CACHE_MAX_ENTRIES = 20

const VIEWPORT_PADDING_RATIO = 0.25
const cache = new Map()
let viewportEntryId = 0

function normalizeFilter(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('ko-KR')
}

function getQueryKey(category, query) {
  return `query:${normalizeFilter(category)}:${normalizeFilter(query)}`
}

function isFresh(entry, now) {
  return now - entry.cachedAt < LOCATION_MAP_CACHE_TTL_MS
}

export function containsLocationBounds(outerBounds, innerBounds) {
  return (
    outerBounds.minLat <= innerBounds.minLat &&
    outerBounds.maxLat >= innerBounds.maxLat &&
    outerBounds.minLng <= innerBounds.minLng &&
    outerBounds.maxLng >= innerBounds.maxLng
  )
}

function touchEntry(key, entry) {
  cache.delete(key)
  cache.set(key, entry)
}

function removeExpiredEntries(now) {
  cache.forEach((entry, key) => {
    if (!isFresh(entry, now)) {
      cache.delete(key)
    }
  })
}

function evictOldestEntries() {
  while (cache.size > LOCATION_MAP_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }
}

export function expandLocationBounds(bounds, paddingRatio = VIEWPORT_PADDING_RATIO) {
  const latitudePadding = (bounds.maxLat - bounds.minLat) * paddingRatio
  const longitudePadding = (bounds.maxLng - bounds.minLng) * paddingRatio

  return {
    minLat: bounds.minLat - latitudePadding,
    maxLat: bounds.maxLat + latitudePadding,
    minLng: bounds.minLng - longitudePadding,
    maxLng: bounds.maxLng + longitudePadding,
  }
}

export function filterLocationsByBounds(locations, bounds) {
  if (!bounds) return locations

  return locations.filter((location) => {
    const latitude = Number(location.latitude)
    const longitude = Number(location.longitude)

    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= bounds.minLat &&
      latitude <= bounds.maxLat &&
      longitude >= bounds.minLng &&
      longitude <= bounds.maxLng
    )
  })
}

export function getCachedMapLocations({ category = '', query = '', bounds, now = Date.now() }) {
  removeExpiredEntries(now)

  const normalizedQuery = normalizeFilter(query)

  if (normalizedQuery) {
    const key = getQueryKey(category, normalizedQuery)
    const entry = cache.get(key)

    if (!entry) return null

    touchEntry(key, entry)
    return {
      locations: entry.locations,
      limitReached: entry.limitReached,
    }
  }

  const normalizedCategory = normalizeFilter(category)
  const entries = Array.from(cache.entries()).reverse()

  for (const [key, entry] of entries) {
    if (
      entry.type === 'viewport' &&
      entry.category === normalizedCategory &&
      bounds &&
      containsLocationBounds(entry.bounds, bounds)
    ) {
      touchEntry(key, entry)
      return {
        locations: filterLocationsByBounds(entry.locations, bounds),
        limitReached: entry.limitReached,
      }
    }
  }

  return null
}

export function setCachedMapLocations({
  category = '',
  query = '',
  bounds = null,
  locations,
  limitReached = false,
  now = Date.now(),
}) {
  const normalizedQuery = normalizeFilter(query)
  const normalizedCategory = normalizeFilter(category)
  let key
  let entry

  if (normalizedQuery) {
    key = getQueryKey(normalizedCategory, normalizedQuery)
    entry = {
      type: 'query',
      category: normalizedCategory,
      query: normalizedQuery,
      locations,
      limitReached,
      cachedAt: now,
    }
  } else {
    if (!bounds) return

    viewportEntryId += 1
    key = `viewport:${normalizedCategory}:${viewportEntryId}`
    entry = {
      type: 'viewport',
      category: normalizedCategory,
      bounds,
      locations,
      limitReached,
      cachedAt: now,
    }
  }

  touchEntry(key, entry)
  evictOldestEntries()
}

export function clearLocationMapCache() {
  cache.clear()
  viewportEntryId = 0
}

export function getLocationMapCacheSize() {
  return cache.size
}
