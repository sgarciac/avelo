<script setup lang="ts">
import { LIcon, LMap, LMarker, LPopup, LTileLayer, LTooltip } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { Bike, ParkingCircle } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
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
  stationUrl: string
}

const markers = ref<Marker[]>()
const titleURL = 'https://{s}.osm.gozque.com/{z}/{x}/{y}.png'

const markerUrl = (bikes: number | null, freeDocks: number | null): string => {
  const percent =
    !bikes || freeDocks === null
      ? 0
      : Math.floor(Math.round(((bikes / (bikes + freeDocks)) * 100) / 10) * 10)

  return `src/assets/markers/marker-${percent}.svg`
}

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
      url: markerUrl(station.bikes, station.free_docks),
      stationUrl: `/station/${station.id}`
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
    class="leaflet-map w-full"
    :center="center"
    :use-global-leaflet="false"
  >
    <l-tile-layer :url="titleURL" layer-type="base" name="OpenStreetMap"></l-tile-layer>
    <l-marker
      v-for="marker in markers"
      class="marker"
      :key="marker.title"
      :lat-lng="marker.latLong"
      :title="marker.title"
    >
      <l-icon
        :icon-url="marker.url"
        :icon-size="[42, 42]"
        :icon-anchor="[32, 42]"
        :popup-anchor="[0, -42]"
      />
      <l-tooltip>{{ marker.title }}</l-tooltip>
      <l-popup>
        <h1 class="text-lg mb-3 text-center">
          <RouterLink :to="marker.stationUrl">{{ marker.title }}</RouterLink>
        </h1>
        <div class="flex columns gap-3">
          <div class="basis-[50%] text-center">
            <Bike class="inline align-text-top pb-1" color="black" :size="40" :stroke-width="2" />
            <h2 class="text-xl font-bold color-[#374167]">{{ marker.bikes }}</h2>
            <p>Vélos<br />disponibles</p>
          </div>
          <div class="basis-[50%] text-center">
            <ParkingCircle
              class="inline align-text-top pb-1"
              color="black"
              :size="40"
              :stroke-width="2"
            />
            <h2 class="text-xl font-bold color-[#374167]">{{ marker.freeDocks }}</h2>
            <p>Ancrages disponibles</p>
          </div>
        </div>
      </l-popup>
    </l-marker>
  </l-map>
</template>
<style scoped>
.leaflet-map {
  min-height: 500px;
}

@media (min-device-height: 1000px) {
  .leaflet-map {
    min-height: 700px;
  }
}

.leaflet-container a.leaflet-popup-close-button {
  font-size: 24px;
  top: 3px;
  right: 5px;
}

.leaflet-popup-content p {
  margin: 0.6rem;
}
</style>
