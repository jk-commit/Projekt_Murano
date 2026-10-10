import type { Tour } from "./types";

const AUDIO_BASE = "/audio/Zuerich";

export const zurich: Tour = {
  id: "zurich",
  title: "Zurich Altstadt Tour",
  shortTitle: "Zurich Altstadt",
  region: "Zurich, Switzerland",
  description:
    "Walk the medieval streets of Zurich's old town with your personal audio guide — 7 hand-crafted stops, rich histories, hidden stories.",
  duration: "~1.5 hours",
  language: { label: "English", flag: "🇬🇧" },
  heroImage: "/Zurich.jpg",
  searchTerms: ["zurich", "zürich", "altstadt", "switzerland"],
  center: { lat: 47.3724, lng: 8.5408 },
  intro: {
    label: "Welcome to Zurich",
    audio: [
      `${AUDIO_BASE}/1.1%20Intro.mp3`,
      `${AUDIO_BASE}/1.2%20Intro.mp3`,
      `${AUDIO_BASE}/1.3%20Intro.mp3`,
    ],
  },
  guide: {
    name: "Marco",
    introAudio: `${AUDIO_BASE}/Zurich%20Introduction%20Guide.mp3`,
    askEnabled: true,
  },
  completeText: "You've explored the heart of Zurich Altstadt",
  shareText: "I just explored Zurich Altstadt with Marco, my personal AI city guide. 🎧🗺️",
  stops: [
    {
      id: "poi_1",
      type: "poi",
      name: "Lindenhof Hill",
      position: { lat: 47.3724, lng: 8.5408 },
      markerNumber: 1,
      audio: [
        `${AUDIO_BASE}/2.1%20POI%201%20Lindenhof%20Hill.mp3`,
        `${AUDIO_BASE}/2.2%20POI%201%20Lindenhof%20Hill.mp3`,
        `${AUDIO_BASE}/2.3%20POI%201%20Lindenhof%20Hill.mp3`,
        `${AUDIO_BASE}/2.4%20POI%201%20Lindenhof%20Hill.mp3`,
      ],
      walkHint: "~3 min walk to Augustinergasse",
    },
    {
      id: "walk_2",
      type: "walk",
      name: "Walk to Augustinergasse",
      position: { lat: 47.3723, lng: 8.5396 },
      audio: [
        `${AUDIO_BASE}/3.1%20WALK%20to%20POI2.mp3`,
        `${AUDIO_BASE}/3.2%20WALK%20to%20POI2.mp3`,
      ],
    },
    {
      id: "poi_2",
      type: "poi",
      name: "Augustinergasse",
      position: { lat: 47.3723, lng: 8.5385 },
      markerNumber: 2,
      audio: [
        `${AUDIO_BASE}/4.1%20POI2%20Augustinergasse.mp3`,
        `${AUDIO_BASE}/4.2%20POI2%20Augustinergasse.mp3`,
      ],
      walkHint: "~2 min walk to St. Peter's Church",
    },
    {
      id: "walk_3",
      type: "walk",
      name: "Walk to St. Peter's",
      position: { lat: 47.3716, lng: 8.5382 },
      audio: [
        `${AUDIO_BASE}/5.1%20WALK%20to%20POI3%20St.%20Peters.mp3`,
      ],
    },
    {
      id: "poi_3",
      type: "poi",
      name: "St. Peter's Church",
      position: { lat: 47.371, lng: 8.538 },
      markerNumber: 3,
      audio: [
        `${AUDIO_BASE}/6.1%20POI3%20St.%20Peters.mp3`,
        `${AUDIO_BASE}/6.2%20POI3%20St.%20Peters.mp3`,
        `${AUDIO_BASE}/6.3%20POI3%20St.%20Peters.mp3`,
      ],
      walkHint: "~3 min walk to Fraumünster",
    },
    {
      id: "walk_4",
      type: "walk",
      name: "Walk to Fraumünster",
      position: { lat: 47.3703, lng: 8.539 },
      audio: [
        `${AUDIO_BASE}/7.1%20WALK%20to%20POI4%20Frau%20M%C3%BCnster.mp3`,
      ],
    },
    {
      id: "poi_4",
      type: "poi",
      name: "Fraumünster",
      position: { lat: 47.3697, lng: 8.54 },
      markerNumber: 4,
      audio: [
        `${AUDIO_BASE}/8.1%20POI4%20Frau%20M%C3%BCnster.mp3`,
        `${AUDIO_BASE}/8.2%20POI4%20Frau%20M%C3%BCnster.mp3`,
      ],
      walkHint: "~2 min walk to Münsterbrücke",
    },
    {
      id: "walk_5",
      type: "walk",
      name: "Walk to Münsterbrücke",
      position: { lat: 47.3697, lng: 8.5411 },
      audio: [
        `${AUDIO_BASE}/9.1%20WALK%20to%20POI5%20M%C3%BCnsterbr%C3%BCcke.mp3`,
      ],
    },
    {
      id: "poi_5",
      type: "poi",
      name: "Münsterbrücke",
      position: { lat: 47.3697, lng: 8.5423 },
      markerNumber: 5,
      audio: [
        `${AUDIO_BASE}/10.1%20POI5%20M%C3%BCnsterbr%C3%BCcke.mp3`,
        `${AUDIO_BASE}/10.2%20POI5%20M%C3%BCnsterbr%C3%BCcke.mp3`,
      ],
      walkHint: "~1 min walk to Grossmünster",
    },
    {
      id: "walk_6",
      type: "walk",
      name: "Walk to Grossmünster",
      position: { lat: 47.3697, lng: 8.5431 },
      audio: [
        `${AUDIO_BASE}/11.1%20WALK%20to%20POI6%20Grossm%C3%BCnster.mp3`,
      ],
    },
    {
      id: "poi_6",
      type: "poi",
      name: "Grossmünster",
      position: { lat: 47.3698, lng: 8.544 },
      markerNumber: 6,
      audio: [
        `${AUDIO_BASE}/12.1%20POI6%20Grossm%C3%BCnster.mp3`,
        `${AUDIO_BASE}/12.2%20POI6%20Grossm%C3%BCnster.mp3`,
      ],
      walkHint: "~3 min walk to Limmatquai",
    },
    {
      id: "walk_7",
      type: "walk",
      name: "Walk to Limmatquai",
      position: { lat: 47.3708, lng: 8.5432 },
      audio: [
        `${AUDIO_BASE}/13.1%20WALK%20to%20POI7%20Limmatquai.mp3`,
      ],
    },
    {
      id: "poi_7",
      type: "poi",
      name: "Limmatquai / Rathaus",
      position: { lat: 47.3718, lng: 8.5425 },
      markerNumber: 7,
      audio: [
        `${AUDIO_BASE}/14.1%20Outro.mp3`,
        `${AUDIO_BASE}/14.2%20Outro.mp3`,
        `${AUDIO_BASE}/14.3%20Outro.mp3`,
      ],
    },
  ],
};
