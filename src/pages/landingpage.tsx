import React from "react";
import { motion } from "framer-motion";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 shadow-lg">
        <h1 className="text-3xl font-bold text-center">Automatic Fare Collection</h1>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center items-center p-6">
        <div className="text-center max-w-2xl">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
            The Future of Commuting, Today
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Say goodbye to cash transactions and hello to a seamless travel experience. Fast, efficient, and secure fare collection designed for modern transit systems.
          </p>
          <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg">
            Learn More
          </button>
        </div>

        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <img
            src="https://source.unsplash.com/1920x1080/?buses,transport"
            alt="Dynamic sleek buses"
            className="object-cover w-full h-full"
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="p-8 bg-white">
        <h3 className="text-2xl font-semibold text-center mb-6">Why Choose Us?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Cashless Transactions", description: "Convenient and quick payments with no hassle." },
            { title: "Secure System", description: "Advanced encryption to protect your data." },
            { title: "Real-Time Updates", description: "Stay updated with your travel history instantly." },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h4 className="text-xl font-medium mb-2">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center p-4">
        <p className="text-sm">&copy; {new Date().getFullYear()} Automatic Fare Collection. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
