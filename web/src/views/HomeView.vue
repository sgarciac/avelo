<script setup lang="ts"></script>

<template>
  <div>
    <h2>This is a home page</h2>

    <select class="form-control select select-primary select-block mbl">
      <optgroup label="Profile">
        <option value="0">My Profile</option>
        <option value="1">My Friends</option>
      </optgroup>
      <optgroup label="System">
        <option value="2">Messages</option>
        <option value="3">My Settings</option>
        <option value="4">Logout</option>
      </optgroup>
    </select>
  </div>
</template>
<style scoped></style>
