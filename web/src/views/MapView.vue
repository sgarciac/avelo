<script setup lang="ts">
import { LMap, LMarker, LPopup, LTileLayer, LTooltip } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { Bike, CandlestickChart } from 'lucide-vue-next'
import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'
import type { CurrentAvailableSnapshot } from './types'
const zoom = ref(13)
const center = ref([46.8, -71.25])

const stations: Ref<CurrentAvailableSnapshot | undefined> = ref({
  kind: '',
  label: '',
  timestamp: '',
  data: []
})

interface Marker {
  id: string
  title: string
  latLong: [Number, Number]
  bikes: Number | null
  freeDocks: Number | null
  url: string
}

const markers = ref<Marker[]>()

const titleURL = 'https://{s}.osm.gozque.com/{z}/{x}/{y}.png'
// const titleURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

async function initSetup() {
  stations.value = await (
    await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
  ).json()

  markers.value =
    stations.value?.data.map((station) => ({
      id: station.id.toString(),
      title: station.name,
      latLong: [station.lat, station.long],
      bikes: station.bikes,
      freeDocks: station.free_docks,
      url: `/station/${station.id}`
    })) || []
}

onMounted(async () => {
  await initSetup()
})
</script>
<template>
  <l-map
    ref="map"
    v-model:zoom="zoom"
    class="w-full min-h-[600px]"
    :center="center"
    :use-global-leaflet="false"
  >
    <l-tile-layer :url="titleURL" layer-type="base" name="OpenStreetMap"></l-tile-layer>
    <l-marker
      v-for="marker in markers"
      :key="marker.title"
      :lat-lng="marker.latLong"
      :title="marker.title"
      autoPan
    >
      <l-tooltip>{{ marker.title }}</l-tooltip>
      <l-popup>
        <h1>
          <RouterLink :to="marker.url">{{ marker.title }}</RouterLink>
        </h1>
        <div class="flex columns w-[200px] gap-3">
          <div>
            <Bike class="inline align-text-top pb-1" color="black" :size="48" :stroke-width="2" />
            <h2>{{ marker.bikes }}</h2>
            <p>Vélos disponibles</p>
          </div>
          <div>
            <CandlestickChart
              class="inline align-text-top pb-1"
              color="black"
              :size="48"
              :stroke-width="2"
            />
            <h2>{{ marker.freeDocks }}</h2>
            <p>Ancrages disponibles</p>
          </div>
        </div>
      </l-popup>
    </l-marker>
  </l-map>
</template>
