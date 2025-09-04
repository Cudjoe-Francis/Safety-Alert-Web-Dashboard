import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

interface LocationMapProps {
  lat: number;
  lng: number;
  label?: string;
}

// Fix for missing marker icon in React/Leaflet
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const LocationMap: React.FC<LocationMapProps> = ({ lat, lng, label }) => {
  return (
    <div
      style={{
        height: 250,
        width: "100%",
        margin: "16px 0",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[lat, lng] as [number, number]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[lat, lng] as [number, number]} icon={defaultIcon}>
          <Popup>{label || "Alert Location"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LocationMap;
