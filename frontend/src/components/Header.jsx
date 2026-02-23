import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import heroBg from '../assets/kuh.jpg';
import groupImg from '../assets/group.png';
import heroImage from '../assets/heade.png';

const Header = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className='relative rounded-xl overflow-hidden shadow-2xl min-h-[60vh] top-[5px]'>
      {/* Background image with subtle dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 filter blur-sm transform transition-transform duration-700"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-0" />

      {/* Animated decorative elements */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="absolute top-1/4 left-1/5 w-32 h-32 rounded-full bg-white/10 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-white/10 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full bg-white/5 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-20 h-full">
        <div className={`flex flex-col md:flex-row px-6 md:px-10 lg:px-20 max-w-7xl mx-auto h-full transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Left Side */}
          <div className="md:w-1/2 flex flex-col items-start justify-center gap-6 py-8 md:py-12">
            <div className="flex items-center gap-3 mb-2 group cursor-pointer">
              <div className="h-1 w-10 bg-white/50 rounded-full group-hover:w-14 transition-all duration-300"></div>
              <p className="text-white/75 font-medium uppercase text-sm tracking-wider hover:text-white transition-colors">
                {t('header.healthcareSimplified')}
              </p>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-tight">
              {t('header.yourHealth')}
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70 animate-gradient">
                {t('header.justAClickAway')}
              </span>
            </h1>

            <div className="flex items-center gap-4 text-white/90 text-sm mt-2 hover:transform hover:translate-x-2 transition-transform duration-300">
              <img className="w-28 opacity-90" src={groupImg} alt={t('header.healthcareTeam')} />
              <p className="font-light leading-relaxed">
                {t('header.expertCare')}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="#speciality"
                className="px-8 py-3.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium text-sm hover:bg-white/30 transition duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                {t('appointment.book')}
              </a>
              <a
                href="/about"
                className="px-8 py-3.5 rounded-full border border-white/30 text-white/80 text-sm hover:text-white hover:border-white transition duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                {t('nav.about')}
              </a>
            </div>

            {/* Stats Section */}
            <div className="flex gap-8 mt-12">
              <div className="text-white">
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-white/70">{t('header.support')}</p>
              </div>
              <div className="text-white">
                <p className="text-2xl font-bold">100+</p>
                <p className="text-sm text-white/70">{t('header.specialists')}</p>
              </div>
              <div className="text-white">
                <p className="text-2xl font-bold">50k+</p>
                <p className="text-sm text-white/70">{t('header.patients')}</p>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className=" md:w-1/2 relative flex items-end">
            <div className="w-full lg:w-full md:w-[90%] ml-auto">
              <img
                className='w-full rounded-2xl shadow-2xl transform transition-all duration-700 hover:scale-[1.02]'
                src={heroImage}
                alt={t('header.healthcareIllustration')}
              />

              <div className="absolute top-8 right-8 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/20 transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-white text-sm font-medium">{t('nav.doctors')}</p>  
                </div>
                <p className="text-white/75 text-xs mt-1">{t('header.available247')}</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
