import React, { useState, useEffect, useRef } from "react";
import { usePodcast } from "../context/PodcastContext";
import { X, Play, Pause, Music, Check, Sparkles, Film, Download, Volume2 } from "lucide-react";

// Time parser helper: Convert MM:SS or HH:MM:SS to seconds
function timeStringToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return Number(timeStr) || 0;
}

// ----------------------------------------------------
// Web Audio Synthesizer Instruments (Lofi/Synthwave/Ambient)
// ----------------------------------------------------

function playKick(ctx, dest, time) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);
    
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    osc.start(time);
    osc.stop(time + 0.15);
  } catch (e) {
    console.warn("Error synthesizing kick:", e);
  }
}

function playSnare(ctx, dest, time) {
  try {
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1000;
    
    const gain = ctx.createGain();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    noise.start(time);
    noise.stop(time + 0.15);
  } catch (e) {
    console.warn("Error synthesizing snare:", e);
  }
}

function playBass(ctx, dest, time, freq) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);
    
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, time);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);
    
    osc.start(time);
    osc.stop(time + 0.24);
  } catch (e) {
    console.warn("Error synthesizing bass:", e);
  }
}

function playPadChord(ctx, dest, time, freqs, duration) {
  try {
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(700, time);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.start(time);
      osc.stop(time + duration);
    });
  } catch (e) {
    console.warn("Error synthesizing chord pad:", e);
  }
}

// ----------------------------------------------------
// Main Reel Modal Component
// ----------------------------------------------------

