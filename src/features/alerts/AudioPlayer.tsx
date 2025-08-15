import React from "react";

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  return (
    <div style={{ margin: "16px 0" }}>
      <audio controls src={audioUrl} style={{ width: "100%" }}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default AudioPlayer;
