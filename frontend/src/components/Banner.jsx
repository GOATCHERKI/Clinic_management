import React from 'react';
import { useNavigate } from 'react-router-dom';

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden flex flex-col md:flex-row bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl shadow-2xl px-6 sm:px-10 lg:px-14 my-20 mx-4 md:mx-10">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-8 left-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-8 right-8 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white opacity-5 rounded-full blur-xl"></div>
      </div>

      {/* Left Image */}
      <div className="hidden md:block md:w-1/2 relative z-10">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
        <img
          className="w-full h-full object-contain absolute bottom-0 right-0 drop-shadow-2xl"
          src="src/assets/doc4.png"
          alt="Doctor"
        />
      </div>

      {/* Right Content */}
      <div className="flex-1 py-12 md:py-20 lg:py-24 z-10">
        <div className="max-w-xl">
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Book Your Appointment
          </h2>
          <p className="text-white text-xl sm:text-2xl mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
            With Us Today
          </p>
          <div className="h-1 w-24 bg-white mt-4 rounded-full opacity-60"></div>

          <p className="text-blue-100 mt-6 text-sm sm:text-base">
            Experience healthcare excellence with our team of dedicated professionals ready to provide personalized care.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                navigate('/login');
                scrollTo(0, 0);
              }}
              className="bg-white text-indigo-600 text-sm sm:text-base font-medium px-8 py-3 rounded-full hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg"
            >
              Create Account
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
