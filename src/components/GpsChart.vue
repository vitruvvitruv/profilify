<template>
  <div class="gpsChart">
    <svg ref="svgRef" :width="width" :height="height"></svg>
    <button @click="downloadPng">PNG herunterladen</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits, watch } from 'vue';
import { Canvg } from 'canvg';
import robotoRegularBase64 from '../fonts/roboto-regular.b64.txt?raw';
import robotoBoldBase64 from '../fonts/roboto-bold.b64.txt?raw';
import * as d3 from 'd3';

import type { GpsData } from '../models/GpsData';
import { Track } from '../models/Track';
import type { IMark } from '../interfaces/IMark';
import { TrackDrawService } from '../services/TrackDrawService';
import { EnumClimbCat } from '../enums/EnumClimbCat';
import { Sector } from '../marks/Sector';
import { Climb } from '../marks/Climb';
import { Departement } from '../marks/Departement';


// Props definieren
interface Props {
  track: Track;
  width?: number;
  height?: number;
}
const props = defineProps<Props>();

const width = props.width ?? 1200;
const height = props.height ?? 550;

const svgRef = ref<SVGSVGElement | null>(null);

const emit = defineEmits<{
  (e: 'selectMark', mark: IMark | null): void;
}>();

const drawChart = () => {
  if (!svgRef.value || props.track.gps.length === 0) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  svg.insert('style', ':first-child').text(getRobotoFontStyle);
  svg.insert('rect', ':first-child')
  .attr('width', width)
  .attr('height', height)
  .attr('fill', '#444444');

  const marginH = 60;
  const marginV = 80;
  const w = width - 2 * marginH;
  const h = height - 2 * marginV;

  const g = svg.append('g').attr('transform', `translate(${marginH},${marginV})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(props.track.gps, d => d.distance * 0.001) as [number, number])
    .range([0, w]);

  const y = d3.scaleLinear()
    .domain([-100, props.track.isTimeTrial ? 1400 : 3500])
    .range([h, 0]);

  // Gradient
  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "svgGradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", y(props.track.isTimeTrial ? 900 : 2300))
    .attr("x2", 0)
    .attr("y2", y(0));

  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#FFFFFF");

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#DDDD00");

  const bgGradient = defs.append("linearGradient")
    .attr("id", "bgGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  bgGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#444444");

  bgGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#888888");

  g.append("rect")
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "url(#bgGradient)")
    .on('click', () => emit('selectMark', null));;

  const area = d3.area<GpsData>()
    .x(d => x(d.distance * 0.001))
    .y0(y.range()[0])
    .y1(d => y(d.smoothedElevation));

  const line = d3.line<GpsData>()
    .x(d => x(d.distance * 0.001))
    .y(d => y(d.smoothedElevation));

  g.append('path')
    .datum(props.track.gps)
    .attr('fill', 'url(#svgGradient)')
    .attr('stroke', 'none')
    .attr('d', area);

  props.track.marks.forEach((m) => {if (m instanceof Climb && m.category != EnumClimbCat.N) {
    const highlightSegment = props.track.gps.filter(p => 
      p.distance * 0.001 >= m.startPosition && p.distance * 0.001 <= m.position
    );

    g.append('path')
      .datum(highlightSegment)
      .attr('fill', 'rgba(139, 69, 19, 0.15)')
      .attr('stroke', 'none')
      .attr('d', area);
  }});

  props.track.marks.forEach((m) => {if (m instanceof Sector) {
    const highlightSegment = props.track.gps.filter(p => 
      p.distance * 0.001 >= m.position && p.distance * 0.001 <= m.endPosition
    );

    g.append('path')
      .datum(highlightSegment)
      .attr('fill', 'peru')
      .attr('stroke', 'none')
      .attr('d', area);
  }});



  // Start-Marker

  TrackDrawService.createStartSymbol(g);
  TrackDrawService.createMetaText(g, props.track.departure, false, false, w);
  TrackDrawService.createMetaText(g, props.track.gps[0].elevation.toFixed(0) + "m", false, true, w);
  TrackDrawService.createKmLabel(g, 0, h, 0, false);
  TrackDrawService.createSolidLine(g, 0, h, 70);
  
  let lastMarkerX = 0;
  let lastMarkerMoved = false;

  const labelMoveThreshold = 40;
  props.track.marks.forEach(m => {
    const nearestPoint = props.track.getNearestPoint(m.position);
    const markerX = x(nearestPoint.distance * 0.001);
    const markerY = y(nearestPoint.smoothedElevation);

    if (!(m instanceof Departement)) {
      lastMarkerMoved = markerX - lastMarkerX < labelMoveThreshold && !lastMarkerMoved;
      m.shallMoveKmLabel = lastMarkerMoved;
      lastMarkerX = markerX;
    }

    m.renderSpecific(g, markerX, markerY, h, (m: IMark) => emit('selectMark', m));
  });
  
  // Ende

  TrackDrawService.createEndSymbol(g, w);
  TrackDrawService.createMetaText(g, props.track.arrival, true, false, w);
  
  const finalClimb = props.track.getFinalClimbOrNull();
  let lineY = 70;
  let altitudeText = `${props.track.gps[props.track.gps.length - 1].elevation.toFixed(0)}m`;
  
  if (finalClimb == null) {
    const shallMoveEndKmLabel = w - lastMarkerX < labelMoveThreshold && !lastMarkerMoved;
    TrackDrawService.createKmLabel(g, w, h, props.track.totalKM, shallMoveEndKmLabel);
  } else {
    altitudeText = `(${(finalClimb.position - finalClimb.startPosition).toFixed(1)}km à ${finalClimb.gradient.toFixed(1)}%) ${props.track.gps[props.track.gps.length - 1].elevation.toFixed(0)}m`;
    if (finalClimb.category && finalClimb.category != EnumClimbCat.N) {
      TrackDrawService.createMarkSymbol(g, w, 75, "white", "red", finalClimb.category);
      lineY = 105;
    }
    TrackDrawService.createKmLabel(g, w, h, props.track.totalKM, lastMarkerMoved, finalClimb, (m) => emit('selectMark', m));
  }
  
  TrackDrawService.createMetaText(g, altitudeText, true, true, w);
  TrackDrawService.createSolidLine(g, w, h, lineY);

  
  g.append('path')
    .datum(props.track.gps)
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
    .attr('d', line);
};

onMounted(drawChart);
watch(() => props.track.gps, drawChart, { deep: true });

async function downloadPng() {
  if (!svgRef.value) return;

  const svgElement = svgRef.value;
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  const style = getRobotoFontStyle();

  const svgWithFont = svgString.replace(
    /<svg[^>]*>/,
    match => `${match}\n<style>${style}</style>`
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Canvg-Instanz mit dem SVG+Fonts auf Canvas rendern
  const v = await Canvg.fromString(ctx, svgWithFont, {
    ignoreAnimation: true,
    ignoreDimensions: true,
    ignoreClear: true,
  });
  await v.render();

  // PNG Blob erzeugen und Download starten
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.track.name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function getRobotoFontStyle(): string {
  const cleanRegular = robotoRegularBase64.replace(/\0/g, '').trim();
  const cleanBold = robotoBoldBase64.replace(/\0/g, '').trim();

  return `
    @font-face {
      font-family: 'Roboto';
      font-weight: 400;
      src: url(data:font/woff2;base64,${cleanRegular}) format('woff2');
    }
    @font-face {
      font-family: 'Roboto';
      font-weight: 700;
      src: url(data:font/woff2;base64,${cleanBold}) format('woff2');
    }
    text {
      font-family: 'Roboto', sans-serif;
    }
  `;
}

</script>