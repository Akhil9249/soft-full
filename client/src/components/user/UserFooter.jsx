import React from 'react'
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";


const UserFooter = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Support Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Support</h3>
            <p className="text-gray-400 mt-2">Address</p>
            <p className="text-gray-400">email@gmail.com</p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              {/* {["Home", "Destinations", "Activities", "Travel Tips", "Contact Us"].map((item) => ( */}
              {["Travel Tips", "Contact Us"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition duration-300" style={{ textDecoration: "none" }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

      {/* Social Media Section */}
<div className="flex flex-col items-center ">
  <h3 className="text-lg font-semibold text-gray-200">Follow Us</h3>
  <div className="flex gap-6 mt-4">
    <a href="#" className="text-gray-400 hover:text-blue-500 transition duration-300">
      <Facebook size={24} className="hover:scale-110 transition-transform" />
    </a>
    <a href="#" className="text-gray-400 hover:text-blue-400 transition duration-300">
      <Twitter size={24} className="hover:scale-110 transition-transform" />
    </a>
    <a href="#" className="text-gray-400 hover:text-pink-500 transition duration-300">
      <Instagram size={24} className="hover:scale-110 transition-transform" />
    </a>
    <a href="#" className="text-gray-400 hover:text-blue-700 transition duration-300">
      <Linkedin size={24} className="hover:scale-110 transition-transform" />
    </a>
  </div>
</div>
        </div>

        {/* Large Branding Text */}
        <div className="text-center text-4xl md:text-6xl font-extrabold mt-12 tracking-wider uppercase">
          <span className="text-white">T</span>
          <span className="text-gray-400">O</span>
          <span className="text-white">U</span>
          <span className="text-gray-400">R</span>
          <span className="text-white">I</span>
          <span className="text-gray-400">S</span>
          <span className="text-white">M</span>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-400 text-sm mt-6">
          &copy; {new Date().getFullYear()} Brand. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default UserFooter
