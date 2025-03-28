
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

const LandingPage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Automatic Fare Collection</h1>
          <div className="space-x-4">
            {isAuthenticated ? (
              <div className="flex space-x-4">
                <Button asChild variant="outline" className="text-white border-white hover:bg-white/10">
                  <Link to={isAdmin ? "/admin" : "/dashboard"}>
                    {isAdmin ? "Admin Dashboard" : "Dashboard"}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Button asChild variant="outline" className="text-white border-white hover:bg-white/10">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="bg-white text-blue-600 hover:bg-gray-100">
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center items-center p-6">
        <div className="container mx-auto text-center max-w-3xl z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">
              The Future of Commuting, Today
            </h2>
            <p className="text-xl text-gray-600 mb-8 mx-auto max-w-2xl">
              Say goodbye to cash transactions and hello to a seamless travel experience. Fast, efficient, and secure fare collection designed for modern transit systems.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link to={isAdmin ? "/admin" : "/dashboard"}>
                    Go to {isAdmin ? "Admin Dashboard" : "Dashboard"}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link to="/register">Get Started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 2 }}
        >
          <img
            src="https://source.unsplash.com/1920x1080/?buses,transport"
            alt="Dynamic sleek buses"
            className="object-cover w-full h-full opacity-60"
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-semibold text-center mb-12">Why Choose Us?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: "Cashless Transactions", 
                description: "Convenient and quick payments with no hassle. Make payments using your phone or card.", 
                icon: "💳" 
              },
              { 
                title: "Secure System", 
                description: "Advanced encryption to protect your data and financial transactions at all times.", 
                icon: "🔒" 
              },
              { 
                title: "Real-Time Updates", 
                description: "Stay updated with your travel history and balance instantly on your device.", 
                icon: "📱" 
              },
              { 
                title: "Nationwide Coverage", 
                description: "Our service works with transport providers across the entire country.", 
                icon: "🗺️" 
              },
              { 
                title: "24/7 Support", 
                description: "Our customer service team is available round the clock to assist you.", 
                icon: "🛎️" 
              },
              { 
                title: "Eco-Friendly", 
                description: "Reduce paper waste with digital receipts and transactions.", 
                icon: "🌱" 
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h4 className="text-xl font-medium mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Transform Your Commuting Experience?</h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of happy commuters who have switched to our automatic fare collection system.
          </p>
          {!isAuthenticated && (
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
              <Link to="/register">Sign Up Now</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">Kenya AFCS</h4>
              <p className="text-gray-400">
                The future of public transport payment systems in Kenya.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Contact</h4>
              <address className="text-gray-400 not-italic">
                <p>Nairobi, Kenya</p>
                <p>Email: info@kenyaafcs.com</p>
                <p>Phone: +254 700 000 000</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Kenya Automatic Fare Collection System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
