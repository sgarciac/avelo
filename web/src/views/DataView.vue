<template>
  <div class="w-full flex flex-col items-center mb-4">
    <div class="w-full prose my-auto">
      <h3>Disponibilités actuelles (toutes les stations)</h3>
      <p>
        <a
          class="link link-primary"
          href="https://snapshots.avelytique.gozque.com/current-available.json"
          >https://snapshots.avelytique.gozque.com/current-available.json</a
        >
      </p>
      <h3>Disponibilités des dernières 24 heures (par station)</h3>

      <p>
        https://snapshots.avelytique.gozque.com/past-24h-station-<em>[Station ID]</em
        >-availability.json
      </p>
      <p>
        Exemple:
        <a
          class="link link-primary"
          href="https://snapshots.avelytique.gozque.com/past-24h-station-103-availability.json"
          >https://snapshots.avelytique.gozque.com/past-24h-station-103-availability.json</a
        >
      </p>

      <h3>Disponibilités par journée (EDT) par station</h3>

      <p>
        https://snapshots.avelytique.gozque.com/station-<em>[StationID]</em>-availability-<em>[YYYY-MM-DD]</em>.json
      </p>
      <p>
        Exemple:
        <a
          class="link link-primary"
          href="https://snapshots.avelytique.gozque.com/station-72-availability-2024-05-22.json"
          >https://snapshots.avelytique.gozque.com/station-72-availability-2024-05-22.json</a
        >
      </p>
    </div>
  </div>
</template>

<style></style>
