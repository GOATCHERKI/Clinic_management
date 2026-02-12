import React, {useContext, useState, useEffect} from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const RelatedDoctors = ({docId, speciality}) => {

    const {doctors} = useContext(AppContext)
    const navigate = useNavigate()
    const [relDocs, setRelDocs] = useState([])  

    useEffect(() => {
        if(doctors.length > 0 && docId && speciality){
            const doctorsData = doctors.filter((doc)=> doc.speciality === speciality && doc._id !== docId)
            setRelDocs(doctorsData)
        }
    },[doctors, docId, speciality])

    return (
        <div className='container mx-auto flex flex-col items-center gap-4 my-8 md:my-16 text-gray-900 px-4 md:px-6 lg:px-8'>
            <h1 className='text-2xl md:text-3xl lg:text-4xl font-medium text-center'>Related Doctors</h1>
            <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pt-5'>
                {relDocs.map((item, index) => (
                    <div onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0)}} 
                        className='bg-white border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 hover:shadow-xl group' 
                        key={index}
                    >
                        <div className='relative w-full pt-[75%]'>
                            <img 
                                className='absolute top-0 left-0 w-full h-full object-cover bg-[#eaf9ff] group-hover:scale-105 transition-transform duration-500' 
                                src={item.image} 
                                alt={item.name}
                                loading="lazy"
                            />
                        </div>
                        <div className='p-4 md:p-5'>
                            <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                                <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p><p>{item.available ? 'Available' : "Not Available"}</p>
                            </div>
                            <p className='text-gray-900 text-lg md:text-xl font-medium mt-2'>{item.name}</p>
                            <p className='text-gray-600 text-sm md:text-base mt-1'>{item.speciality}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button 
                onClick={() => {
                    navigate('/doctors')
                    window.scrollTo(0,0)
                }} 
                className='bg-[#eaf9ff] text-gray-600 px-8 md:px-12 py-2.5 md:py-3 rounded-full mt-8 md:mt-10 hover:bg-blue-100 transition-colors text-sm md:text-base font-medium hover:text-gray-800'
            >
                View All Doctors
            </button>
        </div>
    )
}

export default RelatedDoctors