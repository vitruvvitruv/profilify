<script lang="ts" setup>
import { ref, computed, shallowRef } from 'vue';
import type { IStoredTrack } from './interfaces/IStoredTrack';
import { Track } from './models/Track';
import { TrackStorageService } from './services/TrackStorageService';
import GpsChart from './components/GpsChart.vue';
import MetaForm from './components/MetaForm.vue';
import type { IMark } from './interfaces/IMark';

const storedTracks = ref<IStoredTrack[]>([]);
const preparedTracks = shallowRef<Track[]>([]);
const selectedIndex = ref<number | null>(null);
const folderHandle = ref<FileSystemDirectoryHandle | null>(null);
const folderName = computed(() => folderHandle.value?.name ?? '');
const selectedMark = ref<IMark | null>(null);

async function pickFolder() {
  try {
    const handle = await (window as any).showDirectoryPicker();
    folderHandle.value = handle;

    await TrackStorageService.loadTracksFromFolder(
      folderHandle.value!,
      storedTracks.value,
      preparedTracks.value
    );

    preparedTracks.value = [...preparedTracks.value];
    selectedIndex.value = storedTracks.value.length > 0 ? 0 : null;
  } catch (err) {
    console.error('Ordnerauswahl abgebrochen oder Fehler:', err);
  }
}

async function updateMeta(index: number) {
  if (!folderHandle.value) return;

  await TrackStorageService.updateMeta(folderHandle.value, index, storedTracks.value, preparedTracks);
}

const selectedTrack = computed(() => {
  if (
    selectedIndex.value === null ||
    selectedIndex.value < 0 ||
    selectedIndex.value >= preparedTracks.value.length
  ) {
    return null;
  }
  return preparedTracks.value[selectedIndex.value];
});
</script>

<template>
  <div>
    <h3>GPS Track Viewer mit Ordnerzugriff</h3>
    
    <div v-if="storedTracks.length" class="row-center">
      <span>Tracks im Ordner {{ folderName }}:</span>
      <select v-model="selectedIndex">
        <option 
          v-for="(t, i) in storedTracks" 
          :key="t.fileHandle.name" 
          :value="i"
        >
          {{ t.fileHandle.name }}
        </option>
      </select>
      <button @click="pickFolder">Ordner wechseln</button>
    </div>

    <div v-else class="row-center">
      <span>Bitte Ordner auswählen:</span>
      <button @click="pickFolder">GPX-Ordner auswählen</button>
    </div>

    <template v-if="selectedTrack">
      <div class="horizontal-container">
        <MetaForm :track="selectedTrack" 
        :selectedMark="selectedMark" 
        @updateMeta="updateMeta(selectedIndex!)"
        @unselectMark="selectedMark = null" />
        <GpsChart :track="selectedTrack" @selectMark="selectedMark = $event" />
      </div>
    </template>
  </div>
</template>