import React from 'react';

type Video = {
  id: string;
  title: string;
  thumbnailUrl: string;
  rating: number;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
};

interface MainContentProps {
  topVideos: Video[];
  trendingChallenges: Challenge[];
  recentVideos: Video[];
}

export const MainContent: React.FC<MainContentProps> = ({
  topVideos,
  trendingChallenges,
  recentVideos,
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className='bg-blue-300'>
        <h2 className="text-xl font-semibold mb-4">Top Optimistic Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topVideos.map((video) => (
            <div key={video.id}>
              <img src={video.thumbnailUrl} alt={video.title} />
              <h3 className="text-sm font-semibold mt-2">{video.title}</h3>
              <p>Rating: {video.rating}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 bg-blue-200">
        <h2 className="text-xl font-semibold mb-4">Trending Challenges</h2>
        <ul>
          {trendingChallenges.map((challenge) => (
            <li key={challenge.id} className="mb-2">
              <h3 className="text-sm font-semibold">{challenge.title}</h3>
              <p>{challenge.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 bg-blue-100">
        <h2 className="text-xl font-semibold mb-4">Recent Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentVideos.map((video) => (
            <div key={video.id}>
              <img src={video.thumbnailUrl} alt={video.title} />
              <h3 className="text-sm font-semibold mt-2">{video.title}</h3>
              <p>Rating: {video.rating}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
