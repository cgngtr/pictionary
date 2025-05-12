'use client';

import Image from 'next/image';

export default function ProfilePage() {
  // Mock user data - this will be replaced with real data later
  const user = {
    name: 'John Doe',
    username: '@johndoe',
    bio: 'Digital artist and photographer | Creating beautiful moments',
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    stats: {
      pins: 245,
      following: 1234,
      followers: 5678
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 -mt-16">
      {/* Cover Image Container */}
      <div className="relative w-full h-[300px] md:h-[400px]">
        <Image
          src={user.coverImage}
          alt="Cover"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-32 pb-8">
          {/* Profile Image */}
          <div className="relative z-10">
            <div className="relative w-40 h-40 mx-auto md:mx-0 rounded-full border-4 border-white overflow-hidden shadow-xl">
              <Image
                src={user.profileImage}
                alt={user.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="mt-6 text-center md:text-left">
            <h1 className="text-4xl font-bold text-gray-900">{user.name}</h1>
            <p className="mt-1 text-xl text-gray-600">{user.username}</p>
            <p className="mt-4 text-lg text-gray-800 max-w-2xl">{user.bio}</p>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-8">
              <div className="text-center md:text-left">
                <p className="text-3xl font-bold text-gray-900">{user.stats.pins}</p>
                <p className="text-sm font-medium text-gray-600">Pins</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-3xl font-bold text-gray-900">{user.stats.following}</p>
                <p className="text-sm font-medium text-gray-600">Following</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-3xl font-bold text-gray-900">{user.stats.followers}</p>
                <p className="text-sm font-medium text-gray-600">Followers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Created Pins Section */}
        <div className="mt-12 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Created Pins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <Image
                  src={`https://source.unsplash.com/random/600x800?sig=${i}`}
                  alt={`Pin ${i + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 