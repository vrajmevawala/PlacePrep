import React from 'react';
import { ArrowRight, Target, BookOpen, Trophy, BarChart3, Users, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = ({ user, onOpenAuthModal }) => {
  const navigate = useNavigate();
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

  // const stats = [
  //   { number: '10K+', label: 'Students' },
  //   { number: '500+', label: 'Questions' },
  //   { number: '50+', label: 'Companies' },
  //   { number: '95%', label: 'Success Rate' }
  // ];

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Hero Section */}
      <motion.section 
        className="px-4 py-20 sm:px-6 lg:px-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Prepare for Your
            <span className="block mt-2">Dream Placement</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Master aptitude, technical, and DSA skills with our comprehensive platform. 
            Get placement-ready with expert-curated content and real-time assessments.
          </p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.button
              onClick={() => onOpenAuthModal('signup')}
              className="bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => onOpenAuthModal('login')}
              className="border border-black text-black px-8 py-3 rounded-sm font-medium hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      {/* <motion.section 
        className="py-16 bg-gray-50"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section> */}

      {/* Features Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
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
            <motion.div 
              className="text-center group cursor-pointer" 
              onClick={() => { if (user) { navigate('/practice'); } else { onOpenAuthModal('login'); } }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="w-16 h-16 bg-black rounded-sm flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-800 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <Target className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Practice Tests</h3>
              <p className="text-gray-600">Comprehensive aptitude, technical, and DSA questions</p>
            </motion.div>
            <motion.div 
              className="text-center group cursor-pointer" 
              onClick={() => { if (user) { navigate('/contests'); } else { onOpenAuthModal('login'); } }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="w-16 h-16 bg-black rounded-sm flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-800 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Live Contests</h3>
              <p className="text-gray-600">Compete with peers in real-time coding challenges</p>
            </motion.div>
            <motion.div 
              className="text-center group cursor-pointer" 
              onClick={() => { if (user) { navigate('/results'); } else { onOpenAuthModal('login'); } }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="w-16 h-16 bg-black rounded-sm flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-800 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <BarChart3 className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-gray-600">Detailed performance tracking and insights</p>
            </motion.div>
            <motion.div 
              className="text-center group cursor-pointer" 
              onClick={() => { if (user) { navigate('/resources'); } else { onOpenAuthModal('login'); } }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="w-16 h-16 bg-black rounded-sm flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-800 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <BookOpen className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Resources</h3>
              <p className="text-gray-600">Curated learning materials and study guides</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us Section */}
      <motion.section 
        className="py-20 bg-gray-50"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose PlacePrep?
            </h2>
            <button
              onClick={() => { if (user) { navigate('/why-choose-us'); } else { onOpenAuthModal('login'); } }}
              className="mt-4 bg-black text-white px-6 py-2 rounded-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Learn More
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <motion.div 
                className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 5 }}
              >
                <Users className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Expert Moderation</h3>
              <p className="text-gray-600">
                Questions curated by industry experts and experienced professionals
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <motion.div 
                className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 5 }}
              >
                <BarChart3 className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-gray-600">
                Comprehensive analysis of your performance with actionable insights
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <motion.div 
                className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 5 }}
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">
                Safe and reliable environment for your preparation journey
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Join thousands of students who have successfully prepared with PlacePrep
          </p>
          <motion.button
            onClick={() => onOpenAuthModal('signup')}
            className="bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Today
          </motion.button>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default Home; 