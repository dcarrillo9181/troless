'use client';

import React from 'react';
import SwiperCore, { Navigation, Pagination } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.min.css';

SwiperCore.use([Navigation, Pagination]);

interface Video {
  id: number;
  title: string;
  description: string;
  url: string;
}

const videos: Video[] = [
  { id: 1, title: 'Title 1', description: 'Description', url: 'https://via.placeholder.com/400x400?text=Video+1' },
  { id: 2, title: 'Title 2', description: 'Description', url: 'https://via.placeholder.com/400x400?text=Video+2' },
  { id: 3, title: 'Title 3', description: 'Description', url: 'https://via.placeholder.com/400x400?text=Video+3' },
  { id: 4, title: 'Title 4', description: 'Description', url: 'https://via.placeholder.com/400x400?text=Video+4' },
  { id: 5, title: 'Title 5', description: 'Description', url: 'https://via.placeholder.com/400x400?text=Video+5' },
  { id: 6, title: 'Title 6', description: 'Description', url: 'https://via.placeholder.com/400x400?text=Video+6' },
];

const TopOptimisticVideos: React.FC = () => {
  return (
    <div className="container mx-auto px-12 py-8">
      <h1 className="text-center font-bold mb-10">Top Optimistic Videos</h1>
      <Swiper
        navigation
        pagination={{ clickable: true }}
        className="mySwiper"
        slidesPerView={3}
        spaceBetween={30}
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id}>
            <div className="relative h-0" style={{ paddingBottom: '100%' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-3/4 h-3/4 rounded-full overflow-hidden">
                  <img src={video.url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black opacity-50"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1/2 h-1/2 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h2 className="text-lg font-bold mb-2">{video.title}</h2>
              <p className="text-gray-700">{video.description}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default TopOptimisticVideos;
