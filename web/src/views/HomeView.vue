<script setup lang="ts">
import {
  CategoryScale,
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
import { Line } from 'vue-chartjs'
ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title)

import relativeTime from 'dayjs/plugin/relativeTime'
import { onMounted, ref, type Ref } from 'vue'
dayjs.extend(relativeTime)
dayjs.locale('fr')

const chartData: any = {
  datasets: [
    {
      data: [
        { x: '2024-05-22T12:57:42Z', y: 10 },
        { x: '2024-05-22T13:57:42Z', y: 5 },
        { x: '2024-05-22T14:57:42Z', y: 7 },
        { x: '2024-05-22T14:58:42Z', y: 10 },
        { x: '2024-05-22T14:59:42Z', y: 5 },
        { x: '2024-05-22T14:59:43Z', y: 7 },
        { x: '2024-05-22T18:57:42Z', y: 10 },
        { x: '2024-05-22T19:57:42Z', y: 5 },
        { x: '2024-05-22T20:57:43Z', y: 7 }
      ]
    }
  ]
}

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
        display: false
      }
    },
    y: {
      grid: {
        display: false
      },
      ticks: {
        display: false
      }
    }
  }
}

interface CurrentAvailableSnapshot {
  kind: string
  label: string
  timestamp: string
  data: CurrentAvailableEntry[]
}

interface CurrentAvailableEntry {
  name: string
  id: number
  bikes: number | null
  free_docks: number | null
}

interface Past24HoursSnapshot {
  kind: string
  label: string
  timestamp: string
  data: AvailabilityEntryPoint[]
  station_id: number
  station_name: string
}

interface AvailabilityEntryPoint {
  bikes: number | null
  free_docks: number | null
  timestamp: string
}

const stations: Ref<CurrentAvailableSnapshot | undefined> = ref({
  kind: '',
  label: '',
  timestamp: '',
  data: []
})

const availabilityData: Ref<{
  [stationId: number]: {
    bikes: { x: string; y: number | null }[]
    free_docks: { x: string; y: number | null }[]
  }
}> = ref({})

function getEdtDate(date: Date) {
  var utc = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utc - 4 * 60 * 60 * 1000)
}

onMounted(async () => {
  stations.value = await (
    await fetch('https://snapshots.avelytique.gozque.com/current-available.json')
  ).json()
  let promises: Promise<any>[] = []
  for (let station of stations.value!.data) {
    promises.push(
      fetch(
        `https://snapshots.avelytique.gozque.com/past-24h-station-${station.id}-availability.json`
      )
    )
  }
  let responses = await Promise.allSettled(promises)

  for (const response of responses) {
    if (response.status === 'fulfilled') {
      let currentTimeEdt = getEdtDate(new Date())
      if (response.value.status === 200) {
        const body: Past24HoursSnapshot = await response.value.json()
        if (body.data.length > 0 && body.data[0].bikes != null && body.data[0].free_docks != null) {
          availabilityData.value[body.station_id] = {
            bikes: body.data
              .filter((entry, i) => {
                // reduce the number of points to one per 15 minutes, except for the last half hour
                let tsEdt = getEdtDate(new Date(entry.timestamp))
                return (
                  tsEdt.getDate() == currentTimeEdt.getDate() &&
                  (i % 4 == 0 || currentTimeEdt.getTime() - tsEdt.getTime() < 30 * 60 * 1000)
                )
              })
              .map((entry) => ({ x: entry.timestamp, y: entry.bikes })),
            free_docks: body.data
              .filter((entry, i) => {
                // reduce the number of points to one per 15 minutes, except for the last half hour
                let tsEdt = getEdtDate(new Date(entry.timestamp))
                return (
                  tsEdt.getDate() == currentTimeEdt.getDate() &&
                  (i % 4 == 0 || currentTimeEdt.getTime() - tsEdt.getTime() < 30 * 60 * 1000)
                )
              })
              .map((entry) => ({
                x: entry.timestamp,
                y: entry.free_docks
              }))
          }
        }
      }
    }
  }
  console.log(availabilityData.value)
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
      <tbody v-if="stations != null">
        <!-- row 1 -->
        <tr v-for="station in stations.data" :key="station.id">
          <th>{{ station.name }}</th>
          <td v-if="availabilityData[station.id] != null">
            <Line
              :style="{ height: '50px', width: '100px' }"
              :id="'docks-availability-chart-' + station.id"
              :title="`Ancrages disponibles ajourd'hui (${station.name})`"
              :options="{
                ...chartOptions,
                plugins: {
                  title: {
                    display: true,
                    text: station.bikes?.toString(),
                    color: station.bikes != null && station.bikes > 2 ? 'gray' : 'red',
                    padding: { top: 0, bottom: 0 }
                  }
                }
              }"
              :data="{ datasets: [{ data: availabilityData[station.id].bikes }] }"
            />
          </td>
          <td v-if="availabilityData[station.id] != null">
            <Line
              :style="{ height: '50px', width: '100px' }"
              :id="'bikes-availability-chart-' + station.id"
              :title="`Vélos disponibles ajourd'hui (${station.name})`"
              :options="{
                ...chartOptions,
                plugins: {
                  title: {
                    display: true,
                    text: station.free_docks?.toString(),
                    color: station.free_docks != null && station.free_docks > 2 ? 'gray' : 'red',
                    padding: { top: 0, bottom: 0 }
                  }
                }
              }"
              :data="{ datasets: [{ data: availabilityData[station.id].free_docks }] }"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped></style>
