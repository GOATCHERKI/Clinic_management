import React from 'react'
import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
  return (
    <div className='container mx-auto flex flex-col items-center gap-4 py-8 md:py-16 text-gray-800 px-4 md:px-6' id='speciality'>
        <h1 className='text-2xl md:text-3xl lg:text-4xl font-medium text-center'>Select Speciality You Need</h1>
        <p className='w-full md:w-2/3 lg:w-1/3 text-center text-sm md:text-base text-gray-600'>
          Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free.
        </p>

        <div className='w-full flex gap-4 pt-5 overflow-x-auto pb-4 md:pb-6 md:justify-center scrollbar-hide'>
            {specialityData.map((item, index) => (
                <Link 
                    onClick={()=>scrollTo(0,0)}
                    className='flex flex-col items-center text-sm md:text-base cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-500 group' 
                    key={index} 
                    to={`/doctors/${item.speciality}`}
                >
                    <div className="rounded-full bg-[#bddfec] p-4 flex items-center justify-center mb-3 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 group-hover:bg-[#a5d4e7] transition-colors">
                        <img 
                            className='w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 object-contain transform group-hover:scale-110 transition-transform duration-300' 
                            src={item.image} 
                            alt={item.speciality} 
                        />
                    </div>
                    <p className='text-center font-medium text-gray-700 group-hover:text-blue-500 transition-colors'>
                        {item.speciality}
                    </p>
                </Link>
            ))}
        </div>
    </div>
  )
}

export default SpecialityMenu