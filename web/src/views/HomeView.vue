<script setup lang="ts">
import {
  Chart as ChartJS,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  type ChartOptions
} from 'chart.js'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import debounce from 'lodash/debounce'
import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { Line } from 'vue-chartjs'
import { initPersistedBoolean, initPersistedSet } from './storage'
import type { CurrentAvailableSnapshot } from './types'
dayjs.extend(utc)
dayjs.extend(relativeTime)
dayjs.locale('fr')
ChartJS.register(TimeScale, Title, PointElement, LinearScale, LineElement)

const supportsGeolocation = 'geolocation' in navigator

const chartOptions: ChartOptions<'line'> = {
  responsive: false,
  elements: {
    line: {
      borderColor: '#000000',
      borderWidth: 1
    },
    point: {
      radius: 0
    }
  },
  scales: {
    x: {
      type: 'time',
      grid: {
        display: false
      },
      ticks: {
        display: true,
        font: {
          size: 8
        }
      }
    },
    y: {
      min: 0,
      suggestedMax: 20,
      grid: {
        display: false
      },
      ticks: {
        display: true,
        font: { size: 8 }
      }
    }
  }
}

// The list of all stations with the current availabilities
const stations: Ref<CurrentAvailableSnapshot | undefined> = ref({
  kind: '',
  label: '',
  timestamp: '',
  data: []
})

// The availability data for each station for the last 24 hours,
// already processed as a list of points for the chart
const availabilityData: Ref<{
  [stationId: number]: {
    bikes: { x: string; y: number | null }[]
    free_docks: { x: string; y: number | null }[]
  }
}> = ref({})

const pageSize = 5
const favorites = initPersistedSet('favorites')

const sortByDistance = initPersistedBoolean('sortByDistance')
const favoritesOnly = initPersistedBoolean('favoritesOnly')

const latitude: Ref<number | null> = ref(null)
const longitude: Ref<number | null> = ref(null)
const filter: Ref<string> = ref('')
const debouncedFilter: Ref<string> = ref('')
const page: Ref<number> = ref(0)
const pageCount = computed(() =>
  filteredAndSortedStations.value == null
    ? 0
    : Math.ceil(filteredAndSortedStations.value.length / pageSize)
)
const distanceMap: Ref<{ [stationId: number]: number }> = ref({})

watch(
  filter,
  debounce(() => {
    debouncedFilter.value = filter.value
    page.value = 0
  }, 300)
)

const filteredAndSortedStations = computed(() => {
  if (stations.value == null) return null
  let filteredStations = stations.value.data.filter(
    (station) =>
      availabilityData.value[station.id]?.bikes != null &&
      (!favoritesOnly.value || favorites.has(station.id)) &&
      (debouncedFilter.value === '' ||
        station.name.toLowerCase().includes(debouncedFilter.value.toLowerCase()))
  )
  if (
    sortByDistance.value &&
    latitude.value != null &&
    longitude.value != null &&
    distanceMap.value
  ) {
    return filteredStations.sort((a, b) => {
      return distanceMap.value[a.id] - distanceMap.value[b.id]
    })
  } else {
    return filteredStations.sort((a, b) => {
      if (a.name === b.name) return 0
      if (a.name < b.name) return -1
      return 1
    })
  }
})

const currentPage = computed(() => {
  return filteredAndSortedStations.value?.slice(
    page.value * pageSize,
    page.value * pageSize + pageSize
  )
})

function getEdtDate(date: Date) {
  var utc = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utc - 4 * 60 * 60 * 1000)
}

onMounted(async () => {
  await initSetup()
})

async function initSetup() {
  stations.value = await (
    await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
  ).json()

  let availability24Hours: {
    data: {
      [station: number]: { bikes: number | null; free_docks: number | null; timestamp: string }[]
    }
  } = await (
    await fetch('https://snapshots.avelytique.gozque.com/past-24h-station-availability.json')
  ).json()

  let availabilityDataTemporal: {
    [stationId: number]: {
      bikes: { x: string; y: number | null }[]
      free_docks: { x: string; y: number | null }[]
    }
  } = {}

  for (const station_id in availability24Hours.data) {
    let currentTimeEdt = getEdtDate(new Date())
    const data = availability24Hours.data[station_id]

    // get the latest availability of previous date, to add a fabricated first point of the day
    let lastOfPrevious = [...data].reverse().find((entry, i) => {
      let tsEdt = getEdtDate(new Date(entry.timestamp))
      return tsEdt.getDate() != currentTimeEdt.getDate()
    })

    let filteredData = data.filter((entry, i) => {
      let tsEdt = getEdtDate(new Date(entry.timestamp))
      return tsEdt.getDate() == currentTimeEdt.getDate()
    })

    if (lastOfPrevious) {
      let currentTimeEdt = getEdtDate(new Date())
      let startOfDay = dayjs.utc(dayjs(currentTimeEdt).format('YYYY-MM-DDT04:00:01')).toDate()
      console.log(startOfDay)
      filteredData = [
        {
          timestamp: startOfDay.toISOString(),
          bikes: lastOfPrevious.bikes,
          free_docks: lastOfPrevious.free_docks
        },
        ...filteredData
      ]
    }

    availabilityDataTemporal[station_id] = {
      bikes: filteredData.map((entry) => ({ x: entry.timestamp, y: entry.bikes })),
      free_docks: filteredData.map((entry) => ({
        x: entry.timestamp,
        y: entry.free_docks
      }))
    }
  }

  availabilityData.value = availabilityDataTemporal

  watch(sortByDistance, async () => {
    if (sortByDistance.value) {
      navigator.geolocation.getCurrentPosition((position) => {
        latitude.value = position.coords.latitude
        longitude.value = position.coords.longitude
        setDistanceMap()
        page.value = 0
      })
    } else {
      latitude.value = null
      longitude.value = null
      page.value = 0
    }
  })

  if (sortByDistance.value) {
    navigator.geolocation.getCurrentPosition((position) => {
      latitude.value = position.coords.latitude
      longitude.value = position.coords.longitude
      setDistanceMap()
    })
  }
}

