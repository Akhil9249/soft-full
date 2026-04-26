import React, { useState } from 'react'
import Tabs from '../../../components/button/Tabs';
import { Navbar } from '../../../components/admin/AdminNavBar';

export const StaticPages = () => {

  const [activeTab, setActiveTab] = useState('pages');



  const tabOptions = [
    { value: "pages", label: "Pages" },
    { value: "newPage", label: "New Page" }
  ];
  const headData = "Settings";
  // A single component for all SVG icons to improve code reusability and readability
  const Icon = ({ path, className, viewBox = "0 0 24 24" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path}></path>
    </svg>
  );

  const EyeIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7.94 4.5 4.14 7.22 2.5 12c1.64 4.78 5.44 7.5 9.5 7.5s7.86-2.72 9.5-7.5c-1.64-4.78-5.44-7.5-9.5-7.5zM12 17a5 5 010-10 5 5 010 10zM12 14.5a2.5 2.5 010-5 2.5 2.5 010 5z" />
    </svg>
  );

  const Sidebar = () => (
    <div className="w-64 bg-white shadow-xl min-h-screen p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-2 mb-8">
          <img src="https://placehold.co/40x40" alt="Softronics Logo" className="rounded-lg" />
          <span className="text-xl font-bold">Softronics.</span>
        </div>
        <nav className="space-y-2">
          <a href="#" className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <Icon path="M3 12h18M3 6h18M3 18h18" className="w-5 h-5 mr-3" />
            Dashboard
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <Icon path="M9 5H7a2 2 000-2v2a2 2 000 2h2zM9 9H7a2 2 000-2v2a2 2 000 2h2zM9 13H7a2 2 000-2v2a2 2 000 2h2zM9 17H7a2 2 000-2v2a2 2 000 2h2zM17 5h-2a2 2 000-2v2a2 2 000 2h2zM17 9h-2a2 2 000-2v2a2 2 000 2h2zM17 13h-2a2 2 000-2v2a2 2 000 2h2zM17 17h-2a2 2 000-2v2a2 2 000 2h2z" className="w-5 h-5 mr-3" />
            Administration
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 ml-auto" />
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <Icon path="M10 21h7a2 2 000-2V9a2 2 000-2H7a2 2 000-2v11zM7 21a2 2 010-2h2a2 2 001 2v2a2 2 001-2v-2h-2z" className="w-5 h-5 mr-3" />
            Course management
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 ml-auto" />
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <Icon path="M12 6.25a.75.75 001.5 0v-4.5a.75.75 00-1.5 0v4.5zM12 12.25a.75.75 001.5 0v-4.5a.75.75 00-1.5 0v4.5zM12 18.25a.75.75 001.5 0v-4.5a.75.75 00-1.5 0v4.5z" className="w-5 h-5 mr-3" />
            Syllabus Management
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 ml-auto" />
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-5 h-5 mr-3" />
            Task Management
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 ml-auto" />
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
            <Icon path="M9 5l7 7-7 7" className="w-5 h-5 mr-3" />
            Schedule
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 ml-auto" />
          </a>
          <a href="#" className="flex items-center p-3 rounded-lg text-orange-500 bg-orange-100 font-bold">
            <Icon path="M12 6.25a.75.75 001.5 0v-4.5a.75.75 00-1.5 0v4.5zM12 12.25a.75.75 001.5 0v-4.5a.75.75 00-1.5 0v4.5zM12 18.25a.75.75 001.5 0v-4.5a.75.75 00-1.5 0v4.5z" className="w-5 h-5 mr-3" />
            Settings
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 ml-auto" />
          </a>
          <div className="pl-6 space-y-2">
            <a href="#" className="flex items-center p-2 rounded-lg text-gray-700 hover:bg-gray-100">Branch</a>
            <a href="#" className="flex items-center p-2 rounded-lg text-gray-700 hover:bg-gray-100">Sub Module</a>
            <a href="#" className="flex items-center p-2 rounded-lg text-orange-500 bg-orange-100 font-bold">Static Page</a>
            <a href="#" className="flex items-center p-2 rounded-lg text-gray-700 hover:bg-gray-100">Notification</a>
          </div>
        </nav>
      </div>
      <div className="border-t pt-4">
        <a href="#" className="flex items-center p-3 rounded-lg text-red-500 hover:bg-red-50">
          <Icon path="M9 5l7 7-7 7" className="w-5 h-5 mr-3" />
          Log Out
        </a>
      </div>
    </div>
  );

  const Header = () => (
    <header className="flex justify-between items-center p-6 bg-white shadow-sm rounded-lg mb-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">Settings &gt; Static Pages</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Icon path="M16 7a4 4 011-8 4 4 01-1 8zM12 14a7 7 000 14h-1c-2.8 0-5-2.2-5-5a7 7 000-14z" className="w-6 h-6 text-gray-500" />
          <div className="flex flex-col text-sm">
            <span className="font-medium text-gray-900">Priyash</span>
            <span className="text-xs text-gray-500">Super Admin</span>
          </div>
        </div>
        <img src="https://placehold.co/40x40" alt="Profile" className="w-10 h-10 rounded-full" />
      </div>
    </header>
  );

  const renderContent = () => {
    return (
      <>
       <Navbar headData={headData} activeTab={activeTab} />
       <div className="mb-6">
              <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

        <div className=" bg-gray-100 min-h-screen font-sans flex-1">

         
          <div className="bg-white p-6 rounded-xl shadow-lg">

          

            {activeTab === 'pages' ? (
              <div className="flex items-center justify-center h-96 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500 text-center">No data available. Please add Page to view them here</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Menu Name</label>
                    <input type="text" placeholder="Enter Menu Name" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Page Title</label>
                    <input type="text" placeholder="Enter Page Title" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Page Slug</label>
                    <input type="text" placeholder="Enter Page Slug" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3" />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">Page Content</label>
                  <textarea placeholder="Enter Page Content" rows="8" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3"></textarea>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">Meta Keyword</label>
                  <input type="text" placeholder="Enter Meta Keyword" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3" />
                </div>

                <div className="flex justify-end space-x-4">
                  <button className="py-3 px-6 rounded-lg text-red-500 border border-red-500 hover:bg-red-50">Cancel</button>
                  <button className="py-3 px-6 rounded-lg text-white bg-orange-500 hover:bg-orange-600">Create Page</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {renderContent()}
    </>
  )
}
