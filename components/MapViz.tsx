import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json'; // Simulating import

interface MapVizProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

const MapViz: React.FC<MapVizProps> = ({ lat, lon, onLocationSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll("*").remove(); // Clear previous

    // Projection
    const projection = d3.geoEquirectangular()
      .scale(width / 6.3) // Adjust scale to fit
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Fetch GeoJSON (using a reliable CDN for topojson/geojson)
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then(response => response.json())
      .then(topology => {
        const countries = feature(topology, topology.objects.countries);

        // Draw Map
        const g = svg.append('g');

        g.selectAll('path')
          .data((countries as any).features)
          .enter().append('path')
          .attr('d', path as any)
          .attr('fill', '#0a192f')
          .attr('stroke', '#1e3a8a')
          .attr('stroke-width', 0.5)
          .style('cursor', 'pointer')
          .on('mouseover', function() {
            d3.select(this).attr('fill', '#112240');
          })
          .on('mouseout', function() {
            d3.select(this).attr('fill', '#0a192f');
          })
          .on('click', (event, d) => {
            const [x, y] = d3.pointer(event);
            const coords = projection.invert?.([x, y]);
            if (coords) {
               onLocationSelect(coords[1], coords[0]);
            }
          });

        // Draw Selected Point
        if (lat && lon) {
          const coords = projection([lon, lat]);
          if (coords) {
             // Pulse effect
             g.append('circle')
              .attr('cx', coords[0])
              .attr('cy', coords[1])
              .attr('r', 8)
              .attr('fill', 'rgba(0, 240, 255, 0.3)')
              .append('animate')
              .attr('attributeName', 'r')
              .attr('from', 4)
              .attr('to', 15)
              .attr('dur', '1.5s')
              .attr('repeatCount', 'indefinite');

             g.append('circle')
              .attr('cx', coords[0])
              .attr('cy', coords[1])
              .attr('r', 4)
              .attr('fill', '#00f0ff');
          }
        }
      });

  }, [lat, lon, onLocationSelect]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border border-cyan-900 bg-black/40 shadow-inner">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 font-mono text-xs text-cyan-500 bg-black/80 p-2 border border-cyan-900 rounded">
        LAT: {lat.toFixed(4)} <br/>
        LON: {lon.toFixed(4)}
      </div>
    </div>
  );
};

export default MapViz;