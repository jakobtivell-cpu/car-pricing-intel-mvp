export function createNoopStorage() {
  return {
    getItem(_name: string) {
      return null
    },
    setItem(_name: string, _value: string) {},
    removeItem(_name: string) {}
  }
}

export const safeLocalStorage = () => {
  if (typeof window === 'undefined') return createNoopStorage()
  return window.localStorage
}
