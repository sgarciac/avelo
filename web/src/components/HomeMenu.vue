<script setup lang="ts">
import { LayoutList, MapPin } from 'lucide-vue-next'
</script>
<template>
  <menu class="inline-block mb-4">
    <li class="inline mr-3">
      <RouterLink class="no-underline hover:opacity-70" to="/">
        <LayoutList class="inline align-text-bottom" color="black" :size="16" :stroke-width="1" />
        <span class="pl-1 align-middle">Liste</span>
      </RouterLink>
    </li>
    <li class="inline ml-4">
      <RouterLink class="no-underline hover:opacity-70" to="/map">
        <MapPin class="inline align-text-bottom" color="black" :size="18" :stroke-width="1" />
        <span class="ml-[0px] align-middle">Carte</span>
      </RouterLink>
    </li>
  </menu>
</template>
