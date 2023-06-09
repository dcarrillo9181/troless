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

interface MainContentProps {
  topVideos: Video[];
  trendingChallenges: Video[];
  recentVideos: Video[];
}

const MainContent: React.FC<MainContentProps> = ({ topVideos, trendingChallenges, recentVideos }) => {
  return (
    <div className="container mx-auto px-12 py-8">
      <h2 className="text-2xl font-bold mb-6">Top Videos</h2>
      <Swiper
        navigation
        pagination={{ clickable: true }}
        className="mySwiper"
        slidesPerView={3}
        spaceBetween={30}
      >
        {topVideos.map((video) => (
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
              <h3 className="text-lg font-bold mb-2">{video.title}</h3>
              <p className="text-gray-700">{video.description}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Trending Challenges and Recent Videos sections go here */}
    </div>
  );
};

export default MainContent;
