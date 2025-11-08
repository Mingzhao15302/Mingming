import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface LayoutProps {
  sidebarOpen: boolean
  onSidebarToggle: () => void
  children: ReactNode
}

const Layout = ({ sidebarOpen, onSidebarToggle, children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen text-white">
      <Sidebar isOpen={sidebarOpen} onClose={onSidebarToggle} />
      <div className="flex-1 flex flex-col bg-transparent/60">
        <TopBar onMenuClick={onSidebarToggle} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

export default Layout
