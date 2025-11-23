<script lang="ts" setup>
import { ref, watch, defineEmits, defineProps } from 'vue';
import type { Track } from '../models/Track';
import { Climb } from '../marks/Climb';
import { Departement } from '../marks/Departement';
import { Intermediate } from '../marks/Intermediate';
import { Sector } from '../marks/Sector';
import { Sprint } from '../marks/Sprint';
import { SteepPart } from '../marks/SteepPart';
import { Town } from '../marks/Town';
import type { IMark } from '../interfaces/IMark';
import { EnumClimbCat } from '../enums/EnumClimbCat';
import { ClimbCalculationService } from '../services/ClimbCalculationService';

const props = defineProps<{
  track: Track;
  selectedMark: IMark | null;
}>();

const emit = defineEmits(['updateMeta', 'unselectMark']);

const departure = ref(props.track.departure);
const arrival = ref(props.track.arrival);
const isTimeTrial = ref(props.track.isTimeTrial);

watch(() => props.track, (newTrack) => {
  departure.value = newTrack.departure;
  arrival.value = newTrack.arrival;
  isTimeTrial.value = newTrack.isTimeTrial;
});

// Neue Mark-Eingabe
const markType = ref<String>();
const markKm = ref<number>(0);
const startKm = ref<number>(0);
const endKm = ref<number>(0);
const markName = ref('');

// Editierbare Felder für ausgewählte Markierung
const editPosition = ref(0);
const editLabel = ref('');
const editStart = ref(0);
const editEnd = ref(0);

const editCat = ref<EnumClimbCat | 'Auto'>('Auto');

// Kategorien für Auswahl
const climbCategories = {
  [EnumClimbCat.HC]: 'HC',
  [EnumClimbCat.C1]: '1C',
  [EnumClimbCat.C2]: '2C',
  [EnumClimbCat.C3]: '3C',
  [EnumClimbCat.C4]: '4C',
  [EnumClimbCat.N]: 'None',
}

watch(() => props.selectedMark, (mark) => {
  if (mark) {
    editPosition.value = mark.position;
    editLabel.value = mark.label;
    if (mark instanceof SteepPart || mark instanceof Sector) {
      editEnd.value = mark.endPosition;
    }
    if (mark instanceof Climb) {
      editStart.value = mark.startPosition;
      editCat.value = "Auto";
    }
  }
});

function save() {
  props.track.departure = departure.value;
  props.track.arrival = arrival.value;
  props.track.isTimeTrial = isTimeTrial.value;
  emit('updateMeta');
}

function detectAutoClimbs() {
  const detectedClimbs = ClimbCalculationService.detectClimbs(props.track.gps);
  detectedClimbs.forEach((climb) => props.track.marks.push(climb));
  emit('updateMeta');
}

function deleteMark(mark: IMark) {
  const index = props.track.marks.findIndex((m) => m.label === mark.label && m.position === mark.position);
  if (index !== -1) {
    props.track.marks.splice(index, 1);
  }
}

function deleteAllClimbs() {
  const climbsToDelete: Climb[] = [];
  props.track.marks.forEach((mark) => {
    if (mark instanceof Climb) {
      climbsToDelete.push(mark);
    }
  });
  climbsToDelete.forEach((climb) => deleteMark(climb));
  emit('updateMeta');
}

function deleteAllMarks() {
  const marksToDelete = props.track.marks.slice();
  marksToDelete.forEach((mark) => deleteMark(mark));
  emit('updateMeta');
}

function addMark() {
  const name = markName.value.trim();
  const position = markKm.value;
  if (isNaN(position)) {
    alert('Bitte gültige Kilometerzahl eingeben.');
    return;
  }
  if (!name) {
    alert('Bitte einen Namen eingeben.');
    return;
  }

  const nearestPoint = props.track.getNearestPoint(position);
  //TODO Refactor/Factory?
  if (markType.value == "Climb") {
    const startPosition = startKm.value;
    if (isNaN(startKm.value)) {
      alert('Bitte gültige Startposition (km) für Climb eingeben.');
      return;
    }
    const startPoint = props.track.getNearestPoint(startPosition);
    props.track.marks.push(new Climb(name, position, startPosition, nearestPoint, startPoint, null, props.track.totalKM));
  }
  else if (markType.value == "Departement") {
    props.track.marks.push(new Departement(name, position, nearestPoint));
  }
  else if (markType.value == "Intermediate") {
    props.track.marks.push(new Intermediate(name, position, nearestPoint));
  }
  else if (markType.value == "Sector") {
    const endPosition = endKm.value;
    if (isNaN(endKm.value)) {
      alert('Bitte gültige Endposition (km) für Sector eingeben.');
      return;
    }
    const endPoint = props.track.getNearestPoint(endPosition);
    props.track.marks.push(new Sector(name, position, endPosition, nearestPoint, endPoint));
  }
  else if (markType.value == "SteepPart") {
    const endPosition = endKm.value;
    if (isNaN(endKm.value)) {
      alert('Bitte gültige Endposition (km) für SteepPart eingeben.');
      return;
    }
    const endPoint = props.track.getNearestPoint(endPosition);
    props.track.marks.push(new SteepPart(name, position, endPosition, nearestPoint, endPoint));
  }
  else if (markType.value == "Sprint") {
    props.track.marks.push(new Sprint(name, position, nearestPoint));
  }
  else if (markType.value == "Town") {
    props.track.marks.push(new Town(name, position, nearestPoint));
  }
  markKm.value = 0;
  markName.value = '';
  startKm.value = 0;
  emit('updateMeta');
}

