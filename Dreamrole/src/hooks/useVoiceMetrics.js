import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * useVoiceMetrics
 * Tracks live voice metrics via Web Audio API + Web Speech API.
 * Returns real-time confidence score, pace, pause count, and live transcript.
 *
 * @param {boolean} active - start/stop listening
 * @returns {{ transcript, interimTranscript, confidenceScore, paceWPM, pauseCount, isListening, startListening, stopListening, resetTranscript }}
 */
export function useVoiceMetrics(active = false) {
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [confidenceScore, setConfidenceScore] = useState(75) // default mid-range
    const [paceWPM, setPaceWPM] = useState(0)
    const [pauseCount, setPauseCount] = useState(0)
    const [isListening, setIsListening] = useState(false)
    const [avgVolume, setAvgVolume] = useState(0)

    const recognitionRef = useRef(null)
    const audioCtxRef = useRef(null)
    const analyserRef = useRef(null)
    const streamRef = useRef(null)
    const volumeFrameRef = useRef(null)
    const wordCountRef = useRef(0)
    const startTimeRef = useRef(null)
    const lastSpeechRef = useRef(Date.now())
    const pauseThresholdMs = 2000 // 2 second silence = a pause

    const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

    // ── Web Speech API Setup ────────────────────────────────────────────────
    const setupRecognition = useCallback(() => {
        if (!isSupported) return null

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event) => {
            let finalText = ''
            let interimText = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                const text = result[0].transcript
                const conf = result[0].confidence || 0.8

                if (result.isFinal) {
                    finalText += text + ' '
                    wordCountRef.current += text.trim().split(/\s+/).length
                    lastSpeechRef.current = Date.now()

                    // Update confidence (rolling average)
                    setConfidenceScore(prev => Math.round((prev + conf * 100) / 2))
                } else {
                    interimText = text
                }
            }

            if (finalText) {
                setTranscript(prev => prev + finalText)
                setInterimTranscript('')
            } else {
                setInterimTranscript(interimText)
            }
        }

        recognition.onspeechend = () => {
            const silenceDuration = Date.now() - lastSpeechRef.current
            if (silenceDuration > pauseThresholdMs) {
                setPauseCount(prev => prev + 1)
            }
        }

        recognition.onerror = (e) => {
            if (e.error !== 'no-speech') console.warn('[VoiceMetrics] Speech error:', e.error)
        }

        return recognition
    }, [isSupported])

    // ── Web Audio API — Volume/Amplitude Tracking ───────────────────────────
    const startAudioAnalysis = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            streamRef.current = stream

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            audioCtxRef.current = audioCtx

            const analyser = audioCtx.createAnalyser()
            analyserRef.current = analyser
            analyser.fftSize = 256

            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyser)

            const dataArray = new Uint8Array(analyser.frequencyBinCount)
            let volumeSum = 0
            let volumeSamples = 0

            const measureVolume = () => {
                analyser.getByteFrequencyData(dataArray)
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
                const normalized = Math.round((avg / 255) * 100)
                setAvgVolume(normalized)
                volumeSum += normalized
                volumeSamples++
                volumeFrameRef.current = requestAnimationFrame(measureVolume)
            }
            volumeFrameRef.current = requestAnimationFrame(measureVolume)
        } catch (err) {
            console.warn('[VoiceMetrics] Microphone access denied:', err.message)
        }
    }, [])

    // ── Pace Calculation (words per minute) ─────────────────────────────────
    useEffect(() => {
        if (!isListening) return
        const interval = setInterval(() => {
            if (!startTimeRef.current) return
            const minutesElapsed = (Date.now() - startTimeRef.current) / 60000
            if (minutesElapsed > 0) {
                setPaceWPM(Math.round(wordCountRef.current / minutesElapsed))
            }
        }, 3000)
        return () => clearInterval(interval)
    }, [isListening])

    const startListening = useCallback(async () => {
        if (isListening) return
        setTranscript('')
        setInterimTranscript('')
        setPauseCount(0)
        wordCountRef.current = 0
        startTimeRef.current = Date.now()
        lastSpeechRef.current = Date.now()

        await startAudioAnalysis()

        const recognition = setupRecognition()
        if (recognition) {
            recognitionRef.current = recognition
            recognition.start()
        }
        setIsListening(true)
    }, [isListening, setupRecognition, startAudioAnalysis])

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop()
        if (volumeFrameRef.current) cancelAnimationFrame(volumeFrameRef.current)
        if (audioCtxRef.current) audioCtxRef.current.close()
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
        setIsListening(false)
        setInterimTranscript('')
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
        wordCountRef.current = 0
        startTimeRef.current = Date.now()
    }, [])

    // Auto-start/stop based on active prop
    useEffect(() => {
        if (active && !isListening) startListening()
        if (!active && isListening) stopListening()
    }, [active])

    // Cleanup on unmount
    useEffect(() => () => stopListening(), [])

    return {
        transcript,
        interimTranscript,
        confidenceScore,
        paceWPM,
        pauseCount,
        avgVolume,
        isListening,
        isSupported,
        startListening,
        stopListening,
        resetTranscript
    }
}