export default function ReelModal({ clip, onClose }) {
  const { activeEpisode } = usePodcast();
  const audioUrl = clip.audioUrl || (activeEpisode && activeEpisode.audioUrl) || "";

  const [aspectRatio, setAspectRatio] = useState("9:16"); // '9:16' | '16:9' | '1:1'
  const [addCaptions, setAddCaptions] = useState(true);
  const [captionTheme, setCaptionTheme] = useState("classic"); // 'classic' | 'neon' | 'minimal'
  const [bgMusic, setBgMusic] = useState("none"); // 'none' | 'lofi' | 'ambient' | 'synthwave'
  
  const [editableQuote, setEditableQuote] = useState(clip.quote || "");
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTimeOffset, setCurrentTimeOffset] = useState(0); // Offset in seconds relative to start
  
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);

  // Canvas and playback refs
  const canvasRef = useRef(null);
  const localAudioRef = useRef(null);
  const bgImgRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Web Audio refs
  const audioCtxRef = useRef(null);
  const audioSourceRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const musicGainNodeRef = useRef(null);
  const destNodeRef = useRef(null);

  // Synth Sequencer refs
  const stepRef = useRef(0);
  const nextNoteTimeRef = useRef(0);

  // Parse start/end boundary seconds
  const startTime = timeStringToSeconds(clip.startTime);
  const endTime = timeStringToSeconds(clip.endTime || "00:00") || (startTime + 30);
  const clipDuration = endTime - startTime;

  // Initialize and load background image
  useEffect(() => {
    const img = new Image();
    img.src = clip.thumbnail;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      bgImgRef.current = img;
    };
    img.onerror = () => {
      bgImgRef.current = null;
    };
  }, [clip.thumbnail]);

  // Load Audio Node
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous"; // Needed for Web Audio capturing
    localAudioRef.current = audio;
    audio.currentTime = startTime;

    return () => {
      audio.pause();
      audio.src = "";
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [audioUrl, startTime]);

  // Initialize Web Audio context on first play
  const initAudioGraph = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const audio = localAudioRef.current;
      const source = ctx.createMediaElementSource(audio);
      audioSourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(volume, ctx.currentTime);
      gainNodeRef.current = mainGain;

      const musicGain = ctx.createGain();
      musicGain.gain.setValueAtTime(bgMusic === "none" ? 0 : 0.15, ctx.currentTime);
      musicGainNodeRef.current = musicGain;

      // Destination node for stream capture (canvas stream + this audio node)
      const dest = ctx.createMediaStreamDestination();
      destNodeRef.current = dest;

      // Route voice track: source -> analyser -> mainGain -> output & recorder destination
      source.connect(analyser);
      analyser.connect(mainGain);
      mainGain.connect(ctx.destination);
      mainGain.connect(dest);

      // Route music synth -> musicGain -> output & recorder destination
      musicGain.connect(ctx.destination);
      musicGain.connect(dest);

      nextNoteTimeRef.current = ctx.currentTime;
    } catch (e) {
      console.warn("Failed to initialize browser audio context:", e);
    }
  };

  // Sync controls changes to gain nodes
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    if (musicGainNodeRef.current && audioCtxRef.current) {
      musicGainNodeRef.current.gain.setValueAtTime(bgMusic === "none" ? 0 : 0.15, audioCtxRef.current.currentTime);
    }
  }, [bgMusic]);

  // Sequencer beat tick scheduler
  const scheduleSynthNotes = (ctx, dest, currentBgMusic) => {
    if (currentBgMusic === "none") return;
    const tempo = currentBgMusic === "synthwave" ? 110 : 80;
    const stepDuration = 60 / tempo / 2; // 8th note spacing

    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const time = nextNoteTimeRef.current;
      const step = stepRef.current;

      if (currentBgMusic === "lofi") {
        // Kick on 0, 8. Snare on 4, 12
        if (step === 0 || step === 8) playKick(ctx, dest, time);
        if (step === 4 || step === 12) playSnare(ctx, dest, time);
        // Soft major chords
        if (step === 0) playPadChord(ctx, dest, time, [110.00, 130.81, 164.81, 196.00], stepDuration * 7); // Am7
        if (step === 8) playPadChord(ctx, dest, time, [73.42, 174.61, 220.00, 261.63], stepDuration * 7); // Dm7
      } else if (currentBgMusic === "synthwave") {
        // Alternating 8th note octaves
        let root = 55.00; // A1
        if (step >= 8 && step < 16) root = 48.99; // G1
        if (step >= 16 && step < 24) root = 43.65; // F1
        if (step >= 24 && step < 32) root = 41.20; // E1

        const freq = (step % 2 === 0) ? root : root * 2;
        playBass(ctx, dest, time, freq);

        if (step % 4 === 0) playKick(ctx, dest, time);
        if (step % 8 === 4) playSnare(ctx, dest, time);
      } else if (currentBgMusic === "ambient") {
        // Evolving sinus drone chords every 16 steps
        if (step === 0) {
          playPadChord(ctx, dest, time, [130.81, 164.81, 196.00, 246.94, 293.66], stepDuration * 15);
        }
      }

      stepRef.current = (stepRef.current + 1) % (currentBgMusic === "synthwave" ? 32 : 16);
      nextNoteTimeRef.current += stepDuration;
    }
  };

  // Subtitle drawing helper
  const drawSubtitles = (ctx, quoteText, width, height, activeWordIdx, theme) => {
    const words = quoteText.split(" ");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fontBase = "sans-serif";
    let fontColor = "#FFFFFF";
    let highlightColor = "#FFD700"; // gold
    let shadowColor = null;
    let drawBg = false;
    let bgStyle = "rgba(0, 0, 0, 0.7)";
    let fontSize = 21;
    let fontWeight = "bold";

    if (theme === "neon") {
      fontBase = "'Courier New', monospace";
      fontColor = "#FFFFFF";
      highlightColor = "#39FF14"; // neon green
      shadowColor = "#39FF14"; // neon glow
      fontSize = 23;
      fontWeight = "950";
    } else if (theme === "minimal") {
      fontBase = "Georgia, serif";
      fontColor = "#E2E8F0";
      highlightColor = "#FFB800";
      fontSize = 21;
      fontWeight = "bold";
      drawBg = true;
      bgStyle = "rgba(255, 255, 255, 0.08)";
    } else {
      // classic
      fontBase = "system-ui, -apple-system, sans-serif";
      fontColor = "#FFFFFF";
      highlightColor = "#FFEA33";
      fontSize = 21;
      fontWeight = "bold";
      drawBg = true;
      bgStyle = "rgba(0, 0, 0, 0.65)";
    }

    ctx.font = `${fontWeight} ${fontSize}px ${fontBase}`;

    const margin = 20;
    const maxWidth = width - margin * 2;
    const lines = [];
    let currentLine = [];
    let currentWidth = 0;

    words.forEach((word, idx) => {
      const wordWidth = ctx.measureText(word + " ").width;
      if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
      }
      currentLine.push({ text: word, index: idx, width: wordWidth });
      currentWidth += wordWidth;
    });
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Find the line containing the active word
    let activeLineIdx = 0;
    lines.forEach((line, idx) => {
      if (line.some(w => w.index === activeWordIdx)) {
        activeLineIdx = idx;
      }
    });

    const activeLine = lines[activeLineIdx] || [];
    const lineHeight = fontSize * 1.6;
    let startY = height * 0.76;

    if (activeLine.length > 0) {
      const lineWidth = activeLine.reduce((sum, w) => sum + w.width, 0);
      let startX = (width - lineWidth) / 2;

      if (drawBg) {
        ctx.fillStyle = bgStyle;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(startX - 10, startY - lineHeight / 2 + 1, lineWidth + 20, lineHeight, 6);
        } else {
          ctx.rect(startX - 10, startY - lineHeight / 2 + 1, lineWidth + 20, lineHeight);
        }
        ctx.fill();
      }

      activeLine.forEach((wordObj) => {
        const isActive = wordObj.index === activeWordIdx;
        
        ctx.save();
        if (isActive) {
          ctx.fillStyle = highlightColor;
          ctx.font = `${fontWeight} ${fontSize + 2}px ${fontBase}`; // 2px Pop
          if (shadowColor) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 12;
          }
        } else {
          ctx.fillStyle = fontColor;
          ctx.font = `${fontWeight} ${fontSize}px ${fontBase}`;
          ctx.shadowBlur = 0;
        }

        ctx.textAlign = "left";
        ctx.fillText(wordObj.text, startX, startY);
        ctx.restore();

        startX += wordObj.width;
      });
    }
  };

  // Live Canvas Rendering and Loop logic
  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const audio = localAudioRef.current;

    const width = canvas.width;
    const height = canvas.height;

    // Draw background artwork
    if (bgImgRef.current) {
      // Blurred scaled background
      ctx.drawImage(bgImgRef.current, 0, 0, width, height);
      ctx.fillStyle = "rgba(10, 10, 15, 0.75)";
      ctx.fillRect(0, 0, width, height);

      // Centered artwork box
      const boxSize = Math.min(width * 0.7, 200);
      const boxX = (width - boxSize) / 2;
      const boxY = height * 0.28 - boxSize / 2;
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(boxX, boxY, boxSize, boxSize, 12);
      } else {
        ctx.rect(boxX, boxY, boxSize, boxSize);
      }
      ctx.clip();
      ctx.drawImage(bgImgRef.current, boxX, boxY, boxSize, boxSize);
      ctx.restore();
    } else {
      // Premium Animated Spotify-style Procedural Gradient Background
      const time = Date.now() * 0.001;
      
      // Base dark layer
      ctx.fillStyle = "#0A0A0F";
      ctx.fillRect(0, 0, width, height);
      
      // Draw first soft glowing light circle (Primary color: Purple)
      const cx1 = width * 0.5 + Math.sin(time * 0.7) * (width * 0.3);
      const cy1 = height * 0.4 + Math.cos(time * 0.5) * (height * 0.2);
      const r1 = Math.min(width, height) * 0.6;
      
      const grad1 = ctx.createRadialGradient(cx1, cy1, 10, cx1, cy1, r1);
      grad1.addColorStop(0, "rgba(123, 94, 255, 0.22)"); // primary
      grad1.addColorStop(1, "rgba(123, 94, 255, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);
      
      // Draw second soft glowing light circle (Secondary color: Pink)
      const cx2 = width * 0.5 + Math.cos(time * 0.6) * (width * 0.3);
      const cy2 = height * 0.4 + Math.sin(time * 0.8) * (height * 0.2);
      const r2 = Math.min(width, height) * 0.5;
      
      const grad2 = ctx.createRadialGradient(cx2, cy2, 10, cx2, cy2, r2);
      grad2.addColorStop(0, "rgba(255, 94, 156, 0.18)"); // secondary pink
      grad2.addColorStop(1, "rgba(255, 94, 156, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);
      
      // Draw a sleek glowing visualizer track or rings in the center
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.28, 90 + Math.sin(time * 2.2) * 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(width / 2, height * 0.28, 60, 0, Math.PI * 2);
      ctx.stroke();
      
      // Center icon inside the ring
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.28, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Watermark Logo
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "900 10px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("PODCASTMIND AI", width / 2, 16);

    ctx.beginPath();
    ctx.arc(width / 2, 32, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = captionTheme === "neon" ? "#39FF14" : captionTheme === "minimal" ? "#FFB800" : "#7B5EFF";
    ctx.fill();

    // Trigger synth note scheduler if playing
    if (isPlayingLocal && audioCtxRef.current && destNodeRef.current) {
      scheduleSynthNotes(audioCtxRef.current, musicGainNodeRef.current, bgMusic);
    }

    // Draw active audio visualizer wave
    const waveColor = captionTheme === "neon" ? "#39FF14" : captionTheme === "minimal" ? "#FFB800" : "#7B5EFF";
    ctx.fillStyle = waveColor;

    const barWidth = 3;
    const gap = 2;
    const startY = height * 0.54;
    const waveWidth = width * 0.8;
    const startX = (width - waveWidth) / 2;
    const numBars = Math.floor(waveWidth / (barWidth + gap));

    if (analyserRef.current && isPlayingLocal) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      for (let i = 0; i < numBars; i++) {
        const dataIdx = Math.floor((i / numBars) * bufferLength);
        const freqVal = dataArray[dataIdx] || 0;
        const barHeight = (freqVal / 255) * 55 + 4; // Max 59px bar

        ctx.save();
        if (captionTheme === "neon") {
          ctx.shadowColor = waveColor;
          ctx.shadowBlur = 6;
        }
        ctx.fillRect(startX + i * (barWidth + gap), startY - barHeight / 2, barWidth, barHeight);
        ctx.restore();
      }
    } else {
      // Idle wave animation
      const t = Date.now() * 0.005;
      for (let i = 0; i < numBars; i++) {
        const barHeight = Math.abs(Math.sin(t + i * 0.12)) * 12 + 3;
        ctx.fillRect(startX + i * (barWidth + gap), startY - barHeight / 2, barWidth, barHeight);
      }
    }

    // Audio Playback progress tracking
    if (audio) {
      // Clamp boundaries
      if (audio.currentTime < startTime) {
        audio.currentTime = startTime;
      }
      
      const elapsed = audio.currentTime - startTime;
      setCurrentTimeOffset(elapsed);

      // Handle clip boundary hit
      if (audio.currentTime >= endTime) {
        if (exporting) {
          audio.pause();
          setIsPlayingLocal(false);
        } else {
          // Loop preview
          audio.currentTime = startTime;
          setCurrentTimeOffset(0);
        }
      }

      // Draw active captions words highlighter
      if (addCaptions && editableQuote.trim()) {
        const words = editableQuote.split(" ");
        const wordDur = clipDuration / words.length;
        const activeWordIdx = Math.min(words.length - 1, Math.floor(elapsed / wordDur));
        drawSubtitles(ctx, editableQuote, width, height, activeWordIdx, captionTheme);
      }
    }

    // Keep loop active
    animationFrameRef.current = requestAnimationFrame(renderFrame);
  };

  // Play/Pause triggering
  const togglePlay = async () => {
    const audio = localAudioRef.current;
    if (!audio) return;

    if (isPlayingLocal) {
      audio.pause();
      setIsPlayingLocal(false);
    } else {
      initAudioGraph();
      if (audioCtxRef.current) {
        await audioCtxRef.current.resume();
        nextNoteTimeRef.current = audioCtxRef.current.currentTime;
      }
      audio.play().catch(e => console.warn("Failed to play local audio:", e));
      setIsPlayingLocal(true);
    }
  };

  // Trigger loop sync on mounting
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [editableQuote, captionTheme, bgMusic, addCaptions, exporting]);

  // Actual recording and export flow using MediaRecorder with CORS defense fallback
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setProgress(0);
    setExportedVideoUrl(null);

    const audio = localAudioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) {
      setExporting(false);
      return;
    }

    try {
      // Initialize Web Audio nodes
      initAudioGraph();
      if (audioCtxRef.current) {
        await audioCtxRef.current.resume();
        nextNoteTimeRef.current = audioCtxRef.current.currentTime;
      }

      // Set playhead back to start
      audio.pause();
      setIsPlayingLocal(false);
      audio.currentTime = startTime;
      setCurrentTimeOffset(0);
      stepRef.current = 0;

      // Try capturing canvas stream
      let canvasStream;
      try {
        canvasStream = canvas.captureStream(30); // 30 FPS
      } catch (captureErr) {
        console.warn("Canvas capture stream failed. Retrying with clean procedural visualizer...", captureErr);
        bgImgRef.current = null; // Clear image to untaint canvas
        canvasStream = canvas.captureStream(30);
      }

      const audioStream = destNodeRef.current.stream;

      // Combine visual & sound streams
      const mixedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      // Construct recorder with browser-supported fallback codecs
      let mediaRecorder;
      const desiredTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4"
      ];

      for (const type of desiredTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          try {
            mediaRecorder = new MediaRecorder(mixedStream, { mimeType: type });
            break;
          } catch (e) {}
        }
      }
      if (!mediaRecorder) {
        mediaRecorder = new MediaRecorder(mixedStream);
      }

      const recordedChunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "video/webm" });
        const videoUrl = URL.createObjectURL(videoBlob);
        setExportedVideoUrl(videoUrl);

        // Auto-trigger native browser download file
        const link = document.createElement("a");
        link.href = videoUrl;
        link.download = `clip-${clip.id || "export"}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExporting(false);
        setProgress(100);
        setIsPlayingLocal(false);
      };

      // Launch recorder
      try {
        mediaRecorder.start();
      } catch (startErr) {
        console.warn("MediaRecorder start failed. Retrying with procedural background...", startErr);
        bgImgRef.current = null; // Clear image to untaint canvas
        
        alert("The podcast cover artwork is blocked by CORS security headers. Generating video with a premium animated background instead!");
        setExporting(false);
        
        setTimeout(() => {
          handleExport();
        }, 150);
        return;
      }

      // Start playback
      audio.play();
      setIsPlayingLocal(true);

      // Track recording progress bar
      const progressInterval = setInterval(() => {
        const currentOffset = audio.currentTime - startTime;
        const pct = Math.min(99, Math.floor((currentOffset / clipDuration) * 100));
        setProgress(pct);

        if (audio.currentTime >= endTime || audio.paused) {
          clearInterval(progressInterval);
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
          audio.pause();
          setIsPlayingLocal(false);
        }
      }, 200);

    } catch (exportErr) {
      console.error("General export failure:", exportErr);
      alert("Browser export error. Downloading raw audio clip instead!");
      
      // Fallback: download audio clip directly
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `clip-audio-${clip.id || "export"}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }
  };

  // Adjust canvas width & height based on aspect ratio
  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case "16:9":
        return { w: 640, h: 360 };
      case "1:1":
        return { w: 500, h: 500 };
      case "9:16":
      default:
        return { w: 360, h: 640 };
    }
  };

  const dims = getCanvasDimensions();

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Modal Box */}
      <div className="w-full max-w-4xl bg-[#0D0D12] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-[90vh] max-h-[680px]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Preview Pane */}
        <div className="w-full md:w-[45%] bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          <div className="absolute inset-0 opacity-15 bg-radial-gradient from-primary to-transparent" />
          
          {/* Simulated Mobile Device Preview Frame */}
          <div 
            className="border border-white/15 rounded-2xl relative shadow-2xl overflow-hidden flex items-center justify-center bg-[#09090D] transition-all duration-300"
            style={{
              width: aspectRatio === "9:16" ? "210px" : aspectRatio === "16:9" ? "300px" : "240px",
              height: aspectRatio === "9:16" ? "373px" : aspectRatio === "16:9" ? "169px" : "240px",
            }}
          >
            {/* Real Visualizer Canvas */}
            <canvas
              ref={canvasRef}
              width={dims.w}
              height={dims.h}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: exportedVideoUrl ? "none" : "block" }}
            />

            {/* Play/Pause Overlay Toggle */}
            {!exporting && !exportedVideoUrl && (
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-all z-10 border border-white/15"
              >
                {isPlayingLocal ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
              </button>
            )}

            {/* Recording compile overlay */}
            {exporting && (
              <div className="absolute inset-0 bg-black/75 z-20 flex flex-col items-center justify-center p-4 text-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse mb-3" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Recording Clip Stream</span>
                <span className="text-2xl font-black text-primary mt-1">{progress}%</span>
                <span className="text-[8px] text-text-muted mt-2">Rendering canvas buffer & encoding tracks...</span>
              </div>
            )}

            {/* Watch final compiled video directly in-place! */}
            {exportedVideoUrl && (
              <video
                src={exportedVideoUrl}
                controls
                autoPlay
                loop
                className="absolute inset-0 w-full h-full object-cover z-30"
              />
            )}
          </div>

          {/* Quick player scrubber details */}
          {!exportedVideoUrl && (
            <>
              <div className="w-full max-w-[300px] mt-4 flex items-center justify-between text-[10px] text-text-muted font-bold px-1">
                <span>START: {clip.startTime}</span>
                <div className="flex-1 mx-3 h-1 bg-white/10 rounded-full relative">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${(currentTimeOffset / clipDuration) * 100}%` }}
                  />
                </div>
                <span>END: {clip.endTime || "00:00"}</span>
              </div>

              {/* Volume controller */}
              <div className="w-full max-w-[200px] mt-3.5 flex items-center gap-2 text-text-muted">
                <Volume2 className="w-3.5 h-3.5" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </>
          )}

          {/* If video exported, display action controls directly underneath preview frame */}
          {exportedVideoUrl && (
            <div className="w-full max-w-[220px] mt-4 space-y-2">
              <a
                href={exportedVideoUrl}
                download={`clip-${clip.id || "export"}.webm`}
                className="w-full py-2.5 rounded-xl bg-success text-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-neon-green"
              >
                <Download className="w-4 h-4" />
                <span>Download Reel</span>
              </a>
              <button
                onClick={() => {
                  setExportedVideoUrl(null);
                  setProgress(0);
                  localAudioRef.current.currentTime = startTime;
                  setCurrentTimeOffset(0);
                }}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] transition-all"
              >
                Reset & Edit Again
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Configuration Sidebar */}
        <div className="w-full md:w-[55%] p-6 flex flex-col justify-between overflow-y-auto scrollbar-thin">
          <div className="space-y-6">
            <div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary uppercase">
                AI Short Reel Engine
              </span>
              <h3 className="text-lg font-heading font-black text-white mt-1">
                Customize Video Output
              </h3>
            </div>

            {/* Subtitle / Caption Editor */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Edit Captions Text</label>
                <span className="text-[8px] text-text-muted">Changes apply to canvas immediately</span>
              </div>
              <textarea
                value={editableQuote}
                onChange={(e) => setEditableQuote(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-primary/50 resize-none font-medium leading-relaxed"
                placeholder="Enter subtitle text for this clip..."
              />
            </div>

            {/* Options layout */}
            <div className="space-y-4">
              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Vertical (9:16)", value: "9:16" },
                    { label: "Horizontal (16:9)", value: "16:9" },
                    { label: "Square (1:1)", value: "1:1" }
                  ].map((aspect) => (
                    <button
                      key={aspect.value}
                      onClick={() => setAspectRatio(aspect.value)}
                      className={`py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                        aspectRatio === aspect.value
                          ? "bg-primary/10 border-primary text-white"
                          : "bg-white/[0.02] border-white/5 text-text-muted hover:border-white/10"
                      }`}
                    >
                      {aspect.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption Themes toggles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Burn-in Subtitles</span>
                  <input
                    type="checkbox"
                    checked={addCaptions}
                    onChange={(e) => setAddCaptions(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded bg-white/5 border-white/10"
                  />
                </div>
                
                {addCaptions && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { name: "Classic Dark", value: "classic" },
                      { name: "Neon Cyber", value: "neon" },
                      { name: "Minimal Gold", value: "minimal" }
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => setCaptionTheme(theme.value)}
                        className={`py-1.5 rounded-lg border text-[9px] font-semibold transition-all cursor-pointer ${
                          captionTheme === theme.value
                            ? "bg-secondary/15 border-secondary text-secondary"
                            : "bg-white/[0.01] border-white/5 text-text-muted hover:border-white/10"
                        }`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Background synth music */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">AI Synth Background Music</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "No Music", value: "none" },
                    { label: "Chill Lofi Beat", value: "lofi" },
                    { label: "Ambient Synth", value: "ambient" },
                    { label: "Retro Synthwave", value: "synthwave" }
                  ].map((track) => (
                    <button
                      key={track.value}
                      onClick={() => setBgMusic(track.value)}
                      className={`py-2 px-3 rounded-xl border text-[10px] font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                        bgMusic === track.value
                          ? "bg-primary/10 border-primary text-white"
                          : "bg-white/[0.02] border-white/5 text-text-muted hover:border-white/10"
                      }`}
                    >
                      <span>{track.label}</span>
                      {bgMusic === track.value && <Check className="w-3 h-3 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Compile and Download CTA panel */}
          <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
            {exportedVideoUrl && (
              <div className="p-3 rounded-xl bg-success/15 border border-success/30 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-success uppercase">Export Successful</span>
                  <span className="text-[9px] text-text-muted">Reel compilation generated locally.</span>
                </div>
                <a
                  href={exportedVideoUrl}
                  download={`clip-${clip.id || "export"}.webm`}
                  className="px-3.5 py-1.5 rounded-lg bg-success text-white font-bold text-[10px] hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Download Reel
                </a>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exporting}
              className={`w-full font-heading font-black text-xs py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-neon-purple ${
                exporting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Film className="w-4 h-4" />
              <span>{exporting ? "Compiling Video..." : "Generate & Export Video Clip"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
