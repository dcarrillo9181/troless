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
  { id: 1, title: 'Video 1', description: 'Description', url: 'https://via.placeholder.com/150' },
  { id: 2, title: 'Video 2', description: 'Description', url: 'https://via.placeholder.com/150' },
  { id: 3, title: 'Video 3', description: 'Description', url: 'https://via.placeholder.com/150' },
  { id: 4, title: 'Video 4', description: 'Description', url: 'https://via.placeholder.com/150' },
  { id: 5, title: 'Video 5', description: 'Description', url: 'https://via.placeholder.com/150' },
  { id: 6, title: 'Video 6', description: 'Description', url: 'https://via.placeholder.com/150' },
  // Add more video placeholders as needed
];

const TopOptimisticVideos: React.FC = () => {
  return (
    <div className="container mx-auto px-12 py-8">
      <h1 className="text-center font-bold mb-10">Top Optimistic Videos</h1>
      <Swiper
        navigation
        pagination={{ clickable: true }}
        spaceBetween={16}
        slidesPerView={3}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {videos.map((video) => (
          <SwiperSlide key={video.id}>
            <div className="bg-blue-100 rounded-md shadow p-4">
              <img
                src={video.url}
                alt={video.title}
                className="rounded-md h-48 object-cover mb-2"
              />
              <div className='flex'>
                <h5 className="text-xl font-semibold text-gray-500">{video.description}</h5>
              </div>
              <h3 className="text-lg font-semibold">{video.title}</h3>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default TopOptimisticVideos;
