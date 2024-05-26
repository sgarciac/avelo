<template>
  <h3 v-if="stationInfo">{{ stationInfo.name }} {{ stationInfo.id }}</h3>
  <div>...</div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { CurrentAvailableEntry, CurrentAvailableSnapshot } from './types'

const route = useRoute()
const stationInfo: Ref<CurrentAvailableEntry | null> = ref(null)
watch(
  () => route.params.id,
  async (newId) => {
    console.log('uh?', newId)
    const currentAvailabilitySnapshot: CurrentAvailableSnapshot = await (
      await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
    ).json()
    stationInfo.value =
      currentAvailabilitySnapshot.data.find((entry) => entry.id === Number(newId)) || null
  }
)

onMounted(async () => {
  const currentAvailabilitySnapshot: CurrentAvailableSnapshot = await (
    await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
  ).json()
  console.log(' what :' + Number(route.params.id))
  console.log(currentAvailabilitySnapshot.data)
  stationInfo.value =
    currentAvailabilitySnapshot.data.find((entry) => entry.id === Number(route.params.id)) || null
  console.log(stationInfo.value)
})
</script>
<style></style>
