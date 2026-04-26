import React from "react";

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setActiveTab(tab.value)}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
            activeTab === tab.value
              ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
