import React from 'react';
import { ArrowRight, Target, BookOpen, Trophy, BarChart3, Users, Shield } from 'lucide-react';

const Home = ({ onNavigate }) => {
  const features = [
    {
      icon: Target,
      title: 'Practice Tests',
      description: 'Comprehensive aptitude, technical, and DSA questions'
    },
    {
      icon: Trophy,
      title: 'Live Contests',
      description: 'Compete with peers in real-time coding challenges'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Detailed performance tracking and insights'
    },
    {
      icon: BookOpen,
      title: 'Resources',
      description: 'Curated learning materials and study guides'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Students' },
    { number: '500+', label: 'Questions' },
    { number: '50+', label: 'Companies' },
    { number: '95%', label: 'Success Rate' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Prepare for Your
            <span className="block mt-2">Dream Placement</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Master aptitude, technical, and DSA skills with our comprehensive platform. 
            Get placement-ready with expert-curated content and real-time assessments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('signup')}
              className="bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="border border-black text-black px-8 py-3 rounded-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Our platform provides all the tools and resources you need to excel in placement tests
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-black rounded-sm flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-800 transition-colors">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose PlacePrep?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Moderation</h3>
              <p className="text-gray-600">
                Questions curated by industry experts and experienced professionals
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-gray-600">
                Comprehensive analysis of your performance with actionable insights
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">
                Safe and reliable environment for your preparation journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Join thousands of students who have successfully prepared with PlacePrep
          </p>
          <button
            onClick={() => onNavigate('signup')}
            className="bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home; 