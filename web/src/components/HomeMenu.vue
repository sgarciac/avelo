<script setup lang="ts">
import { LayoutList, MapPin } from 'lucide-vue-next'
</script>
<template>
  <menu class="inline-block mb-md">
    <li class="inline mr-sm-md">
      <RouterLink class="no-underline hover:opacity-70" to="/">
        <LayoutList class="inline align-text-bottom" color="black" :size="16" :stroke-width="1" />
        <span class="pl-xs align-middle">Liste</span>
      </RouterLink>
    </li>
    <li class="inline ml-md">
      <RouterLink class="no-underline hover:opacity-70" to="/map">
        <MapPin class="inline align-text-bottom" color="black" :size="18" :stroke-width="1" />
        <span class="ml-0 align-middle">Carte</span>
      </RouterLink>
    </li>
  </menu>
</template>