// degrees to radians
const dtr = (deg: number) => (deg * Math.PI) / 180.0

// distance in kms
function calculateDistance(lat1: number, long1: number, lat2: number, long2: number): number {
  return (
    Math.acos(
      Math.sin(dtr(lat1)) * Math.sin(dtr(lat2)) +
        Math.cos(dtr(lat1)) * Math.cos(dtr(lat2)) * Math.cos(dtr(long2) - dtr(long1))
    ) * 6371
  )
}

async function setDistanceMap(): Promise<void> {
  distanceMap.value = {}
  let distances: { [stationId: number]: number } = {}
  if (latitude.value != null && longitude.value != null) {
    for (const station of stations.value!.data) {
      distances[station.id] = await calculateDistance(
        latitude.value,
        longitude.value,
        station.lat,
        station.long
      )
    }
    distanceMap.value = distances
  }
}
</script>

<template>
  <div class="flex flex-col items-center mb-md">
    <div class="mt-sm flex flex-col items-start">
      <input
        type="text"
        v-model="filter"
        placeholder="Nom de la station"
        class="input input-bordered input-xs w-full max-w-xs"
      />
      <label class="label cursor-pointer" v-if="supportsGeolocation">
        <input type="checkbox" v-model="sortByDistance" class="toggle toggle-xs" />
        <span class="label-text prose-sm text-xs ml-sm-md"
          >Montrer les stations les plus proches en premier</span
        >
      </label>
      <label class="label cursor-pointer" v-if="favorites && favorites.size > 0">
        <input type="checkbox" v-model="favoritesOnly" class="toggle toggle-xs" />
        <span class="label-text prose-sm text-xs ml-sm-md"
          >Montrer seulement les stations favorites</span
        >
      </label>
    </div>

    <!--div v-if="supportsGeolocation" class="self-start"-->
    <!--/div-->

    <table class="table lg:w-[635px]">
      <!-- head -->
      <thead>
        <tr>
          <th class="lg:w-[340px]">Nom</th>
          <th>Vélos disponibles</th>
          <th>Ancrages disponibles</th>
        </tr>
      </thead>
      <tbody v-if="currentPage != null">
        <!-- row 1 -->
        <tr v-for="station in currentPage" :key="station.id" class="p-xs">
          <th class="p-xs name-cell overflow-hidden">
            <RouterLink class="tab text-xs link link-primary" :to="`/station/${station.id}`">{{
              station.name
            }}</RouterLink
            >&nbsp;
          </th>
          <td class="p-xs" v-if="availabilityData[station.id] != null">
            <Line
              :style="{ height: '75px', width: '120px' }"
              :id="'bikes-availability-chart-' + station.id"
              :title="`Vélos disponibles ajourd'hui (${station.name})`"
              :options="{
                ...chartOptions,
                plugins: {
                  legend: {
                    display: false
                  },
                  title: {
                    align: 'end',
                    display: true,
                    text: station.bikes?.toString(),
                    color: station.bikes != null && station.bikes > 2 ? 'gray' : 'red',
                    padding: { top: 0, bottom: 0 }
                  }
                }
              }"
              :data="//@ts-ignore
              { datasets: [{ data: availabilityData[station.id].bikes }] }"
            />
          </td>
          <td class="p-xs" v-if="availabilityData[station.id] != null">
            <Line
              :style="{ height: '75px', width: '120px' }"
              :id="'docks-availability-chart-' + station.id"
              :title="`Ancrages disponibles ajourd'hui (${station.name})`"
              :options="{
                ...chartOptions,
                plugins: {
                  legend: {
                    display: false
                  },
                  title: {
                    align: 'end',
                    display: true,
                    text: station.free_docks?.toString(),
                    color: station.free_docks != null && station.free_docks > 2 ? 'gray' : 'red',
                    padding: { top: 0, bottom: 0 }
                  }
                }
              }"
              :data="//@ts-ignore
              { datasets: [{ data: availabilityData[station.id].free_docks }] }"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <div class="join mt-sm-md" v-if="pageCount > 1">
      <button class="join-item btn btn-xs" @click="page = page - 1" :disabled="page == 0">«</button>
      <button class="join-item btn btn-xs">Page {{ page + 1 }} de {{ pageCount }}</button>
      <button
        class="join-item btn btn-xs"
        @click="page = page + 1"
        :disabled="page >= pageCount - 1"
      >
        »
      </button>
    </div>
    <div v-if="stations != null" class="prose-sm text-xs mt-sm">
      Dernière actualisation {{ dayjs(stations.timestamp).fromNow() }}
    </div>
  </div>
</template>
<style scoped>
.name-cell {
  height: 85px;
}
</style>
./storage
