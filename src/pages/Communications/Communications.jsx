import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/AdminPages.css';
import {
  FiSend,
  FiPaperclip,
  FiUsers,
  FiCheckCircle,
  FiMic,
  FiSquare,
  FiMessageCircle,
  FiVolume2,
  FiPlay,
  FiPause,
  FiDownload,
  FiFileText,
  FiImage,
} from 'react-icons/fi';
import communicationService from '../../services/communicationService';

const GROUP_ID = 'GROUP-ALL';

const initials = (name) =>
  name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '??';

const formatDuration = (seconds = 0) => {
  const value = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(value / 60).toString().padStart(2, '0');
  const s = Math.floor(value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};


const encodeWav = (samples, sampleRate) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };
  const write16 = (offset, value) => view.setUint16(offset, value, true);
  const write32 = (offset, value) => view.setUint32(offset, value, true);

  writeString(0, 'RIFF');
  write32(4, 36 + samples.length * 2);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  write32(16, 16);
  write16(20, 1);
  write16(22, 1);
  write32(24, sampleRate);
  write32(28, sampleRate * 2);
  write16(32, 2);
  write16(34, 16);
  writeString(36, 'data');
  write32(40, samples.length * 2);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(
      offset,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    );
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};
const formatFileSize = (bytes = 0) => {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const VoicePlayer = ({ src, duration, compact = false }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(Number(duration) || 0);
  const [ready, setReady] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    setReady(false);
    setFailed(false);
    setPlaying(false);
    setCurrent(0);
    setBuffered(0);
    if (Number(duration) > 0) setTotal(Number(duration));
    audio.load();
    return undefined;
  }, [src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio || failed) return;
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setFailed(true);
      setPlaying(false);
    }
  };

  const seek = (e) => {
    const value = Number(e.target.value);
    if (audioRef.current && Number.isFinite(value)) {
      audioRef.current.currentTime = value;
    }
    setCurrent(value);
  };

  const updateBuffered = (audio) => {
    try {
      if (audio.buffered.length) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    } catch (_) {}
  };

  return (
    <div className={`comm-voice-card ${compact ? 'compact' : ''} ${failed ? 'failed' : ''}`}>
      <button
        type="button"
        className="comm-voice-play"
        onClick={toggle}
        disabled={!ready || failed}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
      >
        {playing ? <FiPause size={17} /> : <FiPlay size={17} />}
      </button>

      <div className="comm-voice-body">
        <div className="comm-voice-track">
          <div className="comm-voice-wave" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} style={{ height: `${7 + ((i * 17) % 17)}px` }} />
            ))}
          </div>
          <div
            className="comm-voice-buffer"
            style={{ width: `${total > 0 ? Math.min(100, (buffered / total) * 100) : 0}%` }}
          />
          <div
            className="comm-voice-progress"
            style={{ width: `${total > 0 ? Math.min(100, (current / total) * 100) : 0}%` }}
          />
        </div>
        <input
          className="comm-voice-range"
          aria-label="Voice message progress"
          type="range"
          min="0"
          max={Math.max(total, 0.01)}
          step="0.01"
          value={Math.min(current, total || 0)}
          onChange={seek}
          disabled={!ready || failed}
        />
        <div className="comm-voice-times">
          <span>{formatDuration(current)}</span>
          <span>{formatDuration(total)}</span>
        </div>
        {failed && <div className="comm-voice-error">Audio could not be loaded completely.</div>}
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        playsInline
        onLoadedMetadata={(e) => {
          const d = Number(e.currentTarget.duration);
          if (Number.isFinite(d) && d > 0) setTotal(d);
          setReady(Number.isFinite(d) && d > 0);
        }}
        onCanPlayThrough={(e) => {
          const d = Number(e.currentTarget.duration);
          if (Number.isFinite(d) && d > 0) setTotal(d);
          setReady(true);
          updateBuffered(e.currentTarget);
        }}
        onProgress={(e) => updateBuffered(e.currentTarget)}
        onTimeUpdate={(e) => {
          setCurrent(e.currentTarget.currentTime || 0);
          updateBuffered(e.currentTarget);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onError={(e) => {
          console.error('Audio load error:', e.currentTarget.error);
          setFailed(true);
          setReady(false);
          setPlaying(false);
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
};

const attachmentIcon = (type='') => type.startsWith('image/') ? <FiImage/> : <FiFileText/>;

const FileCard = ({ message, onOpen }) => {
  const type = message.attachmentContentType || '';
  const image = type.startsWith('image/');
  return <div style={{minWidth:250,maxWidth:330}}>
    {image && message.attachmentId && <div style={{borderRadius:10,overflow:'hidden',marginBottom:8,background:'#f3f4f6'}}><img src={message.__attachmentUrl || ''} alt={message.attachmentName || 'image'} style={{display:'block',width:'100%',maxHeight:240,objectFit:'cover',cursor:'pointer'}} onClick={onOpen}/></div>}
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,background:'rgba(0,0,0,.04)'}}>
      <div style={{width:38,height:38,borderRadius:8,display:'grid',placeItems:'center',background:'rgba(37,99,235,.12)',color:'#2563eb'}}>{attachmentIcon(type)}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{message.attachmentName || 'Attachment'}</div><div style={{fontSize:11,opacity:.65,marginTop:2}}>{type || 'File'}{message.attachmentSizeBytes ? ` • ${formatFileSize(message.attachmentSizeBytes)}` : ''}</div></div>
      <button type="button" onClick={onOpen} title="Open / download" style={{border:0,background:'transparent',cursor:'pointer',fontSize:18}}><FiDownload/></button>
    </div>
  </div>;
};

const Communications = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeChat, setActiveChat] = useState(GROUP_ID);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voicePreview, setVoicePreview] = useState(null);
  const recordingSecondsRef = useRef(0);
  const [voiceUrls, setVoiceUrls] = useState({});
  const [attachmentUrls, setAttachmentUrls] = useState({});

  const bottomRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordingStartedAtRef = useRef(0);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const audioSinkRef = useRef(null);
  const audioSamplesRef = useRef([]);

  const loadParticipants = async () => {
    try {
      const data = await communicationService.getParticipants();
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Communication participants error:', err);
      setError(err.message || 'Failed to load participants');
    }
  };

  const loadMessages = async (chatId = activeChat) => {
    try {
      const data = await communicationService.getMessages(chatId);
      const list = Array.isArray(data) ? data : [];
      setMessages(list);

      const unread = list.filter(
        (message) =>
          message.senderUsername !== currentUser.username &&
          !(message.readBy || []).includes(currentUser.username)
      );
      for (const message of unread) {
        try {
          await communicationService.markRead(message.id);
        } catch (readError) {
          console.warn('Read update failed:', readError);
        }
      }
    } catch (err) {
      console.error('Communication messages error:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
    loadMessages(GROUP_ID);
    const timer = setInterval(loadParticipants, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadMessages(activeChat);
    const timer = setInterval(() => loadMessages(activeChat), 2000);
    return () => clearInterval(timer);
  }, [activeChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const attachmentUrlCacheRef = useRef(new Map());

  useEffect(() => {
    let cancelled = false;

    const loadAttachments = async () => {
      const nextVoice = {};
      const nextFiles = {};
      const neededIds = new Set();

      for (const message of messages) {
        if (!message.attachmentId) continue;
        const type = message.attachmentContentType || '';
        if (message.type !== 'VOICE' && !type.startsWith('image/')) continue;

        neededIds.add(message.attachmentId);

        try {
          let url = attachmentUrlCacheRef.current.get(message.attachmentId);
          if (!url) {
            url = await communicationService.getAttachmentBlobUrl(message.attachmentId, message.attachmentSizeBytes);
            attachmentUrlCacheRef.current.set(message.attachmentId, url);
          }

          if (message.type === 'VOICE') nextVoice[message.id] = url;
          else nextFiles[message.id] = url;
        } catch (err) {
          console.warn('Attachment preview failed:', err);
        }
      }

      // IMPORTANT: messages are polled every 2 seconds. Do NOT revoke
      // existing Blob URLs whenever `messages` changes, otherwise an
      // audio message gets cut off while it is playing. URLs are kept in
      // a cache and revoked only when the component unmounts or when an
      // attachment is no longer needed.
      for (const [id, url] of attachmentUrlCacheRef.current.entries()) {
        if (!neededIds.has(id)) {
          URL.revokeObjectURL(url);
          attachmentUrlCacheRef.current.delete(id);
        }
      }

      if (!cancelled) {
        setVoiceUrls(nextVoice);
        setAttachmentUrls(nextFiles);
      }
    };

    loadAttachments();

    return () => {
      cancelled = true;
    };
  }, [messages]);

  useEffect(() => () => {
    for (const url of attachmentUrlCacheRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    attachmentUrlCacheRef.current.clear();
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioProcessorRef.current?.disconnect();
    audioSourceRef.current?.disconnect();
    audioSinkRef.current?.disconnect();
    audioContextRef.current?.close().catch(() => {});
  }, []);

  const send = async () => {
    if (!draft.trim() || sending || isRecording) return;
    try {
      setSending(true);
      setError('');
      const isGroup = activeChat === GROUP_ID;
      await communicationService.sendMessage({
        recipientType: isGroup ? 'GROUP' : 'DIRECT',
        recipientUsername: isGroup ? null : activeChat,
        text: draft.trim(),
        type: 'CHAT',
      });
      setDraft('');
      await loadMessages(activeChat);
      await loadParticipants();
    } catch (err) {
      console.error('Send communication error:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || sending || isRecording) return;
    try {
      setSending(true);
      setError('');
      if (file.size > 50 * 1024 * 1024) throw new Error('Maximum file size is 50 MB.');
      const uploaded = await communicationService.uploadAttachment(file);

      // Verify that the exact number of bytes captured in the browser
      // reached the backend/GridFS. Never send a message pointing to a
      // partial voice upload.
      const storedSize = Number(uploaded?.sizeBytes || 0);
      if (storedSize !== file.size) {
        throw new Error(
          `Voice upload is incomplete (${storedSize} of ${file.size} bytes). Please record again.`
        );
      }

      const isGroup = activeChat === GROUP_ID;
      await communicationService.sendMessage({
        recipientType: isGroup ? 'GROUP' : 'DIRECT',
        recipientUsername: isGroup ? null : activeChat,
        text: file.name,
        type: 'FILE',
        attachmentId: uploaded.attachmentId,
        attachmentName: uploaded.fileName,
        attachmentContentType: uploaded.contentType,
        attachmentSizeBytes: uploaded.sizeBytes,
      });
      await loadMessages(activeChat);
      await loadParticipants();
    } catch (err) {
      console.error('File send error:', err);
      setError(err.message || 'Failed to send file');
    } finally {
      setSending(false);
    }
  };

  const finishVoiceSend = async (blob, duration) => {
    try {
      setSending(true);
      setError('');
      const mimeType = blob.type || 'audio/wav';
      const extension = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm';
      const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: mimeType });
      if (file.size > 50 * 1024 * 1024) throw new Error('Maximum file size is 50 MB.');
      const uploaded = await communicationService.uploadAttachment(file);
      const isGroup = activeChat === GROUP_ID;
      await communicationService.sendMessage({
        recipientType: isGroup ? 'GROUP' : 'DIRECT',
        recipientUsername: isGroup ? null : activeChat,
        text: 'Voice message',
        type: 'VOICE',
        attachmentId: uploaded.attachmentId,
        attachmentName: uploaded.fileName,
        attachmentContentType: uploaded.contentType,
        durationSeconds: duration,
        attachmentSizeBytes: uploaded.sizeBytes,
      });
      await loadMessages(activeChat);
      await loadParticipants();
      setVoicePreview((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return null;
      });
    } catch (err) {
      console.error('Voice send error:', err);
      setError(err.message || 'Failed to send voice message');
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || sending) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined') {
      setError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const context = new AudioCtx();
      await context.resume();

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const sink = context.createGain();
      sink.gain.value = 0;

      audioSamplesRef.current = [];
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        audioSamplesRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(sink);
      sink.connect(context.destination);

      streamRef.current = stream;
      audioContextRef.current = context;
      audioSourceRef.current = source;
      audioProcessorRef.current = processor;
      audioSinkRef.current = sink;
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);

      recordingStartedAtRef.current = performance.now();
    } catch (err) {
      console.error('Recording start error:', err);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError(err.message || 'Microphone permission is required.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    const samples = audioSamplesRef.current;
    const context = audioContextRef.current;
    const sampleRate = context?.sampleRate || 48000;

    try {
      audioProcessorRef.current?.disconnect();
      audioSourceRef.current?.disconnect();
      audioSinkRef.current?.disconnect();
    } catch (_) {}

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    try {
      await context?.close();
    } catch (_) {}

    audioContextRef.current = null;
    audioSourceRef.current = null;
    audioProcessorRef.current = null;
    audioSinkRef.current = null;
    audioSamplesRef.current = [];
    setIsRecording(false);

    const totalSamples = samples.reduce((sum, chunk) => sum + chunk.length, 0);
    if (!totalSamples) {
      setError('No audio was captured. Please record again.');
      return;
    }

    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of samples) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const blob = encodeWav(merged, sampleRate);
    const duration = Math.max(1, merged.length / sampleRate);
    const url = URL.createObjectURL(blob);

    setVoicePreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { blob, url, duration };
    });
    setRecordingSeconds(Math.round(duration));
    setError('');
  };

  const discardVoicePreview = () => {
    setVoicePreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setError('');
  };

  const sendVoicePreview = async () => {
    if (!voicePreview || sending) return;
    await finishVoiceSend(voicePreview.blob, voicePreview.duration);
  };

  const recordAgain = () => {
    discardVoicePreview();
    setRecordingSeconds(0);
    setTimeout(() => startRecording(), 0);
  };

  const activeChatInfo = participants.find((participant) => participant.id === activeChat);
  const telecallers = participants.filter((p) => p.chatCategory === 'TELECALLER');
  const admins = participants.filter((p) => p.chatCategory === 'SUPER_ADMIN');

  const renderMessage = (message) => {
    const mine = message.senderUsername === currentUser.username;
    const read = (message.readBy || []).length > 1;
    return (
      <div key={message.id} className={`comm-msg ${mine ? 'out' : 'in'}`}>
        {!mine && <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 3 }}>{message.senderName}</div>}
        {message.type === 'ANNOUNCEMENT' && <div style={{ fontWeight: 700, marginBottom: 4 }}>📢 Announcement</div>}
        {message.type === 'VOICE' ? (
          <div style={{padding:'4px 0'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,fontWeight:700,marginBottom:5}}><FiVolume2 size={15}/> Voice message</div>
            {voiceUrls[message.id] ? <VoicePlayer src={voiceUrls[message.id]} duration={message.durationSeconds}/> : <span style={{fontSize:12,opacity:.7}}>Loading audio...</span>}
          </div>
        ) : message.type === 'FILE' && message.attachmentId ? (
          <FileCard message={{...message, __attachmentUrl: attachmentUrls[message.id]}} onOpen={() => communicationService.openAttachment(message.attachmentId).catch((err) => setError(err.message))}/>
        ) : (
          message.text && <div style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{message.text}</div>
        )}
        <div className="comm-msg-meta">
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
          {mine && <span style={{ marginLeft: 5 }}>{read ? <FiCheckCircle size={11} /> : '· sent'}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="ap-page">
      <style>{`
        .comm-voice-card{display:flex;align-items:center;gap:10px;min-width:260px;max-width:360px;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.78);border:1px solid rgba(148,163,184,.22);box-shadow:0 1px 2px rgba(15,23,42,.06)}
        .comm-msg.out .comm-voice-card{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.25)}
        .comm-voice-play{width:38px;height:38px;flex:0 0 38px;border:0;border-radius:50%;display:grid;place-items:center;background:#2563eb;color:#fff;cursor:pointer;box-shadow:0 2px 6px rgba(37,99,235,.25)}
        .comm-msg.out .comm-voice-play{background:#fff;color:#2563eb}
        .comm-voice-play:disabled{opacity:.5;cursor:wait}
        .comm-voice-body{flex:1;min-width:0}
        .comm-voice-wave{height:22px;display:flex;align-items:center;gap:2px;margin-bottom:3px;overflow:hidden}
        .comm-voice-wave span{display:block;width:3px;border-radius:3px;background:#94a3b8;opacity:.75}
        .comm-msg.out .comm-voice-wave span{background:rgba(255,255,255,.75)}
        .comm-voice-range{width:100%;height:4px;accent-color:#2563eb;cursor:pointer}
        .comm-msg.out .comm-voice-range{accent-color:#fff}
        .comm-voice-times{display:flex;justify-content:space-between;font-size:10px;line-height:1.2;color:#64748b;margin-top:2px}
        .comm-msg.out .comm-voice-times{color:rgba(255,255,255,.78)}
        .comm-input-row{box-shadow:0 1px 4px rgba(15,23,42,.08);border:1px solid #e5e7eb!important}
        .comm-input-row input{background:#fff;border:0!important;border-radius:18px!important;padding:10px 14px!important;outline:none!important}
        .comm-input-row button,.comm-input-row .ap-btn-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;border:0;background:#fff;cursor:pointer}
        .comm-input-row button:last-child{background:#2563eb;color:#fff}
        .comm-input-row button:disabled{opacity:.45;cursor:not-allowed}
        .comm-voice-preview{display:flex;align-items:center;gap:7px;flex:1;min-width:0;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:4px 6px 4px 4px;box-shadow:0 2px 8px rgba(15,23,42,.06)}
        .comm-voice-preview .comm-voice-card{min-width:0;max-width:none;flex:1;padding:5px 7px;background:transparent;border:0;box-shadow:none}
        .comm-preview-action,.comm-preview-send{width:36px!important;height:36px!important;flex:0 0 36px;border-radius:50%!important;display:grid!important;place-items:center;border:1px solid #e2e8f0!important;background:#fff!important;color:#475569!important;cursor:pointer}
        .comm-preview-action.danger{color:#dc2626!important}
        .comm-preview-send{background:#2563eb!important;border-color:#2563eb!important;color:#fff!important}
        .comm-preview-action:disabled,.comm-preview-send:disabled{opacity:.5;cursor:not-allowed}
        .comm-recording-live{display:flex;align-items:center;gap:9px;flex:1;min-width:0;background:#fff;border:1px solid #fecaca;border-radius:16px;padding:8px 10px;color:#334155}
        .comm-recording-live>span:not(.comm-recording-dot){font-size:12px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .comm-recording-dot{width:9px;height:9px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 5px rgba(239,68,68,.12);animation:comm-recording-pulse 1.2s infinite}
        .comm-stop-recording{margin-left:auto!important;width:auto!important;height:34px!important;padding:0 12px!important;border-radius:17px!important;background:#fee2e2!important;color:#b91c1c!important;border:1px solid #fecaca!important;display:flex!important;align-items:center;gap:6px;white-space:nowrap}
        @keyframes comm-recording-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.85)}}
        .comm-msg{border-radius:16px!important;box-shadow:0 2px 8px rgba(15,23,42,.06)!important;max-width:min(76%,620px)!important;padding:9px 11px!important}
        .comm-msg.in{background:#fff!important;border:1px solid #e8edf3!important}
        .comm-msg.out{background:linear-gradient(135deg,#2563eb,#1d4ed8)!important;color:#fff!important;border:none!important}
        .comm-voice-card{min-width:280px!important;max-width:410px!important;padding:10px 11px!important;border-radius:18px!important;background:#f8fafc!important;border:1px solid #e5e7eb!important;box-shadow:none!important}
        .comm-msg.out .comm-voice-card{background:rgba(255,255,255,.12)!important;border-color:rgba(255,255,255,.2)!important}
        .comm-voice-track{position:relative;height:26px;display:flex;align-items:center;overflow:hidden;border-radius:8px}
        .comm-voice-wave{position:absolute;inset:0;height:26px;margin:0;gap:3px;z-index:1;align-items:center}
        .comm-voice-wave span{width:3px;opacity:.55;background:#64748b!important;transition:opacity .15s}
        .comm-msg.out .comm-voice-wave span{background:rgba(255,255,255,.8)!important}
        .comm-voice-buffer{position:absolute;left:0;top:0;bottom:0;background:rgba(37,99,235,.10);z-index:0;border-radius:8px}
        .comm-voice-progress{position:absolute;left:0;bottom:0;height:3px;background:#2563eb;z-index:2;border-radius:4px;pointer-events:none}
        .comm-msg.out .comm-voice-progress{background:#fff}
        .comm-voice-range{position:relative;z-index:3;margin-top:-9px!important;background:transparent!important}
        .comm-voice-times{font-size:10px!important;color:#64748b!important;font-weight:600}
        .comm-msg.out .comm-voice-times{color:rgba(255,255,255,.82)!important}
        .comm-voice-error{font-size:10px;color:#dc2626;margin-top:4px}
        .comm-input-row{background:#f8fafc!important;border:1px solid #e2e8f0!important;border-radius:18px!important;padding:8px!important;box-shadow:0 6px 24px rgba(15,23,42,.08)!important}
        .comm-input-row input{background:#fff!important;border:1px solid #edf1f5!important;border-radius:18px!important;min-height:40px!important}
        .comm-input-row button,.comm-input-row .ap-btn-icon{width:40px!important;height:40px!important;background:#fff!important;border:1px solid #e5e7eb!important;color:#475569!important;transition:.18s ease}
        .comm-input-row button:hover,.comm-input-row .ap-btn-icon:hover{transform:translateY(-1px);border-color:#cbd5e1!important;background:#f8fafc!important}
        .comm-input-row button:last-child,.comm-preview-send{background:#2563eb!important;border-color:#2563eb!important;color:#fff!important}
        .comm-voice-preview{background:#fff!important;border:1px solid #dbe3ec!important;border-radius:18px!important;padding:5px!important;box-shadow:0 3px 12px rgba(15,23,42,.07)!important}
        .comm-recording-live{background:#fff!important;border:1px solid #fecaca!important;border-radius:18px!important;box-shadow:0 3px 12px rgba(220,38,38,.08)!important}
        .comm-list{background:#fff;border-right:1px solid #e8edf3!important}
        .comm-window{background:#f7f9fc!important;border:1px solid #e8edf3!important;border-radius:18px!important;overflow:hidden}
        .comm-window-head{background:#fff!important;border-bottom:1px solid #e8edf3!important;padding:14px 18px!important;min-height:62px!important;display:flex;align-items:center!important;font-weight:700!important}
        .comm-messages{background:linear-gradient(180deg,#f8fafc 0%,#f3f6fa 100%)!important;padding:18px!important}
        .comm-list-item{margin:3px 7px!important;border-radius:12px!important;transition:.16s ease!important}
        .comm-list-item:hover{background:#f4f7fb!important}
        .comm-list-item.active{background:#eef4ff!important;box-shadow:inset 3px 0 #2563eb!important}
        @media (max-width:900px){.comm-layout{grid-template-columns:250px minmax(0,1fr)!important}.comm-msg{max-width:88%!important}}
        @media (max-width:680px){.comm-layout{grid-template-columns:1fr!important}.comm-list{max-height:250px;border-right:0;border-bottom:1px solid #e8edf3}.comm-window{min-height:600px}.comm-msg{max-width:94%!important}.comm-voice-card{min-width:0!important;max-width:100%!important}.comm-input-row{position:sticky;bottom:0;z-index:5}}

      `}</style>
      <div className="ap-header">
        <div>
          <div className="ap-title">Communication</div>
          <div className="ap-subtitle">Direct chat with Telecallers or Super Admin, plus the common group.</div>
        </div>
      </div>

      {error && <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: 8 }}>{error}</div>}

      <div className="comm-layout">
        <div className="comm-list">
          <div style={{ padding: '10px 12px', fontWeight: 700, fontSize: 12, color: '#666' }}>GROUP</div>
          {participants.filter((p) => p.group).map((participant) => (
            <ChatListItem key={participant.id} participant={participant} activeChat={activeChat} setActiveChat={setActiveChat} />
          ))}

          {admins.length > 0 && <div style={{ padding: '14px 12px 8px', fontWeight: 700, fontSize: 12, color: '#666' }}>SUPER ADMIN</div>}
          {admins.map((participant) => <ChatListItem key={participant.id} participant={participant} activeChat={activeChat} setActiveChat={setActiveChat} />)}

          {telecallers.length > 0 && <div style={{ padding: '14px 12px 8px', fontWeight: 700, fontSize: 12, color: '#666' }}>TELECALLERS</div>}
          {telecallers.map((participant) => <ChatListItem key={participant.id} participant={participant} activeChat={activeChat} setActiveChat={setActiveChat} />)}
        </div>

        <div className="comm-window">
          <div className="comm-window-head">
            <span>{activeChatInfo?.name || 'Communication'}</span>
            <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 10, color: '#666' }}>
              {activeChatInfo?.group ? 'Group Chat' : activeChatInfo?.chatCategory === 'SUPER_ADMIN' ? 'Super Admin' : 'One-to-One Chat'}
            </span>
          </div>

          <div className="comm-messages">
            {loading && messages.length === 0 && <div className="ap-empty">Loading messages...</div>}
            {!loading && messages.length === 0 && <div className="ap-empty">No messages yet.</div>}
            {messages.map(renderMessage)}
            <div ref={bottomRef} />
          </div>

          <div className="comm-input-row" style={{background:'#f0f2f5',borderRadius:14,padding:8,gap:7}}>
            <label className="ap-btn-icon" style={{ cursor: sending || isRecording ? 'not-allowed' : 'pointer' }} title="Attach file">
              <FiPaperclip size={16} />
              <input type="file" accept="*/*" disabled={sending || isRecording} style={{ display: 'none' }} onChange={sendFile} />
            </label>

            {voicePreview ? (
              <div className="comm-voice-preview">
                <VoicePlayer src={voicePreview.url} duration={voicePreview.duration} />
                <button type="button" className="comm-preview-action danger" onClick={discardVoicePreview} disabled={sending} title="Discard recording">
                  ✕
                </button>
                <button type="button" className="comm-preview-action" onClick={recordAgain} disabled={sending} title="Record again">
                  <FiMic size={15} />
                </button>
                <button type="button" className="comm-preview-send" onClick={sendVoicePreview} disabled={sending} title="Send voice message">
                  <FiSend size={15} />
                </button>
              </div>
            ) : isRecording ? (
              <div className="comm-recording-live">
                <span className="comm-recording-dot" />
                <strong>{formatDuration(recordingSeconds)}</strong>
                <span>Recording voice message…</span>
                <button type="button" className="comm-stop-recording" onClick={stopRecording} disabled={sending} title="Stop recording">
                  <FiSquare size={14} /> Stop
                </button>
              </div>
            ) : (
              <>
                <button type="button" onClick={startRecording} disabled={sending} title="Record voice message">
                  <FiMic size={16} />
                </button>
                <input
                  placeholder="Type a message..."
                  value={draft}
                  disabled={sending}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <button onClick={send} disabled={sending || !draft.trim()} title="Send">
                  <FiSend size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatListItem = ({ participant, activeChat, setActiveChat }) => {
  const unread = Number(participant.unreadCount || 0);
  return (
    <div
      className={`comm-list-item ${activeChat === participant.id ? 'active' : ''}`}
      onClick={() => setActiveChat(participant.id)}
    >
      <div className="comm-avatar">{participant.group ? <FiUsers size={15} /> : initials(participant.name)}</div>
      <div className="comm-list-info">
        <div className="comm-name">
          {participant.name}
          {unread > 0 && <span style={{ marginLeft: 8, background: '#dc2626', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 10 }}>{unread}</span>}
        </div>
        <div className="comm-sub">{participant.group ? 'Group Chat' : participant.chatCategory === 'SUPER_ADMIN' ? 'Super Admin' : 'Telecaller'}</div>
      </div>
    </div>
  );
};

export default Communications;
