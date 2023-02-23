import React, { useState, useRef, useEffect } from 'react'
import Spinner from './spinner'

function AudioPlayer() {
  const [audioFile, setAudioFile] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)

  const [loading, setLoading] = useState(false)
  const [transcription, setTranscription] = useState([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(0)
  const [lang, setLang] = useState('english')

  const audioPlayerRef = useRef(null)

  useEffect(() => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.play()
      } else {
        audioPlayerRef.current.pause()
      }
    }
  }, [isPlaying])

  const handleFileChange = (event) => {
    setAudioFile(event.target.files[0])
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioUrl(URL.createObjectURL(event.target.files[0]))
  }

  const handleAudioClick = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    setCurrentTime(audioPlayerRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    setDuration(audioPlayerRef.current.duration)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const form = new FormData()
    form.append('audio', audioFile, audioFile.name)
    form.append('language_behaviour', 'manual')
    form.append('language', lang)
    form.append('noise_reduction', 'true')

    setLoading(true)

    fetch('https://api.gladia.io/audio/text/audio-transcription/', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-gladia-key': import.meta.env.VITE_GLADIA_KEY
      },
      body: form
    })
      .then(response => response.json())
      .then(data => {
        setTranscription(data.prediction)
        setLoading(false)
      })
      .catch(error => {
        console.log(error)
        setLoading(false)
      })
  }

  useEffect(() => {
    if (audioUrl && currentTime !== duration) {
      const interval = setInterval(() => {
        const currentTimeEffectStart = transcription[currentTranscriptIndex].time_begin
        const currentTimeEffectEnd = transcription[currentTranscriptIndex].time_end
        if (currentTime.toFixed(2) > currentTimeEffectStart && currentTime.toFixed(2) < currentTimeEffectEnd) {
          setCurrentTranscript(transcription[currentTranscriptIndex])
          setCurrentTranscriptIndex(currentTranscriptIndex + 1)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [currentTime])

  return (
    <div>
      {(audioUrl && !loading && transcription.length > 0)
        ? (
          <div>
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onClick={handleAudioClick}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            <h2>{audioFile.name} Karaoke</h2>
            {isPlaying && (
              <button onClick={handleAudioClick}>Pausar</button>
            )}
            {!isPlaying && (
              <button onClick={handleAudioClick}>Reproducir Karaoke</button>
            )}
            {/* <p>Tiempo actual: {currentTime.toFixed(2)}</p>
        <p>Duración: {duration.toFixed(2)}</p> */}
            {currentTranscript && (
              <>
                {currentTranscript.transcription.split(/(?=[A-Z])/).map((item, index) => (
                  <h4 className='active' key={item + index}>{item}</h4>
                ))}
                {transcription[currentTranscriptIndex + 1] && (
                  transcription[currentTranscriptIndex + 1].transcription.split(/(?=[A-Z])/).map((item, index) => (
                    <h5 className='inactive' key={item + index}>{item}</h5>
                  ))
                )}
              </>
            )}
          </div>
          )
        : (
          <form onSubmit={handleSubmit}>
            <input style={{ cursor: 'pointer' }} type='file' onChange={handleFileChange} required />
            <select style={{ padding: '0.5rem', cursor: 'pointer' }} name='lang' value={lang} onChange={e => setLang(e.target.value)} required>
              <option value=''>--Select Language--</option>
              <option value='english'>English</option>
              <option value='spanish'>Spanish</option>
              <option value='chinese'>Chinese</option>
              <option value='korean'>Korean</option>
              <option value='japanese'>Japanese</option>
            </select>
            <button type='submit'>Cargar Karaoke</button>
            {loading && <Spinner />}
          </form>
          )}
    </div>
  )
}

export default AudioPlayer
