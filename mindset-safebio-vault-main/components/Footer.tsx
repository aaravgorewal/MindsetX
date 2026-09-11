import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 px-8 border-t border-white/10 bg-charcoal/50 text-center md:text-left">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-500">
          © 2024 MindSet X. Designed for Indian Students.
        </p>
        <div className="flex gap-6 text-xs text-gray-400">
          <a href="#" className="hover:text-saffron-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-saffron-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-saffron-400 transition-colors">Emergency Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;