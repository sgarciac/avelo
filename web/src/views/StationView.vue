<template>
  <h3 v-if="stationInfo">{{ stationInfo.name }}</h3>

  <Line
    v-if="stationInfo && availabilities"
    :style="{ height: '220px', width: '500px' }"
    :id="'bikes-availability-chart-' + stationInfo.id"
    :title="`Vélos disponibles ajourd'hui (${stationInfo.name})`"
    :options="{
      ...chartOptions,
      plugins: {
        title: {
          align: 'center',
          display: true,
          text: `Vélos disponibles (${stationInfo.bikes})`,
          padding: { top: 0, bottom: 0 }
        }
      }
    }"
    :data="{
      //@ts-ignore
      datasets: [...selectedAvailabilities].map((label) => ({
        label: label === 'current' ? 'Actuellement' : label,
        data: availabilities[label].bikes
      }))
    }"
  />

  <Line
    v-if="stationInfo && availabilities"
    :style="{ height: '220px', width: '500px' }"
    :id="'bikes-availability-chart-' + stationInfo.id"
    :title="`Ancrages disponibles (${stationInfo.name})`"
    :options="{
      ...chartOptions,
      plugins: {
        title: {
          align: 'center',
          display: true,
          text: `Ancrages disponibles (${stationInfo.free_docks})`,
          padding: { top: 0, bottom: 0 }
        }
      }
    }"
    class="mt-10"
    :data="{
      //@ts-ignore
      datasets: [...selectedAvailabilities].map((label) => ({
        label: label === 'current' ? 'Actuellement' : label,
        data: availabilities[label].free_docks
      }))
    }"
  />

  <div class="flex flex-col">
    <label class="label cursor-pointer">
      <span class="label-text">Actuellement</span>
      <input
        type="checkbox"
        id="current"
        value="current"
        v-model="selectedAvailabilities"
        class="checkbox checkbox-sm ml-3"
      />
    </label>
  </div>
  <div class="flex flex-row">
    <template v-for="label in labels" :key="label">
      <label class="label cursor-pointer" v-if="label !== 'current'">
        <span class="label-text">{{ label }}</span>
        <input
          type="checkbox"
          :id="label"
          :value="label"
          v-model="selectedAvailabilities"
          class="checkbox checkbox-sm ml-3"
        />
      </label>
    </template>
  </div>
</template>
<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Colors,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
  type ChartOptions
} from 'chart.js'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import { Line } from 'vue-chartjs'
ChartJS.register(
  CategoryScale,
  LinearScale,
  Colors,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
)

import dayjs from 'dayjs'
import { onMounted, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { CurrentAvailableEntry, CurrentAvailableSnapshot, Past24HoursSnapshot } from './types'

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    colors: {
      enabled: true,
      forceOverride: true
    }
  },
  elements: {
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
        display: true
      },
      ticks: {
        display: true,
        font: { size: 8 }
      }
    }
  }
}

const route = useRoute()
const stationInfo: Ref<CurrentAvailableEntry | null> = ref(null)

function getEdtDate(date: Date) {
  var utc = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utc - 4 * 60 * 60 * 1000)
}

function toTodayEdt(date: Date) {
  var currentEdt = getEdtDate(new Date())
  date.setDate(currentEdt.getDate())
  date.setMonth(currentEdt.getMonth())
  date.setFullYear(currentEdt.getFullYear())
  return date
}

function addDays(origin: Date, days: number) {
  var date = new Date(origin.valueOf())
  date.setDate(origin.getDate() + days)
  return date
}

function getDates(startDate: Date, stopDate: Date) {
  var dateArray = new Array()
  var currentDate = startDate
  while (currentDate <= stopDate) {
    dateArray.push(new Date(currentDate))
    currentDate = addDays(currentDate, 1)
  }
  return dateArray
}
const dates = getDates(
  new Date('2024-05-21T12:00:00'),
  getEdtDate(new Date(new Date().getTime() - 26 * 60 * 60 * 1000))
)

const labels: string[] = [
  'current',
  ...dates.map((date) => dayjs(date).format('YYYY-MM-DD')).reverse()
]

const selectedAvailabilities: Ref<Set<string>> = ref(new Set(['current']))

const availabilities: Ref<{
  [label: string]: {
    bikes: { x: string; y: number | null }[]
    free_docks: { x: string; y: number | null }[]
  }
}> = ref({})

async function syncData(newVal: Set<string>) {
  let currentTimeEdt = getEdtDate(new Date())

  for (const label of labels) {
    if (newVal.has(label) && stationInfo.value && availabilities.value[label] === undefined) {
      if (label === 'current') {
        const response = await fetch(
          `https://snapshots.avelytique.gozque.com/past-24h-station-${stationInfo.value.id}-availability.json`
        )
        const body: Past24HoursSnapshot = await response.json()
        availabilities.value[label] = {
          bikes: body.data
            .filter((entry, i) => {
              let tsEdt = getEdtDate(new Date(entry.timestamp))
              return tsEdt.getDate() == currentTimeEdt.getDate()
            })
            .map((entry) => ({ x: entry.timestamp, y: entry.bikes })),
          free_docks: body.data
            .filter((entry, i) => {
              let tsEdt = getEdtDate(new Date(entry.timestamp))
              return tsEdt.getDate() == currentTimeEdt.getDate()
            })
            .map((entry) => ({
              x: entry.timestamp,
              y: entry.free_docks
            }))
        }
      } else {
        const response = await fetch(
          `https://snapshots.avelytique.gozque.com/station-${stationInfo.value.id}-availability-${label}.json`
        )
        const body: Past24HoursSnapshot = await response.json()

        availabilities.value[label] = {
          bikes: body.data.map((entry) => ({
            x: toTodayEdt(new Date(entry.timestamp)).toISOString(),
            y: entry.bikes
          })),
          free_docks: body.data.map((entry) => ({
            x: toTodayEdt(new Date(entry.timestamp)).toISOString(),
            y: entry.free_docks
          }))
        }
      }
    } else {
      if (!newVal.has(label)) {
        delete availabilities.value[label]
      }
    }
  }
  console.log(availabilities.value)
}

watch(selectedAvailabilities, async (newVal) => {
  syncData(newVal)
})

async function setupForStation(id: number) {
  const currentAvailabilitySnapshot: CurrentAvailableSnapshot = await (
    await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
  ).json()
  stationInfo.value = currentAvailabilitySnapshot.data.find((entry) => entry.id === id) || null
}

watch(
  () => route.params.id,
  async (newId) => {
    await setupForStation(Number(newId))
  }
)

onMounted(async () => {
  await setupForStation(Number(route.params.id))
  await syncData(selectedAvailabilities.value)
})
</script>
<style></style>
