"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface UserData {
  userId: string
  name: string
  email: string
  _id?: string // add _id
  role?: string // add role
  // add more fields as needed
}

interface AuthContextType {
  token: string | null
  userData: UserData | null
  isAuth: boolean
  setToken: (token: string | null) => void
  setUserData: (data: UserData | null) => void
  logout: () => void
  loading: boolean // add loading
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  userData: null,
  isAuth: false,
  setToken: () => {},
  setUserData: () => {},
  logout: () => {},
  loading: true, // default loading true
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null)
  const [userData, setUserDataState] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (storedToken) {
      setTokenState(storedToken)
      // Fetch user data from API using the token
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch user data")
          return res.json()
        })
        .then((data) => {
          setUserDataState({ userId: data.userId, email: data.email, _id: data._id, role: data.role, name: data.name })
        })
        .catch(() => {
          setUserDataState(null)
          setTokenState(null)
          localStorage.removeItem("token")
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const setToken = (token: string | null) => {
    setTokenState(token)
    if (token) {
      localStorage.setItem("token", token)
      // Fetch user data from API when setting token
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch user data")
          return res.json()
        })
        .then((data) => {
          setUserDataState({ userId: data.userId, email: data.email, _id: data._id, role: data.role, name: data.name })
        })
        .catch(() => {
          setUserDataState(null)
          setTokenState(null)
          localStorage.removeItem("token")
        })
    } else {
      localStorage.removeItem("token")
      setUserDataState(null)
    }
  }

  const setUserData = (data: UserData | null) => {
    setUserDataState(data)
  }

  const logout = () => {
    setToken(null)
    setUserData(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        userData,
        isAuth: !!token,
        setToken,
        setUserData,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
