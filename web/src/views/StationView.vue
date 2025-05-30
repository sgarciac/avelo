<template>
  <div class="w-full flex flex-col items-center mb-md">
    <div class="w-full prose my-auto">
      <h3 v-if="stationInfo">{{ stationInfo.name }}</h3>
      <div class="form-control w-52">
        <label class="cursor-pointer label">
          <span class="label-text">{{
            favorite ? 'Ajouté aux favoris' : 'Ajouter aux favoris'
          }}</span>
          <input type="checkbox" v-model="favorite" class="toggle toggle-primary toggle-sm" />
        </label>
      </div>
      <Line
        v-if="stationInfo && availabilities"
        :id="'bikes-availability-chart-' + stationInfo.id"
        :title="`Vélos disponibles ajourd'hui (${stationInfo.name})`"
        :options="{
          ...chartOptions,
          plugins: {
            colors: {
              enabled: true,
              forceOverride: true
            },
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
          datasets: selectedAvailabilitiesArray
            .filter((label) => availabilities[label])
            .map((label) => ({
              label: label === 'current' ? 'Actuellement' : label,
              data: availabilities[label].bikes
            }))
        }"
      />

      <Line
        v-if="stationInfo && availabilities"
        :id="'anchors-availability-chart-' + stationInfo.id"
        :title="`Ancrages disponibles (${stationInfo.name})`"
        :options="{
          ...chartOptions,
          plugins: {
            colors: {
              enabled: true,
              forceOverride: true
            },
            title: {
              align: 'center',
              display: true,
              text: `Ancrages disponibles (${stationInfo.free_docks})`,
              padding: { top: 0, bottom: 0 }
            }
          }
        }"
        class="mt-xl"
        :data="{
          //@ts-ignore
          datasets: selectedAvailabilitiesArray
            .filter((label) => availabilities[label])
            .map((label) => ({
              label: label === 'current' ? 'Actuellement' : label,
              data: availabilities[label].free_docks
            }))
        }"
      />

      <label class="label cursor-pointer">
        <span class="label-text text-sm">Actuellement</span>
        <input
          type="checkbox"
          id="current"
          value="current"
          v-model="selectedAvailabilities"
          class="checkbox checkbox-sm ml-sm-md"
        />
      </label>
      <template v-for="year in years" :key="year">
        <div
          class="collapse collapse-arrow mb-md mt-md border border-gray-darker"
          :class="{ 'collapse-open': expandedYears.has(year) }"
        >
          <div
            class="collapse-title p-sm-md min-h-md hover:cursor-pointer"
            :id="`year-${year}`"
            @click="toggleYear(year, $event)"
          >
            Année {{ year }}
          </div>
          <div class="collapse-content text-sm">
            <div class="grid grid-cols-7 mt-sm gap-xs">
              <template v-for="weekday in orderedWeekdays" :key="weekday">
                <div
                  class="text-sm text-center mb-sm min-w-[90px]"
                  :class="[
                    {
                      'bg-gray-dark': getTodayEdtDayLabel() !== weekday,
                      'bg-gray-darker': getTodayEdtDayLabel() === weekday
                    }
                  ]"
                >
                  {{ weekday }}
                </div>
              </template>

              <template v-for="weekday in orderedWeekdays" :key="weekday">
                <div class="flex flex-col items-center gap-xs">
                  <template
                    v-for="label in dateGroups[year]?.[weekday.toLowerCase()] || []"
                    :key="label"
                  >
                    <label v-if="label !== null" class="flex flex-col items-center cursor-pointer">
                      <input
                        type="checkbox"
                        :id="label"
                        :value="label"
                        v-model="selectedAvailabilities"
                        class="checkbox checkbox-xs"
                      />
                      <span class="label-text text-xs">{{ dayjs(label).format('MM-DD') }}</span>
                    </label>
                    <span v-else class="label-text text-xs h-[36px]"></span>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
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
import { bindItemToPersistedSet, initPersistedSet } from './storage'
import { scrollToDivById } from '../utils/scrollTo'
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
import 'dayjs/locale/fr'
import timezone from 'dayjs/plugin/timezone'
import weekday from 'dayjs/plugin/weekday'

