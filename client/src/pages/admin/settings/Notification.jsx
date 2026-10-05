import React, { useState, useEffect, useCallback, memo, useRef } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    BellRing
} from 'lucide-react';
import Tabs from '../../../components/button/Tabs';
import { Navbar } from '../../../components/admin/AdminNavBar';
import AdminService from '../../../services/admin-api-service/AdminService';
import MessageModal from '../../../components/common/MessageModal';

// Separate memoized form component to prevent re-renders
const NotificationForm = memo(({
    formData,
    errors = {},
    handleInputChange,
    handlePublish,
    handleCancel,
    branches,
    branchesLoading,
    isSubmitting,
    isEditMode,
    editingNotification,
    selectedBranches,
    setSelectedBranches,
    isBranchDropdownOpen,
    setIsBranchDropdownOpen,
    branchDropdownRef,
    // Audience selection props
    batches,
    batchesLoading,
    interns,
    internsLoading,
    selectedBatches,
    selectedInterns,
    batchSearchTerm,
    internSearchTerm,
    handleBatchSearch,
    handleInternSearch,
    handleBatchSelect,
    handleInternSelect,
    handleClearAllBatches,
    handleClearAllInterns,
    filteredBatches,
    filteredInterns,
    // Courses and categories props
    courses,
    coursesLoading,
    selectedCourses,
    courseSearchTerm,
    handleCourseSearch,
    handleCourseSelect,
    handleClearAllCourses,
    filteredCourses,
    categories,
    categoriesLoading,
    selectedCategories,
    categorySearchTerm,
    handleCategorySearch,
    handleCategorySelect,
    handleClearAllCategories,
    filteredCategories
}) => (
    <div className="p-4 sm:p-6 lg:p-8 bg-white rounded-lg h-full shadow-lg">
        <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {isEditMode ? `Edit Notification - ${editingNotification?.title}` : 'Create New Notification'}
            </h3>
        </div>
        <div className="space-y-4 sm:space-y-6">
            {/* Notification Title Input */}
            <div className="flex flex-col">
                <label htmlFor="notification-title" className="text-sm text-gray-600 mb-2">
                    Notification Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="notification-title"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                    placeholder="Enter Notification Title"
                    className={`p-3 bg-gray-100 text-gray-800 rounded-xl border ${
                        errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#F9A825]'
                    } focus:outline-none focus:ring-2`}
                    autoComplete="off"
                />
                {errors.title && <span className="text-red-500 text-xs mt-1 font-medium">{errors.title}</span>}
            </div>

            {/* Notification Content Textarea */}
            <div className="flex flex-col">
                <label htmlFor="notification-content" className="text-sm text-gray-600 mb-2">
                    Notification Content <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="notification-content"
                    name="content"
                    value={formData.content || ''}
                    onChange={handleInputChange}
                    placeholder="Enter The Details Of The Notification"
                    rows="5"
                    className={`p-3 bg-gray-100 text-gray-800 rounded-xl resize-none border ${
                        errors.content ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#F9A825]'
                    } focus:outline-none focus:ring-2`}
                    autoComplete="off"
                ></textarea>
                {errors.content && <span className="text-red-500 text-xs mt-1 font-medium">{errors.content}</span>}
            </div>

            {/* Type, Audience and Branch Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col">
                    <label htmlFor="notification-type" className="text-sm text-gray-600 mb-2">
                        Type of Notification <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="notification-type"
                        name="type"
                        value={formData.type || ''}
                        onChange={handleInputChange}
                        className={`p-3 bg-gray-100 text-gray-800 rounded-xl border ${
                            errors.type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#F9A825]'
                        } focus:outline-none focus:ring-2 appearance-none`}
                    >
                        <option value="">Choose Type</option>
                        <option value="Task Notification">Task Notification</option>
                        <option value="Weekly Schedule">Weekly Schedule</option>
                        <option value="Common Notification">Common Notification</option>
                        <option value="Announcement">Announcement</option>
                        <option value="Reminder">Reminder</option>
                    </select>
                    {errors.type && <span className="text-red-500 text-xs mt-1 font-medium">{errors.type}</span>}
                </div>
                <div className="flex flex-col relative" ref={branchDropdownRef}>
                    <label className="text-sm text-gray-600 mb-2">
                        Select Branches <span className="text-red-500">*</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                        className={`p-3 flex justify-between items-center bg-gray-100 text-gray-800 rounded-xl border ${
                            errors.branch ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#F9A825]'
                        } focus:outline-none focus:ring-2 text-left min-h-[46px]`}
                    >
                        <span className="text-sm block truncate">
                            {selectedBranches.length > 0
                                ? `${selectedBranches.length} Branch${selectedBranches.length > 1 ? 'es' : ''} Selected`
                                : "Select Branches"}
                        </span>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    {errors.branch && <span className="text-red-500 text-xs mt-1 font-medium">{errors.branch}</span>}

                    {isBranchDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg z-50 border border-gray-200 max-h-60 overflow-y-auto p-2 space-y-1">
                            {branchesLoading ? (
                                <p className="text-sm text-gray-500 p-2">Loading branches...</p>
                            ) : branches.length === 0 ? (
                                <p className="text-sm text-gray-500 p-2">No active branches available</p>
                            ) : (
                                branches.map(branch => {
                                    const isSelected = selectedBranches.some(b => b._id === branch._id);
                                    return (
                                        <label
                                            key={branch._id}
                                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer select-none"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                    let newBranches;
                                                    if (isSelected) {
                                                        newBranches = selectedBranches.filter(b => b._id !== branch._id);
                                                    } else {
                                                        newBranches = [...selectedBranches, branch];
                                                    }
                                                    setSelectedBranches(newBranches);
                                                }}
                                                className="h-4 w-4 text-[#F9A825] border-gray-300 rounded focus:ring-[#F9A825]"
                                            />
                                            <span className="text-sm text-gray-700">{branch.branchName}</span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                    <label htmlFor="audience" className="text-sm text-gray-600 mb-2">
                        Select Audience <span className="text-red-500">*</span> {selectedBranches.length === 0 && <span className="text-xs text-red-500 font-normal ml-2">(Select branches first)</span>}
                    </label>
                    <select
                        id="audience"
                        name="audience"
                        value={formData.audience || ''}
                        onChange={handleInputChange}
                        className={`p-3 bg-gray-100 text-gray-800 rounded-xl border ${
                            errors.audience ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#F9A825]'
                        } focus:outline-none focus:ring-2 appearance-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                        disabled={selectedBranches.length === 0}
                    >
                        {selectedBranches.length === 0 ? (
                            <option value="">Choose branches first</option>
                        ) : (
                            <>
                                <option value="">Choose Audience</option>
                                <option value="All interns">All interns</option>
                                <option value="By batches">By batches</option>
                                <option value="By Courses">By Courses</option>
                                <option value="By Category">By Category</option>
                                <option value="Individual interns">Individual interns</option>
                            </>
                        )}
                    </select>
                    {errors.audience && <span className="text-red-500 text-xs mt-1 font-medium">{errors.audience}</span>}
                </div>
            </div>

        </div>

        {/* Audience Selection Section */}
        <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                <h4 className="text-base sm:text-lg font-medium text-gray-900">Audience Selection</h4>
                {errors.audienceDetails && (
                    <span className="text-red-500 text-xs font-medium bg-red-50 px-3 py-1 rounded-lg border border-red-100 animate-pulse">
                        {errors.audienceDetails}
                    </span>
                )}
            </div>

            {/* Intern Search Section - Only show when Individual interns or All interns is selected */}
            {(formData.audience === 'Individual interns' || formData.audience === 'All interns') && (
                <div className="mt-4 sm:mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Search Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Interns</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={internSearchTerm}
                                    onChange={(e) => handleInternSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F9A825] focus:border-transparent"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Search Results */}
                            <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                {internsLoading ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F9A825] mx-auto mb-2"></div>
                                        Loading interns...
                                    </div>
                                ) : filteredInterns.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        {internSearchTerm ? 'No interns found matching your search.' : 'No interns available.'}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredInterns.map((intern) => {
                                            const isSelected = selectedInterns.find(selected => selected._id === intern._id);
                                            return (
                                                <div
                                                    key={intern._id}
                                                    onClick={() => handleInternSelect(intern)}
                                                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${isSelected ? 'bg-[#F9A825]/10 border-[#F9A825]/20' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{intern.fullName}</div>
                                                            <div className="text-xs text-gray-500">{intern.email}</div>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-[#F9A825] border-[#F9A825]' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Interns */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Selected Interns ({selectedInterns.length})
                                </label>
                                {selectedInterns.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAllInterns}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-3">
                                {selectedInterns.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4">
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                                        </svg>
                                        No interns selected
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedInterns.map((intern) => (
                                            <div key={intern._id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-blue-600 font-medium text-sm">
                                                            {intern.fullName?.charAt(0)?.toUpperCase() || 'I'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{intern.fullName}</div>
                                                        <div className="text-xs text-gray-500">{intern.email}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleInternSelect(intern)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                                                    title="Remove from selection"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Search Section - Only show when By batches is selected */}
            {formData.audience === 'By batches' && (
                <div className="mt-4 sm:mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Search Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Batches</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by batch name or description..."
                                    value={batchSearchTerm}
                                    onChange={(e) => handleBatchSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F9A825] focus:border-transparent"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Search Results */}
                            <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                {batchesLoading ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F9A825] mx-auto mb-2"></div>
                                        Loading batches...
                                    </div>
                                ) : filteredBatches.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        {batchSearchTerm ? 'No batches found matching your search.' : 'No batches available.'}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredBatches.map((batch) => {
                                            const isSelected = selectedBatches.find(selected => selected._id === batch._id);
                                            return (
                                                <div
                                                    key={batch._id}
                                                    onClick={() => handleBatchSelect(batch)}
                                                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${isSelected ? 'bg-[#F9A825]/10 border-[#F9A825]/20' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{batch.batchName}</div>
                                                            <div className="text-xs text-gray-500">{batch.description || 'No description'}</div>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-[#F9A825] border-[#F9A825]' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Batches */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Selected Batches ({selectedBatches.length})
                                </label>
                                {selectedBatches.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAllBatches}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-3">
                                {selectedBatches.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4">
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                        </svg>
                                        No batches selected
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedBatches.map((batch) => (
                                            <div key={batch._id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-green-50 transition-colors">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-green-600 font-medium text-sm">
                                                            {batch.batchName?.charAt(0)?.toUpperCase() || 'B'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{batch.batchName}</div>
                                                        <div className="text-xs text-gray-500">{batch.description || 'No description'}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleBatchSelect(batch)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                                                    title="Remove from selection"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Course Search Section - Only show when By Courses is selected */}
            {formData.audience === 'By Courses' && (
                <div className="mt-4 sm:mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Search Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Courses</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by course name..."
                                    value={courseSearchTerm}
                                    onChange={(e) => handleCourseSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F9A825] focus:border-transparent"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Search Results */}
                            <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                {coursesLoading ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F9A825] mx-auto mb-2"></div>
                                        Loading courses...
                                    </div>
                                ) : filteredCourses.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        {courseSearchTerm ? 'No courses found matching your search.' : 'No courses available.'}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredCourses.map((course) => {
                                            const isSelected = selectedCourses.find(selected => selected._id === course._id);
                                            return (
                                                <div
                                                    key={course._id}
                                                    onClick={() => handleCourseSelect(course)}
                                                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${isSelected ? 'bg-[#F9A825]/10 border-[#F9A825]/20' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                                                            <div className="text-xs text-gray-500">{course.duration}</div>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-[#F9A825] border-[#F9A825]' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Courses */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Selected Courses ({selectedCourses.length})
                                </label>
                                {selectedCourses.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAllCourses}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-3">
                                {selectedCourses.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4">
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.433 9.496 5 8 5c-4 0-8 3-8 8s4 8 8 8c.94 0 1.841-.213 2.684-.606m3.56-5.894C15.687 7.159 15.589 8 15 8s-1.5-.5-1.5-.5V5a2 2 00-2-2h-2c-1.5 0-2 1-2 2v2.5M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.402 2.572-1.065z"></path>
                                        </svg>
                                        No courses selected
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedCourses.map((course) => (
                                            <div key={course._id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-purple-600 font-medium text-sm">
                                                            {course.courseName?.charAt(0)?.toUpperCase() || 'C'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCourseSelect(course)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                                                    title="Remove from selection"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Search Section - Only show when By Category is selected */}
            {formData.audience === 'By Category' && (
                <div className="mt-4 sm:mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Search Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Categories</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by category name..."
                                    value={categorySearchTerm}
                                    onChange={(e) => handleCategorySearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F9A825] focus:border-transparent"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Search Results */}
                            <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                {categoriesLoading ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F9A825] mx-auto mb-2"></div>
                                        Loading categories...
                                    </div>
                                ) : filteredCategories.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        {categorySearchTerm ? 'No categories found matching your search.' : 'No categories available.'}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredCategories.map((category) => {
                                            const isSelected = selectedCategories.find(selected => selected._id === category._id);
                                            return (
                                                <div
                                                    key={category._id}
                                                    onClick={() => handleCategorySelect(category)}
                                                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${isSelected ? 'bg-[#F9A825]/10 border-[#F9A825]/20' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{category.categoryName}</div>
                                                        </div>
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-[#F9A825] border-[#F9A825]' : 'border-gray-300'
                                                            }`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Categories */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Selected Categories ({selectedCategories.length})
                                </label>
                                {selectedCategories.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAllCategories}
                                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-3">
                                {selectedCategories.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4">
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.433 9.496 5 8 5c-4 0-8 3-8 8s4 8 8 8c.94 0 1.841-.213 2.684-.606m3.56-5.894C15.687 7.159 15.589 8 15 8s-1.5-.5-1.5-.5V5a2 2 00-2-2h-2c-1.5 0-2 1-2 2v2.5M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.402 2.572-1.065z"></path>
                                        </svg>
                                        No categories selected
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedCategories.map((category) => (
                                            <div key={category._id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:bg-green-50 transition-colors">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-green-600 font-medium text-sm">
                                                            {category.categoryName?.charAt(0)?.toUpperCase() || 'C'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{category.categoryName}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCategorySelect(category)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                                                    title="Remove from selection"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
                onClick={handleCancel}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-200 transition-colors duration-200"
            >
                Cancel
            </button>
            <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-white font-medium bg-[#F9A825] rounded-xl hover:bg-[#F9A825] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Notification' : 'Publish')}
            </button>
        </div>
    </div>
));

export const Notification = () => {

    const [activeTab, setActiveTab] = useState('notifications');
    const [errors, setErrors] = useState({});

    // AdminService for fetching data
    const { getBranchesData, createNotification, getBatchesData, getCoursesData, getCategoriesData, getInternsData, getNotificationsData, updateNotification, deleteNotification } = AdminService();

    // State for branches
    const [branches, setBranches] = useState([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

    // State for audience selection (similar to TaskManagement)
    const [batches, setBatches] = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [interns, setInterns] = useState([]);
    const [internsLoading, setInternsLoading] = useState(false);

    // Search terms for audience selection
    const [batchSearchTerm, setBatchSearchTerm] = useState('');
    const [internSearchTerm, setInternSearchTerm] = useState('');

    // Selected items for audience selection
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [selectedInterns, setSelectedInterns] = useState([]);

    // States for courses
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [courseSearchTerm, setCourseSearchTerm] = useState('');
    const [selectedCourses, setSelectedCourses] = useState([]);

    // States for categories
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);

    // State for form data
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: '',
        audience: '',
        pushNotification: true
    });

    // State for modal
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for notifications list
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState('');

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState(null);

    // State for edit/delete functionality
    const [editingNotification, setEditingNotification] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState(null);


    const [exporting, setExporting] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState('');
    const [filterAudience, setFilterAudience] = useState('');
    const [filterBranch, setFilterBranch] = useState('');

    // View modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingNotification, setViewingNotification] = useState(null);

    // Fetch branches from backend
    const fetchBranches = async () => {
        try {
            setBranchesLoading(true);
            const response = await getBranchesData();

            if (response?.data) {
                setBranches(response.data);
                console.log('Branches loaded:', response.data.length, 'branches available');
            }
        } catch (err) {
            console.error('Failed to load branches:', err);
        } finally {
            setBranchesLoading(false);
        }
    };

    // Fetch batches from backend
    const fetchBatches = async () => {
        try {
            setBatchesLoading(true);
            const branchIds = selectedBranches.map(b => b._id).join(',');
            const res = await getBatchesData(`page=1&limit=10000${branchIds ? `&branch=${branchIds}` : ''}`);
            const batchesData = res?.data || [];
            if (Array.isArray(batchesData)) {
                setBatches(batchesData);
            } else {
                setBatches([]);
            }
        } catch (err) {
            console.error('Failed to load batches:', err);
            setBatches([]);
        } finally {
            setBatchesLoading(false);
        }
    };

    // Fetch courses from backend
    const fetchCourses = async () => {
        try {
            setCoursesLoading(true);
            const res = await getCoursesData('page=1&limit=10000');
            const coursesData = res?.data || [];
            if (Array.isArray(coursesData)) {
                setCourses(coursesData);
            } else {
                setCourses([]);
            }
        } catch (err) {
            console.error('Failed to load courses:', err);
            setCourses([]);
        } finally {
            setCoursesLoading(false);
        }
    };

    // Fetch categories from backend
    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const res = await getCategoriesData('page=1&limit=10000');
            const categoriesData = res?.data || [];
            if (Array.isArray(categoriesData)) {
                setCategories(categoriesData);
            } else {
                setCategories([]);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    // Fetch interns from backend
    const fetchInterns = async () => {
        try {
            setInternsLoading(true);
            const branchIds = selectedBranches.map(b => b._id).join(',');
            const res = await getInternsData(`page=1&limit=10000&courseStatus=Ongoing${branchIds ? `&branch=${branchIds}` : ''}`);
            const internsData = res?.data || [];
            if (Array.isArray(internsData)) {
                setInterns(internsData);
            } else {
                setInterns([]);
            }
        } catch (err) {
            console.error('Failed to load interns:', err);
            setInterns([]);
        } finally {
            setInternsLoading(false);
        }
    };

    // Fetch notifications from backend
    const fetchNotifications = async (page = currentPage) => {
        try {
            setNotificationsLoading(true);
            setNotificationsError('');
            const res = await getNotificationsData(page, 5, {
                type: filterType || '',
                audience: filterAudience || '',
                branch: filterBranch || ''
            });

            if (res?.data && res?.pagination) {
                setNotifications(res.data);
                setPaginationInfo(res.pagination);
                setCurrentPage(res.pagination.currentPage);
            } else {
                setNotifications([]);
                setPaginationInfo(null);
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
            setNotificationsError('Failed to load notifications');
            setNotifications([]);
            setPaginationInfo(null);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const branchDropdownRef = useRef(null);

    // Load branches and notifications when component mounts
    useEffect(() => {
        fetchBranches();
        fetchNotifications();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
                setIsBranchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedBranches.length > 0) {
            // Clear batches that don't match selected branches
            setSelectedBatches(prev => prev.filter(batch => {
                const branchId = batch.branch?._id || batch.branch;
                return selectedBranches.some(b => b._id === branchId);
            }));

            // Clear interns that don't match selected branches
            setSelectedInterns(prev => prev.filter(intern => {
                const branchId = intern.branch?._id || intern.branch;
                return selectedBranches.some(b => b._id === branchId);
            }));

            // Clear categories that don't match selected branches
            setSelectedCategories(prev => prev.filter(category => {
                return selectedBranches.some(b => {
                    const catBranches = category.branch || [];
                    return catBranches.some(cb => {
                        const cbId = cb?._id || cb;
                        return b._id === cbId;
                    });
                });
            }));

            // Fetch filtered data based on active audience type when branches are toggled
            if (formData.audience === 'Individual interns' || formData.audience === 'All interns') {
                fetchInterns();
            } else if (formData.audience === 'By batches') {
                fetchBatches();
            } else if (formData.audience === 'By Category') {
                fetchCategories();
            }
        } else {
            // If no branches are selected, clear audience selection and form audience field
            setSelectedBatches([]);
            setSelectedInterns([]);
            setSelectedCourses([]);
            setSelectedCategories([]);
            setFormData(prev => ({ ...prev, audience: '' }));
        }
    }, [selectedBranches, formData.audience]);

    useEffect(() => {
        if (formData.audience === 'All interns' && interns.length > 0) {
            const ongoingInterns = interns.filter(intern => {
                const branchId = intern.branch?._id || intern.branch;
                const matchesBranch = selectedBranches.some(b => b._id === branchId);
                return intern.courseStatus === 'Ongoing' && matchesBranch;
            });
            setSelectedInterns(ongoingInterns);
        }
    }, [formData.audience, interns, selectedBranches]);

    const isFirstRender = useRef(true);

    // Refetch when filters change (backend-driven)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        fetchNotifications(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType, filterAudience, filterBranch]);


    const tabOptions = [
        { value: "notifications", label: "Notifications" },
        { value: "new-notification", label: "New Notification" }
    ];
    const headData = "Notification";

    // Handle form input changes
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;

        // Clear error for the current field as the user types/interacts
        setErrors(prevErrors => {
            if (!prevErrors[name] && !prevErrors.audienceDetails) return prevErrors;
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            if (name === 'audience') {
                delete newErrors.audienceDetails;
            }
            return newErrors;
        });

        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            // Clear selections when audience changes
            if (name === 'audience') {
                setSelectedBatches([]);
                setSelectedInterns([]);
                setSelectedCourses([]);
                setSelectedCategories([]);
                setBatchSearchTerm('');
                setInternSearchTerm('');
                setCourseSearchTerm('');
                setCategorySearchTerm('');

                // Fetch data based on audience selection
                if ((value === 'Individual interns' || value === 'All interns') && interns.length === 0) {
                    fetchInterns();
                } else if (value === 'By batches' && batches.length === 0) {
                    fetchBatches();
                } else if (value === 'By Courses' && courses.length === 0) {
                    fetchCourses();
                } else if (value === 'By Category' && categories.length === 0) {
                    fetchCategories();
                }
            }

            return newData;
        });
    }, [interns.length, batches.length, courses.length, categories.length]);

    // Form validation logic
    const validateForm = useCallback(() => {
        const newErrors = {};
        
        if (!formData.title?.trim()) {
            newErrors.title = 'Notification title is required';
        } else if (formData.title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters long';
        } else if (formData.title.trim().length > 100) {
            newErrors.title = 'Title must not exceed 100 characters';
        }

        if (!formData.content?.trim()) {
            newErrors.content = 'Notification content is required';
        } else if (formData.content.trim().length < 10) {
            newErrors.content = 'Content must be at least 10 characters long';
        }

        if (!formData.type) {
            newErrors.type = 'Notification type is required';
        }

        if (selectedBranches.length === 0) {
            newErrors.branch = 'At least one branch must be selected';
        }

        if (!formData.audience) {
            newErrors.audience = 'Audience selection is required';
        } else {
            if (formData.audience === 'By batches' && selectedBatches.length === 0) {
                newErrors.audienceDetails = 'Please select at least one batch';
            } else if (formData.audience === 'Individual interns' && selectedInterns.length === 0) {
                newErrors.audienceDetails = 'Please select at least one intern';
            } else if (formData.audience === 'By Courses' && selectedCourses.length === 0) {
                newErrors.audienceDetails = 'Please select at least one course';
            } else if (formData.audience === 'By Category' && selectedCategories.length === 0) {
                newErrors.audienceDetails = 'Please select at least one category';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, selectedBranches, selectedBatches, selectedInterns, selectedCourses, selectedCategories]);

    // Function to handle form submission
    const handlePublish = useCallback(async () => {
        try {
            // Validate form
            const isValid = validateForm();
            if (!isValid) {
                setModalMessage('Please correct the highlighted errors in the form.');
                setShowModal(true);
                return;
            }

            setIsSubmitting(true);

            // Prepare data for API
            const notificationData = {
                title: formData.title,
                content: formData.content,
                type: formData.type,
                audience: formData.audience,
                branch: selectedBranches.map(b => b._id),
                pushNotification: formData.pushNotification,
                batches: selectedBatches.length > 0 ? selectedBatches.map(batch => batch._id) : [],
                courses: selectedCourses.length > 0 ? selectedCourses.map(course => course._id) : [],
                categories: selectedCategories.length > 0 ? selectedCategories.map(cat => cat._id) : [],
                interns: [], // This field is for general interns, not individual ones
                individualInterns: selectedInterns.length > 0 ? selectedInterns.map(intern => intern._id) : []
            };

            // Call API to create or update notification
            let response;
            if (isEditMode && editingNotification) {
                // Update existing notification
                response = await updateNotification(editingNotification._id, notificationData);
            } else {
                // Create new notification
                response = await createNotification(notificationData);
            }

            if (response?.data) {
                setModalMessage(isEditMode ? 'Notification updated successfully!' : 'Notification published successfully!');
                setShowModal(true);
                // Reset form
                setFormData({
                    title: '',
                    content: '',
                    type: '',
                    audience: '',
                    pushNotification: true
                });
                setErrors({}); // Reset error messages
                // Clear all selected items
                setSelectedBatches([]);
                setSelectedInterns([]);
                setSelectedBranches([]);
                setSelectedCourses([]);
                setSelectedCategories([]);
                setBatchSearchTerm('');
                setInternSearchTerm('');
                setCourseSearchTerm('');
                setCategorySearchTerm('');
                // Clear edit mode
                setEditingNotification(null);
                setIsEditMode(false);
                // Refresh notifications list
                await fetchNotifications(currentPage);
                // Switch to notifications tab to see the notification
                setActiveTab('notifications');
            }
        } catch (error) {
            console.error('Error creating notification:', error);
            setModalMessage(error.response?.data?.message || 'Failed to create notification. Please try again.');
            setShowModal(true);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, createNotification, isEditMode, editingNotification, selectedBatches, selectedInterns, selectedBranches, selectedCourses, selectedCategories, currentPage, fetchNotifications, validateForm]);

    // Function to handle form cancellation
    const handleCancel = useCallback(() => {
        if (isEditMode) {
            setModalMessage('Notification update cancelled.');
        } else {
            setModalMessage('Notification creation cancelled.');
        }
        setShowModal(true);
        // Reset form
        setFormData({
            title: '',
            content: '',
            type: '',
            audience: '',
            pushNotification: true
        });
        setErrors({}); // Reset error messages
        // Clear all selected items
        setSelectedBatches([]);
        setSelectedInterns([]);
        setSelectedBranches([]);
        setSelectedCourses([]);
        setSelectedCategories([]);
        setBatchSearchTerm('');
        setInternSearchTerm('');
        setCourseSearchTerm('');
        setCategorySearchTerm('');
        // Clear edit mode
        setEditingNotification(null);
        setIsEditMode(false);
        // Switch to notifications tab
        setActiveTab('notifications');
    }, [isEditMode]);

    // Audience selection handler functions (similar to TaskManagement)
    const handleBatchSearch = useCallback((searchTerm) => {
        setBatchSearchTerm(searchTerm);
    }, []);

    const handleBatchSelect = useCallback((batch) => {
        const isSelected = selectedBatches.find(selected => selected._id === batch._id);
        let updated;
        if (isSelected) {
            updated = selectedBatches.filter(selected => selected._id !== batch._id);
        } else {
            updated = [...selectedBatches, batch];
        }
        setSelectedBatches(updated);

        // Clear error if selection is valid
        if (updated.length > 0) {
            setErrors(prev => {
                if (!prev.audienceDetails) return prev;
                const newErrors = { ...prev };
                delete newErrors.audienceDetails;
                return newErrors;
            });
        }
    }, [selectedBatches]);



    const handleInternSearch = useCallback((searchTerm) => {
        setInternSearchTerm(searchTerm);
    }, []);

    const handleInternSelect = useCallback((intern) => {
        const isSelected = selectedInterns.find(selected => selected._id === intern._id);
        let updated;
        if (isSelected) {
            updated = selectedInterns.filter(selected => selected._id !== intern._id);
        } else {
            updated = [...selectedInterns, intern];
        }
        setSelectedInterns(updated);

        // Clear error if selection is valid
        if (updated.length > 0) {
            setErrors(prev => {
                if (!prev.audienceDetails) return prev;
                const newErrors = { ...prev };
                delete newErrors.audienceDetails;
                return newErrors;
            });
        }
    }, [selectedInterns]);

    // Clear all functions
    const handleClearAllBatches = useCallback(() => {
        setSelectedBatches([]);
    }, []);



    const handleClearAllInterns = useCallback(() => {
        setSelectedInterns([]);
    }, []);

    const handleCourseSearch = useCallback((searchTerm) => {
        setCourseSearchTerm(searchTerm);
    }, []);

    const handleCourseSelect = useCallback((course) => {
        const isSelected = selectedCourses.find(selected => selected._id === course._id);
        let updated;
        if (isSelected) {
            updated = selectedCourses.filter(selected => selected._id !== course._id);
        } else {
            updated = [...selectedCourses, course];
        }
        setSelectedCourses(updated);

        // Clear error if selection is valid
        if (updated.length > 0) {
            setErrors(prev => {
                if (!prev.audienceDetails) return prev;
                const newErrors = { ...prev };
                delete newErrors.audienceDetails;
                return newErrors;
            });
        }
    }, [selectedCourses]);

    const handleClearAllCourses = useCallback(() => {
        setSelectedCourses([]);
    }, []);

    const handleCategorySearch = useCallback((searchTerm) => {
        setCategorySearchTerm(searchTerm);
    }, []);

    const handleCategorySelect = useCallback((category) => {
        const isSelected = selectedCategories.find(selected => selected._id === category._id);
        let updated;
        if (isSelected) {
            updated = selectedCategories.filter(selected => selected._id !== category._id);
        } else {
            updated = [...selectedCategories, category];
        }
        setSelectedCategories(updated);

        // Clear error if selection is valid
        if (updated.length > 0) {
            setErrors(prev => {
                if (!prev.audienceDetails) return prev;
                const newErrors = { ...prev };
                delete newErrors.audienceDetails;
                return newErrors;
            });
        }
    }, [selectedCategories]);

    const handleClearAllCategories = useCallback(() => {
        setSelectedCategories([]);
    }, []);

    // Edit notification handler
    const handleEditNotification = useCallback((notification) => {
        setEditingNotification(notification);
        setIsEditMode(true);
        setErrors({}); // Reset error messages

        // Populate form data
        setFormData({
            title: notification.title || '',
            content: notification.content || '',
            type: notification.type || '',
            audience: notification.audience || '',
            pushNotification: notification.pushNotification !== undefined ? notification.pushNotification : true
        });

        // Clear all selections first
        setSelectedBatches([]);
        setSelectedInterns([]);
        setSelectedBranches([]);
        setSelectedCourses([]);
        setSelectedCategories([]);
        setBatchSearchTerm('');
        setInternSearchTerm('');
        setCourseSearchTerm('');
        setCategorySearchTerm('');

        // Set selected branches based on notification branch array
        if (notification.branch) {
            const branchArray = Array.isArray(notification.branch) ? notification.branch : [notification.branch];
            const selectedBranchObjects = branchArray.map(b => {
                if (typeof b === 'object' && b._id) {
                    return b;
                } else {
                    return branches.find(x => x._id === b);
                }
            }).filter(Boolean);
            setSelectedBranches(selectedBranchObjects);
        }

        // Set selected items based on notification data
        if (notification.audience === "By batches" && notification.batches && notification.batches.length > 0) {
            const selectedBatchObjects = notification.batches.map(batch => {
                if (typeof batch === 'object' && batch._id) {
                    return batch;
                } else {
                    return batches.find(b => b._id === batch);
                }
            }).filter(Boolean);
            setSelectedBatches(selectedBatchObjects);
        }

        if (notification.audience === "By Courses" && notification.courses && notification.courses.length > 0) {
            const selectedCourseObjects = notification.courses.map(course => {
                if (typeof course === 'object' && course._id) {
                    return course;
                } else {
                    return courses.find(c => c._id === course);
                }
            }).filter(Boolean);
            setSelectedCourses(selectedCourseObjects);
        }

        if (notification.audience === "By Category" && notification.categories && notification.categories.length > 0) {
            const selectedCategoryObjects = notification.categories.map(category => {
                if (typeof category === 'object' && category._id) {
                    return category;
                } else {
                    return categories.find(c => c._id === category);
                }
            }).filter(Boolean);
            setSelectedCategories(selectedCategoryObjects);
        }

        if ((notification.audience === "Individual interns" || notification.audience === "All interns") && notification.individualInterns && notification.individualInterns.length > 0) {
            const selectedInternObjects = notification.individualInterns.map(intern => {
                if (typeof intern === 'object' && intern._id) {
                    return intern;
                } else {
                    return interns.find(i => i._id === intern);
                }
            }).filter(Boolean);
            setSelectedInterns(selectedInternObjects);
        }

        // Load data if needed based on audience type
        if ((notification.audience === "Individual interns" || notification.audience === "All interns") && interns.length === 0) {
            fetchInterns();
        }
        if (notification.audience === "By batches" && batches.length === 0) {
            fetchBatches();
        }
        if (notification.audience === "By Courses" && courses.length === 0) {
            fetchCourses();
        }
        if (notification.audience === "By Category" && categories.length === 0) {
            fetchCategories();
        }

        setActiveTab('new-notification');
    }, [batches, interns, branches, courses, categories]);

    // Cancel edit handler
    const handleCancelEdit = useCallback(() => {
        setEditingNotification(null);
        setIsEditMode(false);
        setFormData({
            title: '',
            content: '',
            type: '',
            audience: '',
            pushNotification: true
        });
        setErrors({}); // Reset error messages
        setSelectedBatches([]);
        setSelectedInterns([]);
        setSelectedBranches([]);
        setSelectedCourses([]);
        setSelectedCategories([]);
        setBatchSearchTerm('');
        setInternSearchTerm('');
        setCourseSearchTerm('');
        setCategorySearchTerm('');
        setActiveTab('notifications');
    }, []);

    const handleTabChange = useCallback((tabName) => {
        if (tabName === 'notifications') {
            handleCancelEdit();
        } else {
            setErrors({}); // Reset error messages
            setActiveTab(tabName);
        }
    }, [handleCancelEdit]);

    // Delete notification handler
    const handleDeleteClick = useCallback((notification) => {
        setNotificationToDelete(notification);
        setShowDeleteModal(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!notificationToDelete) return;

        try {
            setIsSubmitting(true);
            setModalMessage('');

            const response = await deleteNotification(notificationToDelete._id);

            console.log(response, "deleteNotification");
            if (response?.status === 200 || response?.status === 201) {
                setModalMessage('Notification deleted successfully!');
                setShowModal(true);
                // Refresh the notifications list
                await fetchNotifications(currentPage);
                // Close modal
                setShowDeleteModal(false);
                setNotificationToDelete(null);
            } else {
                throw new Error('Delete request failed with status: ' + response?.status);
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            setModalMessage(error?.response?.data?.message || 'Failed to delete notification. Please try again.');
            setShowModal(true);
        } finally {
            setIsSubmitting(false);
        }
    }, [notificationToDelete, deleteNotification]);

    const handleDeleteCancel = useCallback(() => {
        setShowDeleteModal(false);
        setNotificationToDelete(null);
    }, []);

    const handleViewNotification = useCallback((notification) => {
        setViewingNotification(notification);
        setShowViewModal(true);
    }, []);

    const closeViewModal = useCallback(() => {
        setShowViewModal(false);
        setViewingNotification(null);
    }, []);



    // Pagination handlers
    const handlePageChange = useCallback((page) => {
        if (paginationInfo && page >= 1 && page <= paginationInfo.totalPages) {
            setCurrentPage(page);
            fetchNotifications(page);
        }
    }, [paginationInfo]);

    const handleNextPage = useCallback(() => {
        if (paginationInfo && paginationInfo.hasNextPage) {
            handlePageChange(currentPage + 1);
        }
    }, [currentPage, paginationInfo, handlePageChange]);

    const handlePrevPage = useCallback(() => {
        if (paginationInfo && paginationInfo.hasPrevPage) {
            handlePageChange(currentPage - 1);
        }
    }, [currentPage, paginationInfo, handlePageChange]);

    // Filtered data for search
    const filteredBatches = batches.filter(batch => {
        const branchId = batch.branch?._id || batch.branch;
        const matchesBranch = selectedBranches.some(b => b._id === branchId);
        const matchesSearch = batch.batchName?.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
                              batch.description?.toLowerCase().includes(batchSearchTerm.toLowerCase());
        return matchesBranch && matchesSearch;
    });



    const filteredInterns = interns.filter(intern => {
        const branchId = intern.branch?._id || intern.branch;
        const matchesBranch = selectedBranches.some(b => b._id === branchId);
        const matchesSearch = intern.fullName?.toLowerCase().includes(internSearchTerm.toLowerCase()) ||
                              intern.email?.toLowerCase().includes(internSearchTerm.toLowerCase());
        const isOngoing = intern.courseStatus === 'Ongoing';
        return matchesBranch && matchesSearch && isOngoing;
    });

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.courseName?.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                              course.description?.toLowerCase().includes(courseSearchTerm.toLowerCase());
        return matchesSearch;
    });

    const filteredCategories = categories.filter(category => {
        const matchesSearch = category.categoryName?.toLowerCase().includes(categorySearchTerm.toLowerCase());
        const matchesBranch = selectedBranches.length > 0 && (
            !category.branch ||
            category.branch.length === 0 ||
            selectedBranches.some(b => {
                const catBranches = category.branch || [];
                return catBranches.some(cb => {
                    const cbId = cb?._id || cb;
                    return b._id === cbId;
                });
            })
        );
        return matchesSearch && matchesBranch;
    });

    // Component for the "Notifications" list view
    const NotificationsView = () => {
        if (notificationsLoading) {
            return (
                <div className="flex items-center justify-center p-6 sm:p-12 bg-white rounded-lg h-full shadow-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#F9A825] mx-auto mb-4"></div>
                        <p className="text-xs sm:text-sm text-gray-500">Loading notifications...</p>
                    </div>
                </div>
            );
        }

        if (notificationsError) {
            return (
                <div className="flex items-center justify-center p-6 sm:p-12 bg-white rounded-lg sm:rounded-3xl h-full shadow-lg">
                    <div className="text-center text-red-500 px-4">
                        <BellRing className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
                        <h2 className="text-lg sm:text-2xl font-bold mb-2 text-red-600">Error Loading Notifications</h2>
                        <p className="text-sm sm:text-lg text-red-500 mb-4">{notificationsError}</p>
                        <button
                            onClick={fetchNotifications}
                            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#F9A825] text-white rounded-lg hover:bg-[#F9A825]/90 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        if (notifications.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white rounded-lg h-full shadow-lg">
                    <div className="text-center text-gray-400 px-4">
                        <BellRing className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
                        <h2 className="text-lg sm:text-2xl font-bold mb-2 text-gray-800">No notifications available.</h2>
                        <p className="text-sm sm:text-lg text-gray-600">Please add notification to view them here.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                        {/* <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Notifications</h2>
                        {paginationInfo && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                {paginationInfo.displayInfo?.showing} of {paginationInfo.displayInfo?.total} notifications
                            </p>
                        )} */}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => fetchNotifications(currentPage)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#F9A825] text-white rounded-lg hover:bg-[#F9A825]/90 transition-colors flex items-center justify-center"
                        >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            Refresh
                        </button>
                        <button
                            onClick={() => handleExport()}
                            disabled={notificationsLoading || exporting || notifications.length === 0}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            {exporting ? 'Exporting...' : 'Export PDF'}
                        </button>
                    </div>
                </div>
                {/* Filters Row */}
                <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F9A825]"
                    >
                        <option value="">All Types</option>
                        <option value="Task Notification">Task Notification</option>
                        <option value="Weekly Schedule">Weekly Schedule</option>
                        <option value="Common Notification">Common Notification</option>
                        <option value="Announcement">Announcement</option>
                        <option value="Reminder">Reminder</option>
                    </select>
                    <select
                        value={filterAudience}
                        onChange={(e) => setFilterAudience(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F9A825]"
                    >
                        <option value="">All Audience</option>
                        <option value="All interns">All interns</option>
                        <option value="By batches">By batches</option>
                        <option value="By Courses">By Courses</option>
                        <option value="By Category">By Category</option>
                        <option value="Individual interns">Individual interns</option>
                    </select>
                    <select
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F9A825]"
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => (
                            <option key={b._id} value={b._id}>{b.branchName}</option>
                        ))}
                    </select>
                    <div className="flex items-center">
                        <button
                            onClick={() => { setFilterType(''); setFilterAudience(''); setFilterBranch(''); fetchNotifications(1); }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white hover:bg-gray-50"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th scope="col" className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Audience
                                </th>
                                <th scope="col" className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Branch
                                </th>
                                <th scope="col" className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th scope="col" className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {notifications.map((notification) => {
                                return (
                                    <React.Fragment key={notification._id}>
                                        {/* Main row */}
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-left">
                                                <div className="flex items-center justify-start">
                                                    <div className="w-8 h-8 bg-[#F9A825]/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                                        <BellRing className="w-4 h-4 text-[#F9A825]" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={notification.title}>
                                                            {notification.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500 max-w-xs truncate" title={notification.content}>
                                                            {notification.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {notification.type}
                                                </span>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    {notification.audience}
                                                </span>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                                                {Array.isArray(notification.branch) && notification.branch.length > 0 ? (
                                                    <div className="flex flex-wrap justify-center gap-1">
                                                        {notification.branch.map((b, idx) => (
                                                            <span key={b._id || idx} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                {b.branchName || b}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : notification.branch && !Array.isArray(notification.branch) ? (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {notification.branch.branchName || notification.branch}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center">
                                                <div>
                                                    <div>{notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}</div>
                                                    <div className="text-[10px] sm:text-xs">{notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString() : 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewNotification(notification)}
                                                        className="text-blue-600 hover:text-blue-900 font-medium px-1"
                                                        title="View notification details"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditNotification(notification)}
                                                        className="text-orange-600 hover:text-orange-900 font-medium px-1"
                                                        title="Edit notification"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(notification)}
                                                        className="text-red-600 hover:text-red-900 font-medium px-1"
                                                        title="Delete notification"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {notifications.map((notification) => {
                        return (
                            <div key={notification._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center mb-2">
                                            <div className="w-8 h-8 bg-[#F9A825]/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                                <BellRing className="w-4 h-4 text-[#F9A825]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate" title={notification.title}>
                                                    {notification.title}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate mt-1" title={notification.content}>
                                                    {notification.content}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {notification.type}
                                            </span>
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                {notification.audience}
                                            </span>
                                            {Array.isArray(notification.branch) && notification.branch.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {notification.branch.map((b, idx) => (
                                                        <span key={b._id || idx} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                            {b.branchName || b}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : notification.branch && !Array.isArray(notification.branch) ? (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    {notification.branch.branchName || notification.branch}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'} {notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleViewNotification(notification)}
                                        className="w-full text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded font-medium transition-colors"
                                    >
                                        View
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleEditNotification(notification)}
                                            className="text-xs text-[#F9A825] hover:text-[#F9A825]/80 bg-[#F9A825]/10 hover:bg-[#F9A825]/20 px-3 py-2 rounded font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(notification)}
                                            className="text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-2 rounded font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                {paginationInfo && paginationInfo.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-3 bg-white border-t border-gray-200">
                        <div className="flex items-center text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                            <span>
                                Showing {paginationInfo.displayInfo?.showing} of {paginationInfo.displayInfo?.total} results
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Previous Button */}
                            <button
                                onClick={handlePrevPage}
                                disabled={!paginationInfo.hasPrevPage || notificationsLoading}
                                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${paginationInfo.hasPrevPage && !notificationsLoading
                                        ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                                        : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                                    }`}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                                {notificationsLoading ? 'Loading...' : 'Previous'}
                            </button>

                            {/* Current Page Info */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                    Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
                                </span>
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={handleNextPage}
                                disabled={!paginationInfo.hasNextPage || notificationsLoading}
                                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 flex items-center ${paginationInfo.hasNextPage && !notificationsLoading
                                        ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                                        : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                                    }`}
                            >
                                {notificationsLoading ? 'Loading...' : 'Next'}
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            // Fetch all notifications (bypass pagination)
            let all = [];
            try {
                const res = await getNotificationsData(1, 10000, {
                    type: filterType || '',
                    audience: filterAudience || '',
                    branch: filterBranch || ''
                });
                if (Array.isArray(res?.data)) {
                    all = res.data;
                }
            } catch (e) {
                // fallback to current page if bulk fetch fails
                all = notifications || [];
            }
            if (!all.length) {
                setExporting(false);
                return;
            }
            const doc = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(247, 147, 30);
            const title = 'Notifications Report';
            doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 15);

            // Meta
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const exportedOn = `Exported on: ${new Date().toLocaleDateString('en-GB')}`;
            const totalText = `Total Notifications: ${all.length}`;
            doc.text(exportedOn, (pageWidth - doc.getTextWidth(exportedOn)) / 2, 22);
            doc.text(totalText, (pageWidth - doc.getTextWidth(totalText)) / 2, 27);

            const tableData = all.map(n => [
                n.title || 'N/A',
                n.type || 'N/A',
                n.audience || 'N/A',
                (n.branch?.branchName || (typeof n.branch === 'string' ? n.branch : '-') || '-'),
                (n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB') : 'N/A')
            ]);

            autoTable(doc, {
                startY: 35,
                head: [['Title', 'Type', 'Audience', 'Branch', 'Created']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [247, 147, 30], textColor: 255, fontStyle: 'bold', fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
                    1: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
                    2: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
                    3: { cellWidth: 'auto', halign: 'left', fontSize: 8 },
                    4: { cellWidth: 'auto', halign: 'center', fontSize: 8 },
                },
                styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', lineWidth: 0.1 },
                margin: { left: 10, right: 10 },
                tableWidth: 'auto'
            });

            // Page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(128, 128, 128);
                const text = `Page ${i} of ${pageCount}`;
                doc.text(text, (pageWidth - doc.getTextWidth(text)) / 2, doc.internal.pageSize.getHeight() - 8);
            }

            doc.save(`notifications_export_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
            setExporting(false);
        }
    }, [getNotificationsData, notifications]);

    return (
        <>
            <Navbar headData={headData} activeTab={activeTab}>
                <Tabs tabs={tabOptions} activeTab={activeTab} setActiveTab={handleTabChange} />
            </Navbar>
            <div className="flex-1">
                {activeTab === 'notifications' && <NotificationsView />}
                {activeTab === 'new-notification' && (
                    <NotificationForm
                        formData={formData}
                        errors={errors}
                        handleInputChange={handleInputChange}
                        handlePublish={handlePublish}
                        handleCancel={handleCancel}
                        branches={branches}
                        branchesLoading={branchesLoading}
                        isSubmitting={isSubmitting}
                        isEditMode={isEditMode}
                        editingNotification={editingNotification}
                        // Branch multi-select props
                        selectedBranches={selectedBranches}
                        setSelectedBranches={setSelectedBranches}
                        isBranchDropdownOpen={isBranchDropdownOpen}
                        setIsBranchDropdownOpen={setIsBranchDropdownOpen}
                        branchDropdownRef={branchDropdownRef}
                        // Audience selection props
                        batches={batches}
                        batchesLoading={batchesLoading}
                        interns={interns}
                        internsLoading={internsLoading}
                        selectedBatches={selectedBatches}
                        selectedInterns={selectedInterns}
                        batchSearchTerm={batchSearchTerm}
                        internSearchTerm={internSearchTerm}
                        handleBatchSearch={handleBatchSearch}
                        handleInternSearch={handleInternSearch}
                        handleBatchSelect={handleBatchSelect}
                        handleInternSelect={handleInternSelect}
                        handleClearAllBatches={handleClearAllBatches}
                        handleClearAllInterns={handleClearAllInterns}
                        filteredBatches={filteredBatches}
                        filteredInterns={filteredInterns}
                        // Courses and categories props
                        courses={courses}
                        coursesLoading={coursesLoading}
                        selectedCourses={selectedCourses}
                        courseSearchTerm={courseSearchTerm}
                        handleCourseSearch={handleCourseSearch}
                        handleCourseSelect={handleCourseSelect}
                        handleClearAllCourses={handleClearAllCourses}
                        filteredCourses={filteredCourses}
                        categories={categories}
                        categoriesLoading={categoriesLoading}
                        selectedCategories={selectedCategories}
                        categorySearchTerm={categorySearchTerm}
                        handleCategorySearch={handleCategorySearch}
                        handleCategorySelect={handleCategorySelect}
                        handleClearAllCategories={handleClearAllCategories}
                        filteredCategories={filteredCategories}
                    />
                )}
            </div>

            {/* Message Modal */}
            <MessageModal
                show={showModal}
                message={modalMessage}
                onClose={() => setShowModal(false)}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            {/* Modal Header */}
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Delete Notification
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Are you sure you want to delete this notification? This action cannot be undone.
                                </p>

                                {notificationToDelete && (
                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <p className="text-sm font-medium text-gray-900">{notificationToDelete.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {notificationToDelete.type} • {notificationToDelete.audience}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleDeleteCancel}
                                    className="w-full sm:flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F9A825]"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="w-full sm:flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Deleting...
                                        </div>
                                    ) : (
                                        'Delete Notification'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Notification Details Modal */}
            {showViewModal && viewingNotification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                            <div className="flex justify-between items-start gap-3">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1 min-w-0">{viewingNotification.title}</h1>
                                <button
                                    onClick={closeViewModal}
                                    className="flex items-center gap-1 text-xs sm:text-sm border border-gray-300 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                    <span className="hidden sm:inline">Close</span>
                                </button>
                            </div>
                        </div>
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs sm:text-sm">
                                <p className="leading-6"><span className="font-semibold text-gray-900">Type:</span> <span className="text-gray-600">{viewingNotification.type || 'N/A'}</span></p>
                                <p className="leading-6"><span className="font-semibold text-gray-900">Audience:</span> <span className="text-gray-600">{viewingNotification.audience || 'N/A'}</span></p>
                                <p className="leading-6"><span className="font-semibold text-gray-900">Branch:</span> <span className="text-gray-600">
                                    {Array.isArray(viewingNotification.branch)
                                        ? viewingNotification.branch.map(b => typeof b === 'object' ? b.branchName : b).join(', ')
                                        : viewingNotification.branch?.branchName || (typeof viewingNotification.branch === 'string' ? viewingNotification.branch : 'N/A')
                                    }
                                </span></p>

                                <p className="leading-6"><span className="font-semibold text-gray-900">Created:</span> <span className="text-gray-600">{viewingNotification.createdAt ? new Date(viewingNotification.createdAt).toLocaleString() : 'N/A'}</span></p>
                                {viewingNotification._id && (
                                    <p className="leading-6"><span className="font-semibold text-gray-900">ID:</span> <span className="text-gray-600">{viewingNotification._id.slice(-6)}</span></p>
                                )}
                            </div>

                            {viewingNotification.content && (
                                <div className="mt-4">
                                    <h2 className="text-[#F9A825] font-semibold mb-2 text-base italic">Content</h2>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">{viewingNotification.content}</p>
                                </div>
                            )}

                            {(viewingNotification.batches?.length || viewingNotification.courses?.length || viewingNotification.categories?.length || viewingNotification.individualInterns?.length) ? (
                                <div className="mt-5">
                                    <h2 className="text-[#F9A825] font-semibold mb-3 text-base italic">Target Audience Details</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(viewingNotification.batches) && viewingNotification.batches.map((b, i) => (
                                            <span key={`b-${i}`} className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full border border-green-200">
                                                {typeof b === 'object' ? b.batchName : b}
                                            </span>
                                        ))}
                                        {Array.isArray(viewingNotification.courses) && viewingNotification.courses.map((c, i) => (
                                            <span key={`c-${i}`} className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full border border-purple-200">
                                                {typeof c === 'object' ? c.courseName : c}
                                            </span>
                                        ))}
                                        {Array.isArray(viewingNotification.categories) && viewingNotification.categories.map((cat, i) => (
                                            <span key={`cat-${i}`} className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full border border-indigo-200">
                                                {typeof cat === 'object' ? cat.categoryName : cat}
                                            </span>
                                        ))}
                                        {Array.isArray(viewingNotification.individualInterns) && viewingNotification.individualInterns.map((s, i) => (
                                            <span key={`i-${i}`} className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full border border-blue-200">
                                                {typeof s === 'object' ? (s.fullName || s.email || s._id?.slice(-4)) : s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-top border-gray-200">
                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                                <button
                                    onClick={closeViewModal}
                                    className="w-full sm:w-auto bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        closeViewModal();
                                        handleEditNotification(viewingNotification);
                                    }}
                                    className="w-full sm:w-auto bg-[#F9A825] text-white px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-[#d89100] transition-colors"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
