import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Target,
  Trophy,
  BookOpen,
  BarChart3,
  Heart,
} from "lucide-react";
import footerlogo from "../../assests/footerlogo.png";

const Footer = ({ user, onOpenAuthModal }) => {
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Practice", path: "/practice" },
    { name: "Contests", path: "/contests" },
    { name: "Resources", path: "/resources" },
    { name: "Results", path: "/results" },
    { name: "Bookmarks", path: "/bookmarks" },
  ];

  const features = [
    { icon: Target, name: "Practice Tests", desc: "Aptitude, Technical & DSA" },
    { icon: Trophy, name: "Live Contests", desc: "Real-time competitions" },
    { icon: BarChart3, name: "Analytics", desc: "Performance tracking" },
    { icon: BookOpen, name: "Resources", desc: "Study materials" },
  ];

  const handleGuardedClick = (e) => {
    if (!user) {
      e.preventDefault();
      if (typeof onOpenAuthModal === 'function') onOpenAuthModal('login');
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <img
                src={footerlogo}
                alt="PlacePrep Logo"
                className="h-12"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Your comprehensive platform for placement preparation. Master
              aptitude, technical, and DSA skills with expert-curated content
              and real-time assessments.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">team.placeprep@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-6 text-white">
              Quick Links
            </h3>
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  onClick={handleGuardedClick}
                  className="block text-gray-300 hover:text-white transition-colors duration-300 text-sm group"
                >
                  <span className="flex items-center">
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-6 text-white">
              Our Features
            </h3>
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-3 group">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-black transition-colors">
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        {feature.name}
                      </h4>
                      <p className="text-xs text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>
                &copy; {new Date().getFullYear()} PlacePrep. All rights
                reserved.
              </span>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <Link
                to="/privacy"
                onClick={handleGuardedClick}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                onClick={handleGuardedClick}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/contact"
                onClick={() => {
                  window.open('mailto:team.placeprep@gmail.com', '_blank');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
