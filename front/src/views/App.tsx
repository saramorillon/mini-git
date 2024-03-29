import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SessionProvider } from '../contexts/SessionContext'
import { NavOutlet, PrivateOutlet, PublicOutlet } from './components/Outlet'
import { Branches } from './pages/Branches'
import { Commit } from './pages/Commit'
import { Commits } from './pages/Commits'
import { Login } from './pages/Login'
import { Repos } from './pages/Repos'
import { Tree } from './pages/Tree'
import { User } from './pages/User'
import { Users } from './pages/Users'

export function App(): JSX.Element | null {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOutlet />}>
            <Route index element={<Login />} />
          </Route>

          <Route element={<PrivateOutlet />}>
            <Route path="/" element={<Repos />} />

            <Route path="/repo/:repo/:branch">
              <Route path="tree" element={<NavOutlet page="tree" breadcrumb element={<Tree />} />} />
              <Route path="commits" element={<NavOutlet page="commits" breadcrumb element={<Commits />} />} />
              <Route path="commit/:hash" element={<NavOutlet page="commits" breadcrumb element={<Commit />} />} />
              <Route path="branches" element={<NavOutlet page="branches" element={<Branches />} />} />
            </Route>

            <Route path="users" element={<Users />} />
            <Route path="user" element={<User />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  )
}
