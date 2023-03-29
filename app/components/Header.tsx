import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-500 shadow-md p-4">
        <nav className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/">
                  <Image
                    src="/troless_full_logo.png"
                    alt="Troless Logo"
                    width={300} // Adjust the width as needed
                    height={100} // Adjust the height as needed
                    priority // Optional, to load the logo with higher priority
                  />
                </Link>
              </div>
              <div className="hidden md:flex items-center space-x-8 text-xl">
                <a href="./top_videos" className="text-white hover:text-gray-600">Top Videos</a>
                <a href="./challenges" className="text-white hover:text-gray-600">Challenges</a>
                <a href="./conflict_resolution" className="text-white hover:text-gray-600">Conflict Resolution</a>
              </div>
              <div className="md:flex items-center space-x-4">
                <input type="text" className="border-2 border-gray-300 rounded-md p-2" placeholder="Search" />
                <button className="bg-blue-900 text-white rounded-md px-4 py-2">Sign In</button>
                <button className="bg-gray-200 text-gray-800 rounded-md px-4 py-2">Register</button>
              </div>
            </div>
        </nav>
    </header>
  );
};

export default Header;
