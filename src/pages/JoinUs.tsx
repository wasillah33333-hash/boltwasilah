import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Star, CheckCircle, ArrowRight, Globe, Lightbulb, Award, Sparkles, Zap, Target, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useMagneticEffect } from '../hooks/useMagneticEffect';

const JoinUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your interest! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', interest: '', message: '' });
  };

  const benefits = [
    {
      icon: Heart,
      title: 'Make a Real Impact',
      description: 'Join thousands of volunteers making meaningful change in communities across Pakistan.'
    },
    {
      icon: Users,
      title: 'Build Lasting Connections',
      description: 'Connect with like-minded individuals who share your passion for community service.'
    },
    {
      icon: Star,
      title: 'Develop New Skills',
      description: 'Gain valuable experience and develop skills that will benefit you personally and professionally.'
    },
    {
      icon: Globe,
      title: 'Expand Your Network',
      description: 'Meet people from diverse backgrounds and build relationships that last a lifetime.'
    },
    {
      icon: Lightbulb,
      title: 'Learn & Grow',
      description: 'Participate in workshops, training sessions, and educational programs.'
    },
    {
      icon: Award,
      title: 'Recognition & Rewards',
      description: 'Get recognized for your contributions and receive certificates of appreciation.'
    }
  ];

  const waysToJoin = [
    {
      title: 'Become a Volunteer',
      description: 'Join our volunteer community and participate in various projects and events.',
      icon: Users,
      link: '/volunteer',
      color: 'bg-vibrant-orange'
    },
    {
      title: 'Start a Project',
      description: 'Propose and lead your own community project with our support.',
      icon: Target,
      link: '/create-submission?type=project',
      color: 'bg-logo-teal'
    },
    {
      title: 'Organize Events',
      description: 'Plan and execute community events that bring people together.',
      icon: Calendar,
      link: '/create-submission?type=event',
      color: 'bg-vibrant-orange-light'
    },
    {
      title: 'Partner with Us',
      description: 'Collaborate with us as an organization or business partner.',
      icon: Globe,
      link: '/contact',
      color: 'bg-logo-navy'
    }
  ];

  const testimonials = [
    {
      name: 'Amina Hassan',
      role: 'Volunteer since 2020',
      content: 'Joining Waseela was the best decision I ever made. I\'ve met amazing people and made a real difference in my community.',
      image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      name: 'Ahmed Malik',
      role: 'Project Leader',
      content: 'The support and resources provided by Waseela helped me turn my idea into a successful community project.',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
      name: 'Fatima Khan',
      role: 'Event Coordinator',
      content: 'Working with Waseela has given me leadership skills and confidence I never knew I had.',
      image: 'https://images.pexels.com/photos/3763152/pexels-photo-3763152.jpeg?auto=compress&cs=tinysrgb&w=300'
    }
  ];

  return (
    <div className="py-12">
      {/* Hero Section - Enhanced */}
      <section className="hero-luxury-bg text-cream-elegant py-24 relative overflow-hidden">
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="floating-3d-luxury magnetic-element"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        <div className="luxury-particle"></div>
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-vibrant-orange/20 rounded-full animate-float-gentle"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-logo-teal/20 rounded-full animate-float-gentle" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-vibrant-orange-light/15 rounded-full animate-float-gentle" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-cinematic-fade">
            <h1 className="text-6xl md:text-7xl font-modern-display mb-8 animate-text-reveal">Join Our Community</h1>
            <p className="text-2xl font-elegant-body max-w-4xl mx-auto animate-text-reveal" style={{animationDelay: '0.3s'}}>
              Be part of something bigger. Join thousands of changemakers working together to build a better tomorrow.
            </p>
            <div className="mt-12 animate-text-reveal" style={{animationDelay: '0.6s'}}>
              <Link to="/volunteer" className="liquid-button text-lg px-8 py-4 inline-flex items-center group mr-4">
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/contact" className="glassmorphism text-lg px-8 py-4 inline-flex items-center group">
                Learn More
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Us - Enhanced */}
      <section className="py-24 bg-cream-white relative overflow-hidden">
        <div className="particle-container absolute inset-0 opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-5xl md:text-6xl font-modern-display text-black mb-8">Why Join Our Community?</h2>
            <p className="text-2xl text-black font-elegant-body max-w-4xl mx-auto">
              Discover the incredible benefits of being part of Pakistan's most active community service network
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 stagger-animation">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center floating-card magnetic-element group">
                <div className="service-icon-luxury w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse-glow">
                  <benefit.icon className="w-10 h-10 text-white group-hover:animate-float-gentle" />
                </div>
                <h3 className="text-2xl font-luxury-heading text-black mb-4 group-hover:text-gradient-animated transition-all duration-500">{benefit.title}</h3>
                <p className="text-black font-elegant-body text-lg group-hover:text-gray-800 transition-colors duration-300">{benefit.description}</p>
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ways to Join - Enhanced */}
      <section className="py-24 bg-cream-elegant relative overflow-hidden">
        <div className="absolute inset-0 morphing-background opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-5xl md:text-6xl font-modern-display text-black mb-8">Ways to Get Involved</h2>
            <p className="text-2xl text-black font-elegant-body max-w-4xl mx-auto">
              Choose the path that best fits your interests and availability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-animation">
            {waysToJoin.map((way, index) => (
              <Link
                key={index}
                to={way.link}
                className="luxury-card bg-cream-white p-8 text-center floating-card magnetic-element group"
              >
                <div className={`w-16 h-16 ${way.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse-glow`}>
                  <way.icon className="w-8 h-8 text-white group-hover:animate-float-gentle" />
                </div>
                <h3 className="text-xl font-luxury-heading text-black mb-4 group-hover:text-gradient-animated transition-all duration-500">{way.title}</h3>
                <p className="text-black font-elegant-body group-hover:text-gray-800 transition-colors duration-300">{way.description}</p>
                <div className="mt-6 flex items-center justify-center text-vibrant-orange font-medium group-hover:translate-x-1 transition-transform">
                  <span className="text-sm">Learn More</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced */}
      <section className="py-24 bg-cream-white relative overflow-hidden">
        <div className="particle-container absolute inset-0 opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-5xl md:text-6xl font-modern-display text-black mb-8">What Our Community Says</h2>
            <p className="text-2xl text-black font-elegant-body max-w-4xl mx-auto">
              Hear from real people who have transformed their lives through community service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-animation">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="luxury-card bg-cream-elegant p-8 floating-card magnetic-element group">
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4 group-hover:animate-pulse-glow"
                  />
                  <div>
                    <h4 className="font-luxury-heading text-black group-hover:text-gradient-animated transition-all duration-500">{testimonial.name}</h4>
                    <p className="text-vibrant-orange text-sm font-medium">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-black font-elegant-body italic group-hover:text-gray-800 transition-colors duration-300">"{testimonial.content}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form - Enhanced */}
      <section className="py-24 bg-logo-navy text-cream-elegant relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="floating-3d-luxury opacity-20 magnetic-element"></div>
          <div className="floating-3d-luxury opacity-15 magnetic-element"></div>
          <div className="luxury-particle"></div>
          <div className="luxury-particle"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-modern-display mb-6 animate-text-reveal">Ready to Get Started?</h2>
            <p className="text-xl text-cream-elegant/80 font-elegant-body animate-text-reveal" style={{animationDelay: '0.3s'}}>
              Have questions? We'd love to hear from you and help you get started on your journey.
            </p>
          </div>

          <div className="luxury-card bg-logo-navy-light/60 rounded-luxury-lg p-12 backdrop-blur-luxury border-2 border-vibrant-orange/20 scroll-reveal">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-luxury-medium text-cream-elegant mb-2">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-cream-elegant/10 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-elegant-body text-cream-elegant placeholder-cream-elegant/60"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-cream-elegant mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-cream-elegant/10 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-elegant-body text-cream-elegant placeholder-cream-elegant/60"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-luxury-medium text-cream-elegant mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-cream-elegant/10 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-elegant-body text-cream-elegant placeholder-cream-elegant/60"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-cream-elegant mb-2">Area of Interest</label>
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-cream-elegant/10 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-elegant-body text-cream-elegant"
                  >
                    <option value="">Select an area of interest</option>
                    <option value="volunteering">Volunteering</option>
                    <option value="project-leadership">Project Leadership</option>
                    <option value="event-organization">Event Organization</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-luxury-medium text-cream-elegant mb-2">Message</label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-cream-elegant/10 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-elegant-body text-cream-elegant placeholder-cream-elegant/60"
                  placeholder="Tell us about yourself and how you'd like to get involved..."
                />
              </div>

              <button
                type="submit"
                className="w-full liquid-button py-4 px-8 flex items-center justify-center text-lg group"
              >
                Send Message
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JoinUs;