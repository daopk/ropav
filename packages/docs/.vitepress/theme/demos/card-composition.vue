<script setup lang="ts">
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ropav";
</script>

<template>
  <Card class="w-80">
    <CardHeader>
      <CardTitle>Weekly report</CardTitle>
      <CardDescription>Sent every Monday at 9am.</CardDescription>
    </CardHeader>

    <CardContent>Open rate held steady across the last four sends.</CardContent>

    <CardFooter>
      <Button size="sm">View</Button>
      <Button size="sm" variant="tertiary">Pause</Button>
    </CardFooter>
  </Card>
</template>
