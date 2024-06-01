import { reactive, ref, watch, type Ref } from 'vue'

// get a references to a Set persisted in local storage, initializing it if it
// does not exist.
export function initPersistedSet(name: string): Set<number> {
  const favoritesString = localStorage.getItem(name)
  let set: Set<number>
  if (favoritesString) {
    set = reactive(new Set(JSON.parse(favoritesString)))
  } else {
    set = reactive(new Set())
  }
  watch(set, (newSet: Set<number>) => {
    localStorage.setItem(name, JSON.stringify(Array.from(newSet)))
  })
  return set
}

// bind a boolean reference to the presence of an item in a persisted set
export function bindItemToPersistedSet(id: number, ref: Ref<boolean>, set: Set<number>) {
  if (set.has(id)) {
    ref.value = true
  }
  watch(ref, (newVal: boolean) => {
    if (newVal) {
      set.add(id)
    } else {
      set.delete(id)
    }
  })
}

// get a reference to a persisted boolean
export function initPersistedBoolean(name: string): Ref<boolean> {
  const flag = ref(localStorage.getItem(name) === 'true')
  watch(flag, (newFlag: boolean) => localStorage.setItem(name, newFlag ? 'true' : 'false'))
  return flag
}
