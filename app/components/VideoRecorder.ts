import { MediaRecorder } from 'extendable-media-recorder';
import { saveAs } from 'file-saver';

class VideoRecorder {
  private mediaRecorder: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private circleSize: number;
  private startMark: number = 0;
  private endMark: number = 0;

  constructor(private videoElement: HTMLVideoElement, circleSize: number) {
    this.circleSize = circleSize;
    this.mediaRecorder = new MediaRecorder(this.videoElement.captureStream(), {
      mimeType: 'video/mp4',
    });
    this.mediaRecorder.ondataavailable = (event) => {
      this.recordedChunks.push(event.data);
    };
  }

  startRecording() {
    this.videoElement.style.clipPath = `circle(${this.circleSize}% at center)`;
    this.mediaRecorder.start();
  }

  stopRecording() {
    this.mediaRecorder.stop();
    this.videoElement.style.clipPath = '';
  }

  adjustCircleSize(size: number) {
    this.circleSize = size;
    this.videoElement.style.clipPath = `circle(${this.circleSize}% at center)`;
  }

  saveVideo() {
    const blob = new Blob(this.recordedChunks, { type: 'video/mp4' });
    saveAs(blob, 'recorded-video.mp4');
  }

  deleteVideo() {
    this.recordedChunks = [];
  }

  reRecord() {
    this.recordedChunks = [];
    this.startMark = 0;
    this.endMark = 0;
  }

  editStartMark(time: number) {
    this.startMark = time;
    this.videoElement.currentTime = time;
  }

  editEndMark(time: number) {
    this.endMark = time;
  }
}

export default VideoRecorder;
