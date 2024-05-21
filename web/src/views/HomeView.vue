<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import relativeTime from 'dayjs/plugin/relativeTime'
import { onMounted, ref, type Ref } from 'vue'
dayjs.extend(relativeTime)
dayjs.locale('fr')

interface CurrentAvailableSnapshot {
  kind: string
  label: string
  timestamp: string
  data: CurrentAvailableEntry[]
}

interface CurrentAvailableEntry {
  name: string
  id: number
  bikes?: number
  free_docks?: number
}

const stations: Ref<CurrentAvailableSnapshot | undefined> = ref({
  kind: '',
  label: '',
  timestamp: '',
  data: []
})
onMounted(async () => {
  stations.value = await (
    await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
  ).json()
})
</script>

<template>
  <div class="flex flex-col items-center">
    <div v-if="stations != null" class="prose-sm">
      Dernière actualisation {{ dayjs(stations.timestamp).fromNow() }}
    </div>
    <table class="table">
      <!-- head -->
      <thead>
        <tr>
          <th>Nom</th>
          <th>Vélos disponibles</th>
          <th>Ancrages disponibles</th>
        </tr>
      </thead>
      <tbody>
        <!-- row 1 -->
        <tr v-for="station in stations?.data" :key="station.name">
          <th>{{ station.name }}</th>
          <td
            :class="{
              'bg-warning': station.bikes != null && station.bikes <= 3 && station.bikes > 0,
              'bg-error': station.bikes != null && station.bikes === 0
            }"
          >
            {{ station.bikes ?? '-' }}
          </td>
          <td
            :class="{
              'bg-warning':
                station.free_docks != null && station.free_docks <= 3 && station.free_docks > 0,
              'bg-error': station.free_docks != null && station.free_docks === 0
            }"
          >
            {{ station.free_docks ?? '-' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped></style>
