import { useState } from "react";
import Sidebar, { Navbar } from "../../admin/AdminNavBar"
import AdminNavBar from "../../admin/AdminNavBar"
import { Menu } from "lucide-react";


const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-gray-100 font-sans antialiased h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-30">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-semibold text-gray-800">Softronics</span>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout