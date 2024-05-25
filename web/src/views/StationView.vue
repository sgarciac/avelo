<template>
  <h3 v-if="stationInfo">{{ stationInfo.name }}</h3>
  <div>Ce site n'est pas affilié à àVélo.</div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { CurrentAvailableEntry, CurrentAvailableSnapshot } from './types'

const route = useRoute()
const stationInfo: Ref<CurrentAvailableEntry | null> = ref(null)
console.log(route.params.id)
watch(
  () => route.params.id,
  async (newId) => {
    console.log('uh?')
    const currentAvailabilitySnapshot: CurrentAvailableSnapshot = await (
      await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
    ).json()
    stationInfo.value = currentAvailabilitySnapshot.data[Number(newId)]
    console.log(stationInfo.value)
  }
)

onMounted(async () => {
  const currentAvailabilitySnapshot: CurrentAvailableSnapshot = await (
    await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
  ).json()
  stationInfo.value = currentAvailabilitySnapshot.data[Number(route.params.id)]
})
</script>
<style></style>
