<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "ropav";

// Data URIs so the demo needs nothing from the network.
// Valid as a URL, not decodable as a PNG — which is a load failure with nothing to fetch.
const broken = "data:image/png;base64,cm9wYXY=";

const portrait =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
       <rect width="64" height="64" fill="#0485f7" />
       <circle cx="32" cy="25" r="12" fill="#bfe0ff" />
       <circle cx="32" cy="58" r="19" fill="#bfe0ff" />
     </svg>`,
  );
</script>

<template>
  <Avatar size="lg">
    <AvatarImage alt="" :src="portrait" />
    <AvatarFallback :delay-ms="600">AL</AvatarFallback>
  </Avatar>

  <Avatar size="lg">
    <AvatarImage alt="" :src="broken" />
    <AvatarFallback>GH</AvatarFallback>
  </Avatar>

  <Avatar color="accent" size="lg" variant="soft">
    <AvatarFallback>KJ</AvatarFallback>
  </Avatar>
</template>
