<script setup lang="ts">
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  Toolbar,
} from "ropav";
import { onBeforeUnmount, shallowRef } from "vue";

type Outcome = "empty" | "error" | "ready";

interface Project {
  id: string;
  name: string;
  owner: string;
  summary: string;
}

const ALL: Project[] = [
  { id: "atlas", name: "Atlas", owner: "Ada", summary: "Tiles the coastline survey." },
  { id: "beacon", name: "Beacon", owner: "Grace", summary: "Watches the ingest queue." },
  { id: "cinder", name: "Cinder", owner: "Alan", summary: "Rebuilds the search index nightly." },
];

const projects = shallowRef<Project[]>([]);
const error = shallowRef<null | string>(null);
const isLoading = shallowRef(true);

let timer: ReturnType<typeof setTimeout> | undefined;

onBeforeUnmount(() => clearTimeout(timer));

/* Stands in for the request. Only the three states it settles into are worth copying. */
const load = (outcome: Outcome) => {
  clearTimeout(timer);

  isLoading.value = true;
  error.value = null;

  timer = setTimeout(() => {
    isLoading.value = false;
    projects.value = outcome === "ready" ? ALL : [];
    error.value = outcome === "error" ? "The project service did not answer." : null;
  }, 1200);
};

load("ready");
</script>

<template>
  <div class="screen">
    <Toolbar aria-label="Load the projects">
      <Button :is-pending="isLoading" @click="load('ready')">Reload</Button>
      <Button :is-pending="isLoading" variant="secondary" @click="load('empty')">
        Return nothing
      </Button>
      <Button :is-pending="isLoading" variant="secondary" @click="load('error')">Fail</Button>
    </Toolbar>

    <!-- One of four, never two: loading wins, then the error, then the empty collection. -->
    <div v-if="isLoading" class="list">
      <Card v-for="placeholder in 3" :key="placeholder" class="card">
        <Skeleton class="line line--title" />
        <Skeleton class="line" />
      </Card>
    </div>

    <Alert v-else-if="error" status="danger">
      <AlertIndicator />
      <AlertContent>
        <AlertTitle>Could not load projects</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </AlertContent>
      <Button size="sm" @click="load('ready')">Try again</Button>
    </Alert>

    <EmptyState v-else-if="projects.length === 0">
      No projects yet. The first one you create lands here.
    </EmptyState>

    <div v-else class="list">
      <Card v-for="project in projects" :key="project.id" class="card">
        <CardHeader>
          <CardTitle>{{ project.name }}</CardTitle>
          <CardDescription>Kept by {{ project.owner }}</CardDescription>
        </CardHeader>
        <CardContent>{{ project.summary }}</CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  max-width: var(--rp-container-md);
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 4);
}

.list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 3);
}

.card {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 2);
}

/* Sized to the text it stands in for, so the list does not resize when the rows arrive. */
.line {
  height: calc(var(--rp-spacing) * 3);
  width: 70%;
  border-radius: var(--rp-radius);
}

.line.line--title {
  width: 35%;
}
</style>