import utc from 'dayjs/plugin/utc'
import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { CurrentAvailableEntry, CurrentAvailableSnapshot, Past24HoursSnapshot } from './types'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekday)
dayjs.locale('fr')

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  elements: {
    point: {
      radius: 0
    }
  },
  scales: {
    x: {
      //@ts-ignore
      max: toTodayEdtEndOfDay().toISOString(),
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
const currentAvailable: Ref<{
  bikes: {
    x: string
    y: number | null
  }[]
  free_docks: {
    x: string
    y: number | null
  }[]
} | null> = ref(null)
const favorites = initPersistedSet('favorites')
const favorite: Ref<boolean> = ref(false)

function getEdtDate(date: Date) {
  var utc = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utc - 4 * 60 * 60 * 1000)
}

function getTodayEdtDayLabel() {
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  return dayNames[dayjs(getEdtDate(new Date())).weekday() % 7]
}

// Move the window to today
function moveToToday(date: Date, day: string) {
  const days = dayjs(day).diff(dayjs(dayjs(getEdtDate(new Date())).format('YYYY-MM-DD')), 'days')
  return dayjs(date).subtract(days, 'days').toDate()
}

function toTodayEdtEndOfDay() {
  return dayjs
    .tz(dayjs(getEdtDate(new Date())).format('YYYY-MM-DDT23:59:59'), 'America/Montreal')
    .toDate()
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

// Show only the dates when the scraper was activated
const initialDates = [
  {
    from: new Date('2024-05-21T04:01:00Z'),
    to: new Date('2024-11-01T04:01:00Z')
  },
  {
    from: new Date('2025-05-01T04:01:00Z'),
    to: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
  }
]

const dates = initialDates.flatMap(({ from, to }) => getDates(from, to)).reverse()

const years: number[] = [...initialDates].reverse().map((item) => item.from.getFullYear())

const labels: string[] = [
  'current',
  ...dates.map((date) => dayjs(date).tz('America/Montreal').format('YYYY-MM-DD'))
]

const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const dayHeaders: string[] = []
for (let i = 0; i < 7; i++) {
  dayHeaders.push(dayNames[dayjs.tz(dates[i], 'America/Montreal').weekday() % 7])
}
const selectedAvailabilities: Ref<Set<string>> = ref(new Set(['current']))

const selectedAvailabilitiesArray = computed(() => Array.from(selectedAvailabilities.value))

const availabilities: Ref<{
  [label: string]: {
    bikes: { x: string; y: number | null }[]
    free_docks: { x: string; y: number | null }[]
  }
}> = ref({})

const expandedYears = ref<Set<number>>(new Set([2025]))

function toggleYear(year: number, e: Event) {
  if (expandedYears.value.has(year)) {
    expandedYears.value.delete(year)
  } else {
    expandedYears.value.add(year)
  }

  const el = e.currentTarget as HTMLElement

  setTimeout(() => scrollToDivById(el.id, 100), 200)
}

const orderedWeekdays = ['Dim', 'Sam', 'Ven', 'Jeu', 'Mer', 'Mar', 'Lun']

// Group labels by year and day of week
const dateGroups = computed(() => {
  const result: Record<number, Record<string, Array<string | null>>> = {}
  for (const label of labels) {
    if (label === 'current') continue
    const year = Number(label.slice(0, 4))
    if (!result[year]) result[year] = {}
    if (objEmpty(result[year])) {
      const count = Number(dayjs(label).locale('fr').day())
      for (let i = 0; i < 7 - count; i++) {
        const weekday = orderedWeekdays[i].toLowerCase()
        if (!result[year][weekday]) result[year][weekday] = [null]
      }
    }

    const weekday = dayjs(label).locale('fr').format('ddd').slice(0, 3) // "Lun", etc.
    if (!result[year][weekday]) result[year][weekday] = []
    result[year][weekday].push(label)
  }

  return result
})

const objEmpty = (obj: Record<string, unknown>) => {
  return Object.keys(obj).length === 0
}

async function syncData(newVal: Set<string>) {
  const newAvailabilities: {
    [label: string]: {
      bikes: { x: string; y: number | null }[]
      free_docks: { x: string; y: number | null }[]
    }
  } = {}

  for (const label of labels) {
    if (newVal.has(label) && stationInfo.value && availabilities.value[label] === undefined) {
      if (label === 'current') {
        newAvailabilities[label] = currentAvailable.value || { bikes: [], free_docks: [] }
      } else {
        const response = await fetch(
          `https://snapshots.avelytique.gozque.com/station-${stationInfo.value.id}-availability-${label}.json`
        )
        const body: Past24HoursSnapshot = await response.json()

        newAvailabilities[label] = {
          bikes: body.data.map((entry) => ({
            x: moveToToday(new Date(entry.timestamp), label).toISOString(),
            y: entry.bikes
          })),
          free_docks: body.data.map((entry) => ({
            x: moveToToday(new Date(entry.timestamp), label).toISOString(),
            y: entry.free_docks
          }))
        }
      }
    } else {
      if (newVal.has(label) && availabilities.value[label]) {
        newAvailabilities[label] = availabilities.value[label]
      }
    }
  }
  availabilities.value = newAvailabilities
}

watch(selectedAvailabilities, async (newVal) => {
  await syncData(newVal)
})

async function setupForStation(id: number) {
  const currentAvailabilitySnapshot: CurrentAvailableSnapshot = await (
    await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
  ).json()
  stationInfo.value = currentAvailabilitySnapshot.data.find((entry) => entry.id === id) || null

  if (stationInfo.value == null) {
    return
  }

  let availability24Hours: {
    data: {
      [station: number]: {
        bikes: number | null
        free_docks: number | null
        timestamp: string
      }[]
    }
  } = await (
    await fetch('https://snapshots.avelytique.gozque.com/past-24h-station-availability.json')
  ).json()

  let currentTimeEdt = getEdtDate(new Date())

  let lastOfPrevious = [...availability24Hours.data[stationInfo.value.id]]
    .reverse()
    .find((entry, i) => {
      let tsEdt = getEdtDate(new Date(entry.timestamp))
      return tsEdt.getDate() != currentTimeEdt.getDate()
    })

  let filteredData = availability24Hours.data[stationInfo.value.id].filter((entry, i) => {
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

  currentAvailable.value = {
    bikes: filteredData.map((entry) => ({ x: entry.timestamp, y: entry.bikes })),
    free_docks: filteredData.map((entry) => ({
      x: entry.timestamp,
      y: entry.free_docks
    }))
  }

  bindItemToPersistedSet(id, favorite, favorites)
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
<style>
.collapse-arrow > .collapse-title:after,
.collapse-open.collapse-arrow > .collapse-title:after {
  top: 25px;
}
</style>
