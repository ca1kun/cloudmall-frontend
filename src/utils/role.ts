import type { RouteLocationNormalizedLoaded } from 'vue-router'

export type AppRole = 'MERCHANT' | 'CUSTOMER'

export interface RoleRouteMeta {
  roles?: string[]
}

export interface RoleRouteRecord {
  path: string
  meta?: RoleRouteMeta & Record<string, any>
  children?: RoleRouteRecord[]
}

const ROLE_HOME_PATH: Record<AppRole, string> = {
  MERCHANT: '/merchant/home',
  CUSTOMER: '/mall/home',
}

const ROLE_PROFILE_PATH: Record<AppRole, string> = {
  MERCHANT: '/merchant/profile',
  CUSTOMER: '/mall/profile',
}

export function normalizeRole(role?: string | null): AppRole | '' {
  if (!role) return ''
  const normalized = role.toUpperCase() as AppRole
  return normalized in ROLE_HOME_PATH ? normalized : ''
}

export function getRoleHomePath(role?: string | null) {
  const normalized = normalizeRole(role)
  return normalized ? ROLE_HOME_PATH[normalized] : '/login'
}

export function getRoleProfilePath(role?: string | null) {
  const normalized = normalizeRole(role)
  return normalized ? ROLE_PROFILE_PATH[normalized] : '/login'
}

export function canAccessPath(role?: string | null, path = '') {
  const normalized = normalizeRole(role)
  if (!normalized) return false

  if (normalized === 'CUSTOMER') {
    return path === '/login' || path.startsWith('/mall')
  }

  return path === '/login' || path.startsWith('/merchant')
}

export function canAccessRoute(role?: string | null, route?: RoleRouteRecord) {
  const normalized = normalizeRole(role)
  if (!normalized || !route) return false

  const allowedRoles = route.meta?.roles
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    return allowedRoles.includes(normalized)
  }

  return canAccessPath(normalized, route.path)
}

export function filterRoutesByRole<T extends RoleRouteRecord>(routes: T[], role?: string | null): T[] {
  return routes.reduce<T[]>((result, route) => {
    if (!canAccessRoute(role, route)) {
      return result
    }

    const nextRoute = { ...route }
    if (Array.isArray(route.children) && route.children.length > 0) {
      const children = filterRoutesByRole(route.children, role)
      if (children.length > 0) {
        nextRoute.children = children
      } else {
        delete nextRoute.children
      }
    }

    result.push(nextRoute as T)
    return result
  }, [])
}

export function canAccessCurrentRoute(role?: string | null, to?: RouteLocationNormalizedLoaded) {
  if (!to) return false

  const normalized = normalizeRole(role)
  if (!normalized) return false

  const metaRoles = (to.meta as RoleRouteMeta | undefined)?.roles
  if (Array.isArray(metaRoles) && metaRoles.length > 0) {
    return metaRoles.includes(normalized)
  }

  return canAccessPath(normalized, to.path)
}
