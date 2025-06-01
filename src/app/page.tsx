
"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarCheck, Users, Clock, ShieldCheck, Library } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ParallaxSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const scrollY = window.scrollY;
        const sectionTop = sectionRef.current.offsetTop;
        const sectionHeight = sectionRef.current.offsetHeight;
        
        if (sectionRef.current && scrollY + window.innerHeight > sectionTop && scrollY < sectionTop + sectionHeight) {
          const elements = sectionRef.current.querySelectorAll<HTMLElement>('[data-parallax-speed]');
          elements.forEach(el => {
            const speed = parseFloat(el.dataset.parallaxSpeed || "0.5");
            const relativeScroll = scrollY - sectionTop + (window.innerHeight / 2) - (sectionHeight / 2);
            const offset = relativeScroll * speed * 0.05;
            el.style.transform = `translateY(${offset}px)`;
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={sectionRef} className="py-16 md:py-24 bg-secondary/30 dark:bg-secondary/20 overflow-hidden rounded-lg shadow-inner">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4" data-parallax-speed="0.3">Why Choose DiscussZone?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-parallax-speed="0.2">
            Streamline your discussion room bookings with ease and efficiency.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <CalendarCheck className="h-10 w-10 text-primary mb-4" />, title: "Easy Booking", description: "Book slots for the current day in just a few clicks.", speed: "0.4" },
            { icon: <Users className="h-10 w-10 text-primary mb-4" />, title: "For MITWPU", description: "Exclusively for MITWPU students and faculty.", speed: "0.5" },
            { icon: <Clock className="h-10 w-10 text-primary mb-4" />, title: "Real-time Status", description: "Instantly see room availability.", speed: "0.35" },
            { icon: <ShieldCheck className="h-10 w-10 text-primary mb-4" />, title: "Secure Access", description: "Authenticated accounts for your privacy.", speed: "0.45" },
          ].map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow" data-parallax-speed={feature.speed}>
              {feature.icon}
              <h3 className="font-headline text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const teamMembers = [
  {
    name: "OM Jawanjal",
    role: "Creator & Developer",
    imageUrl: "https://placehold.co/150x150.png",
    linkedinUrl: "https://www.linkedin.com/in/om-jawanjal-5606162a4/",
    avatarHint: "OJ",
  },
  {
    name: "Subhajit Dolai",
    role: "Manager",
    imageUrl: "https://placehold.co/150x150.png", // Using placeholder
    linkedinUrl: "https://www.linkedin.com/in/subhajit-dolai/",
    avatarHint: "SD",
  },
  {
    name: "Dr. Praveenkumar Vaidya",
    role: "Librarian",
    imageUrl: "https://placehold.co/150x150.png", // Using placeholder
    linkedinUrl: "https://www.linkedin.com/in/praveenvaidya/",
    avatarHint: "PV",
  },
  {
    name: "Kalyani Ghokle",
    role: "Asst. Librarian",
    imageUrl: "https://placehold.co/150x150.png", 
    linkedinUrl: null,
    avatarHint: "KG",
  },
];


export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <section className="w-full py-12 md:py-24 lg:py-32 text-center relative">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('https://mitwpu.edu.in/uploads/images/library_5.webp')" }}
        >
          <div className="absolute inset-0 bg-black opacity-60"></div>
        </div>
        <div className="container px-4 md:px-6 relative z-10">
          <h1
            className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6 text-white"
          >
            Welcome to <span className="text-yellow-400">DiscussZone</span>
          </h1>
          <p
            className="max-w-[700px] mx-auto text-gray-100 md:text-xl mb-8"
          >
            Your one-stop solution for booking discussion rooms at MITWPU.
            Plan your collaborative sessions efficiently.
          </p>
          <div
            className="space-x-4"
          >
            <Link href="/booking" passHref>
              <Button size="lg" className="font-semibold bg-yellow-500 hover:bg-yellow-600 text-black">
                Book a Room
              </Button>
            </Link>
            <Link href="/signup" passHref>
              <Button size="lg" variant="outline" className="font-semibold border-gray-200 text-gray-200 hover:bg-gray-200 hover:text-black">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <ParallaxSection />

      <section className="w-full py-16 md:py-24 bg-background dark:bg-neutral-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="lg:w-1/2">
              <img
                src="https://mitwpu.edu.in/uploads/images/library_6.webp"
                alt="Knowledge Resource Center Interior"
                width={600}
                height={450}
                className="rounded-lg shadow-xl border-4 border-red-500"
                data-ai-hint="library interior"
              />
            </div>
            <div className="lg:w-1/2 text-left">
              <div className="flex items-center mb-3">
                <Library className="h-8 w-8 text-primary mr-3" />
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">
                  Knowledge Resource Center (KRC)
                </h2>
              </div>
              <p className="text-muted-foreground mb-4 text-base md:text-lg">
                Our KRC offers a serene environment perfect for focused study and collaborative
                learning. Equipped with extensive resources, comfortable seating, and dedicated
                discussion rooms, it&apos;s the ideal place to enhance your academic journey.
              </p>
              <p className="text-muted-foreground mb-6 text-base md:text-lg">
                Use DiscussZone to easily book discussion rooms located within the KRC.
              </p>
              <Button asChild size="lg" className="font-semibold">
                <a href="https://mitwpu.edu.in/life-wpu/library" target="_blank" rel="noopener noreferrer">
                  Learn More
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 bg-slate-800 dark:bg-slate-900 text-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-2 text-yellow-400">Core Team</h2>
            <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center">
                <Avatar 
                  className="h-36 w-36 mb-4 border-4 border-slate-700 shadow-lg"
                  style={member.name === "OM Jawanjal" ? { border: '3px solid red' } : {}}
                >
                  <AvatarImage
                    key={member.imageUrl} 
                    src={member.imageUrl}
                    alt={member.name}
                    data-ai-hint="placeholder avatar"
                    width={150}
                    height={150}
                  />
                  <AvatarFallback className="text-4xl bg-slate-600 text-slate-100">{member.avatarHint}</AvatarFallback>
                </Avatar>
                {member.linkedinUrl ? (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-headline text-xl font-semibold text-white hover:text-yellow-400 transition-colors"
                  >
                    {member.name}
                  </a>
                ) : (
                  <h3 className="font-headline text-xl font-semibold text-white">{member.name}</h3>
                )}
                <p className="text-yellow-300 text-sm mt-1 mb-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
    

    