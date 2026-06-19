import { useEffect, useRef, useState, useCallback } from 'react'
import * as faceapi from 'face-api.js'

const EMOTION_LABELS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']

const EMOTION_EMOJI = {
    happy: '😊', neutral: '😐', sad: '😟', angry: '😠',
    fearful: '😨', surprised: '😮', disgusted: '😒'
}

const EMOTION_COLOR = {
    happy: '#22c55e', neutral: '#64748b', sad: '#3b82f6',
    angry: '#ef4444', fearful: '#a855f7', surprised: '#f59e0b', disgusted: '#6b7280'
}

/**
 * useEmotionDetection
 * Detects facial emotions from a video element using face-api.js (npm).
 * Models load from /models/ (local) with CDN fallback.
 */
export function useEmotionDetection(videoRef, active = false) {
    const [isReady, setIsReady] = useState(false)
    const [dominantEmotion, setDominantEmotion] = useState('neutral')
    const [emotionScores, setEmotionScores] = useState({})
    const [confidence, setConfidence] = useState(0)
    const [emotionTimeline, setEmotionTimeline] = useState([])
    const [error, setError] = useState(null)

    const intervalRef = useRef(null)
    const sessionStartRef = useRef(Date.now())
    const loadedRef = useRef(false)

    // Load face-api models (from npm package — no CDN script needed)
    useEffect(() => {
        if (loadedRef.current) return
        loadedRef.current = true

        const loadModels = async () => {
            // Try local models first
            const LOCAL = '/models'
            const CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

            for (const url of [LOCAL, CDN]) {
                try {
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri(url),
                        faceapi.nets.faceExpressionNet.loadFromUri(url),
                    ])
                    setIsReady(true)
                    console.log(`[EmotionDetection] Models loaded from ${url === LOCAL ? 'local' : 'CDN'} ✅`)
                    return
                } catch (e) {
                    console.warn(`[EmotionDetection] Failed to load from ${url}:`, e.message)
                }
            }
            setError('Could not load emotion models. Emotion detection unavailable.')
        }

        loadModels()

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    // Start/stop detection loop
    useEffect(() => {
        if (!isReady || !active || !videoRef.current) return

        sessionStartRef.current = Date.now()
        setEmotionTimeline([])

        intervalRef.current = setInterval(async () => {
            const video = videoRef.current
            if (!video || video.readyState < 2) return

            try {
                const detection = await faceapi
                    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceExpressions()

                if (detection?.expressions) {
                    const scores = detection.expressions
                    const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
                    const [emotion, conf] = top

                    setDominantEmotion(emotion)
                    setConfidence(Math.round(conf * 100))
                    setEmotionScores(scores)

                    const ts = Date.now() - sessionStartRef.current
                    setEmotionTimeline(prev => [...prev, { timestamp: ts, emotion, confidence: Math.round(conf * 100) }])
                }
            } catch (e) {
                // Silently ignore single-frame errors
            }
        }, 800)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isReady, active, videoRef])

    const getDominantEmotionsSummary = useCallback(() => {
        if (emotionTimeline.length === 0) return ['neutral']
        const counts = {}
        emotionTimeline.forEach(({ emotion }) => {
            counts[emotion] = (counts[emotion] || 0) + 1
        })
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([e]) => e)
    }, [emotionTimeline])

    return {
        dominantEmotion,
        emotionScores,
        confidence,
        emotionTimeline,
        isReady,
        error,
        getDominantEmotionsSummary,
        EMOTION_EMOJI,
        EMOTION_COLOR
    }
}
