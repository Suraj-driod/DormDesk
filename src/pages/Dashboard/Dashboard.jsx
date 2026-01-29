import React, { useState, useEffect } from "react";
import { Users, Megaphone, AlertTriangle, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function Dashboard() {
  
  // --- SLIDESHOW LOGIC ---
  const slides = [
    { 
      category: "Most Viewed Issue", 
      title: "Library Wi-Fi Intermittent Connection", 
      icon: Users,
      color: "text-[#00B8D4]"
    },
    { 
      category: "Trending Announcement", 
      title: "Semester End Exam Schedule Released", 
      icon: Megaphone,
      color: "text-[#2DD4BF]"
    },
    { 
      category: "Recent Lost Item", 
      title: "Blue Water Bottle found in Lab 3", 
      icon: Search,
      color: "text-[#A78BFA]"
    },
    { 
      category: "Top Complaint", 
      title: "Cafeteria AC not cooling properly", 
      icon: AlertTriangle,
      color: "text-[#FB923C]"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // --- CARD COMPONENT ---
  const Card = ({ title, icon: Icon, color, glow, hoverGlow, onClick }) => (
    <div
      onClick={onClick}
      className={`
        cursor-pointer
        h-[150px] rounded-[26px]
        bg-white/60 backdrop-blur
        border border-[#7CF3FF]
        ${glow}
        ${hoverGlow}
        transition-all duration-300
        flex flex-col items-center justify-center
        gap-3
        group
      `}
    >
      <div
        className={`
          w-[60px] h-[60px] rounded-full
          ${color.bg}
          flex items-center justify-center
          ${color.shadow}
          group-hover:scale-110
          transition-transform duration-300
        `}
      >
        <Icon className={color.icon} size={28} />
      </div>
      <p className="font-semibold text-[15px]">{title}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(#f7fdff,#ffffff)] font-['Poppins',sans-serif] p-6">

      <h1 className="text-[20px] font-semibold mb-5 text-center">
        Student Dashboard
      </h1>

      {/* --- SLIDESHOW WINDOW --- */}
      <div className="mb-6 w-full h-[140px] relative rounded-[26px] bg-white/60 backdrop-blur border border-[#7CF3FF] shadow-[0_0_35px_rgba(0,229,255,0.35)] flex items-center justify-center overflow-hidden">
        
        {/* Slide Content */}
        <div className="text-center px-4 animate-fade-in transition-all duration-500 ease-in-out">
             {/* Dynamic Icon */}
            <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-[#E6FBFF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                {React.createElement(slides[currentSlide].icon, { 
                    size: 20, 
                    className: slides[currentSlide].color 
                })}
            </div>

            <p className="text-[12px] font-bold tracking-widest text-[#00B8D4] uppercase mb-1">
                {slides[currentSlide].category}
            </p>
            <h2 className="text-[16px] font-semibold text-gray-800">
                {slides[currentSlide].title}
            </h2>
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-3 flex gap-2">
            {slides.map((_, index) => (
                <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-[#00E5FF] w-4 shadow-[0_0_10px_#00E5FF]' : 'bg-gray-300'}`}
                />
            ))}
        </div>
      </div>
      {/* ----------------------- */}

      {/* GRID */}
      <div className="grid grid-cols-2 gap-5">

        {/* Public */}
        <Card
          title="Public"
          icon={Users}
          color={{
            bg: "bg-[#E6FBFF]",
            icon: "text-[#00B8D4]",
            shadow: "shadow-[0_0_25px_rgba(0,229,255,0.6)]"
          }}
          glow="shadow-[0_0_35px_rgba(0,229,255,0.35)]"
          hoverGlow="hover:shadow-[0_0_55px_rgba(0,229,255,0.65)]"
          onClick={() => console.log("Public")}
        />

        {/* Announcements */}
        <Card
          title="Announcements"
          icon={Megaphone}
          color={{
            bg: "bg-[#ECFEFF]",
            icon: "text-[#2DD4BF]",
            shadow: "shadow-[0_0_25px_rgba(45,212,191,0.6)]"
          }}
          glow="shadow-[0_0_35px_rgba(45,212,191,0.35)]"
          hoverGlow="hover:shadow-[0_0_55px_rgba(45,212,191,0.65)]"
          onClick={() => console.log("Announcements")}
        />

        {/* Complaints */}
        <Card
          title="Complaints"
          icon={AlertTriangle}
          color={{
            bg: "bg-[#FFF7ED]",
            icon: "text-[#FB923C]",
            shadow: "shadow-[0_0_25px_rgba(251,146,60,0.6)]"
          }}
          glow="shadow-[0_0_35px_rgba(251,146,60,0.35)]"
          hoverGlow="hover:shadow-[0_0_55px_rgba(251,146,60,0.65)]"
          onClick={() => console.log("Complaints")}
        />

        {/* Lost & Found */}
        <Card
          title="Lost & Found"
          icon={Search}
          color={{
            bg: "bg-[#F5F3FF]",
            icon: "text-[#A78BFA]",
            shadow: "shadow-[0_0_25px_rgba(167,139,250,0.6)]"
          }}
          glow="shadow-[0_0_35px_rgba(167,139,250,0.35)]"
          hoverGlow="hover:shadow-[0_0_55px_rgba(167,139,250,0.65)]"
          onClick={() => console.log("Lost & Found")}
        />

      </div>
    </div>
  );
}