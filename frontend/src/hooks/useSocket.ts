import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://oijaba-server.vercel.app'

type UseSocketOptions = {
  role: 'rider' | 'driver'
  userId: string | null
  enabled?: boolean
}

export function useSocket({ role, userId, enabled = true }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enabled || !userId) return

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      // Join the appropriate room
      if (role === 'rider') {
        socket.emit('join:rider', userId)
      } else {
        socket.emit('join:driver', userId)
      }
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [role, userId, enabled])

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = socketRef.current
    if (!socket) return () => {}
    socket.on(event, handler)
    return () => { socket.off(event, handler) }
  }, [])

  return { socket: socketRef.current, isConnected, emit, on }
}

export default useSocket