function applyMarkEdit() {
  if (props.selectedMark) {
    props.selectedMark.position = editPosition.value;
    props.selectedMark.label = editLabel.value;
    if (props.selectedMark instanceof SteepPart || props.selectedMark instanceof Sector) {
      props.selectedMark.endPosition = editEnd.value;
    }
    if (props.selectedMark instanceof Climb) {
      props.selectedMark.startPosition = editStart.value;
      props.selectedMark.category = editCat.value == 'Auto' ? null : editCat.value;
    }
    emit('updateMeta');
  }
  emit('unselectMark');
}

function deleteSelectedMark() {
  if (props.selectedMark) {
    deleteMark(props.selectedMark);
  }
  emit('updateMeta');
  emit('unselectMark');
}
</script>

<template>
  <div class="metaForm">
    <h4>Metadaten:</h4>

    <label>
      Startpunkt:
      <input v-model="departure" />
    </label>
    <br />

    <label>
      Zielpunkt:
      <input v-model="arrival" />
    </label>
    <br />

    <label>
      Time trial?
      <input type="checkbox" v-model="isTimeTrial" />
    </label>
    <button @click="save">Speichern</button>

    <hr />

    <h4>Neues Mark hinzufügen:</h4>

    <label>
      Typ:
      <select v-model="markType">
        <option value="Climb">Climb</option>
        <option value="Departement">Departement</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Sector">Sector</option>
        <option value="Sprint">Sprint</option>
        <option value="SteepPart">SteepPart</option>
        <option value="Town">Town</option>
      </select>
    </label>
    <br />

    <label>
      Position (km):
      <input type="number" v-model.number="markKm" />
    </label>
    <br />
    <label v-if="markType === 'Climb'">
      Startposition (km):
      <input type="number" v-model.number="startKm" />
    </label>
    <label v-if="markType === 'SteepPart' || markType === 'Sector'">
      Endposition (km):
      <input type="number" v-model.number="endKm" />
    </label>
    <br v-if="markType === 'Climb' || markType === 'Sector' || markType === 'SteepPart'"/>
    <label>
      Bezeichnung:
      <input v-model="markName" />
    </label>
    <br />

    <button @click="addMark">Mark hinzufügen</button>
    
    <br />

    <button @click="detectAutoClimbs">Detect climbs</button>
    <br />
    <button @click="deleteAllClimbs">Delete climbs</button>
    <button @click="deleteAllMarks">Delete marks</button>

    
    <hr />

    <div v-if="selectedMark">
      <h4>{{ selectedMark.type }} bearbeiten:</h4>

      <label>
        Position (km):
        <input type="number" v-model.number="editPosition" />
      </label>
      <br />

      <label>
        Bezeichnung:
        <input v-model="editLabel" />
      </label>
      <br />

      <br v-if="selectedMark instanceof Climb"/>
      <label v-if="selectedMark instanceof Climb">
        Startposition (km):
        <input type="number" v-model.number="editStart" />
      </label>
      <br v-if="selectedMark instanceof Climb"/>
      <label v-if="selectedMark instanceof Climb">
        Category:
        <select v-model="editCat">
          <option value="Auto">Auto</option>
          <option 
            v-for="(label, key) in climbCategories" 
            :key="key" 
            :value="key">
            {{ label }}
          </option>
        </select>
      </label>
      <label v-if="selectedMark instanceof SteepPart || selectedMark instanceof Sector">
        Endposition (km):
        <input type="number" v-model.number="editEnd" />
      </label>
      <br v-if="selectedMark instanceof Climb || selectedMark instanceof SteepPart || selectedMark instanceof Sector" />
      <button @click="applyMarkEdit">✅ Änderungen speichern</button>
      <button @click="deleteSelectedMark">🗑️ Markierung löschen</button>
    </div>
  </div>
</template>