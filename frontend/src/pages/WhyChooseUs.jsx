import React from "react";
import { CheckCircle, BarChart3, Users, ShieldCheck, MonitorSmartphone } from "lucide-react";

const features = [
  {
    icon: <CheckCircle className="h-8 w-8 text-gray-800" />,
    title: "Comprehensive Practice",
    points: [
      "Thousands of curated aptitude and technical questions",
      "Practice by category, subcategory, and difficulty level",
      "Detailed explanations for every question",
    ],
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-gray-800" />,
    title: "Realistic Test Series",
    points: [
      "Timed test series simulating real placement exams",
      "Instant feedback and performance analytics",
      "Track your progress and improve over time",
    ],
  },
  {
    icon: <Users className="h-8 w-8 text-gray-800" />,
    title: "Expert Guidance",
    points: [
      "Role-based dashboards for students, moderators, and admins",
      "Moderators and admins ensure quality and fairness",
      "Resource sharing and up-to-date materials",
    ],
  },
  {
    icon: <MonitorSmartphone className="h-8 w-8 text-gray-800" />,
    title: "Modern, User-Friendly Platform",
    points: [
      "Clean, responsive UI for seamless experience on any device",
      "Secure authentication (including Google login)",
      "Easy question upload (Excel/JSON) for bulk management",
    ],
  },
];

const WhyChooseUs = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-black mb-4 tracking-tight">
          Why Choose <span className="text-black">PlacePrep</span>?
        </h1>
        <p className="text-lg text-gray-700 mb-10">
          PlacePrep is your one-stop solution for placement preparation, designed to empower students and job seekers with the best tools, resources, and support. Here’s what sets us apart:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col items-center hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h2 className="text-xl font-semibold mb-3 text-black">{feature.title}</h2>
              <ul className="list-disc text-left ml-4 text-gray-800 space-y-1">
                {feature.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 bg-black rounded-2xl py-8 px-6 shadow-lg flex flex-col items-center">
          <ShieldCheck className="h-10 w-10 text-white mb-2" />
          <h2 className="text-2xl font-bold text-white mb-2">Join PlacePrep Today!</h2>
          <p className="text-lg text-gray-200 mb-4 max-w-2xl">
            Start your journey towards placement success with PlacePrep. Practice, compete, learn, and achieve your goals with us!
          </p>
          <a
            href="/signup"
            className="inline-block bg-white text-black font-semibold px-6 py-2 rounded-full shadow hover:bg-gray-100 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUs; 