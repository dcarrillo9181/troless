import React, { useRef, useState } from 'react';
import VideoRecorder from './VideoRecorder';

const RecorderPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [recorder, setRecorder] = useState<VideoRecorder | null>(null);
  const [circleSize, setCircleSize] = useState<number>(50);

  const handleStartRecording = () => {
    const recorder = new VideoRecorder(videoRef.current!, circleSize);
    setRecorder(recorder);
    recorder.startRecording();
  };

  const handleStopRecording = () => {
    recorder?.stopRecording();
  };

  const handleAdjustCircleSize = (size: number) => {
    setCircleSize(size);
    recorder?.adjustCircleSize(size);
  };

  const handleSaveVideo = () => {
    recorder?.saveVideo();
  };

  const handleDeleteVideo = () => {
    recorder?.deleteVideo();
  };

  const handleReRecord = () => {
    recorder?.reRecord();
  };

  const handleEditStartMark = (time: number) => {
    recorder?.editStartMark(time);
  };

  const handleEditEndMark = (time: number) => {
    recorder?.editEndMark(time);
  };

  return (
    <div>
      <video ref={videoRef} />
      <button onClick={handleStartRecording}>Start Recording</button>
      <button onClick={handleStopRecording}>Stop Recording</button>
      <input
        type="range"
        min="10"
        max="100"
        value={circleSize}
        onChange={(e) => handleAdjustCircleSize(Number(e.target.value))}
      />
      <button onClick={handleSaveVideo}>Save Video</button>
      <button onClick={handleDeleteVideo}>Delete Video</button>
      <button onClick={handleReRecord}>Re-record</button>
      <input type="number" onChange={(e) => handleEditStartMark(Number(e.target.value))} />
      <input type="number" onChange={(e) => handleEditEndMark(Number(e.target.value))} />
    </div>
  );
};

export default RecorderPage;
