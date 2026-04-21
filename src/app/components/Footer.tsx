import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer id="kontak" className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Logo" className="h-16 w-16" />
              <div>
                <div className="text-white font-bold text-lg">
                  SMA IT Ulil Albab
                </div>
                <div className="text-sm text-gray-400">
                  Sistem Informasi Akademik
                </div>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Platform terintegrasi untuk mengelola administrasi akademik sekolah Islam terpadu dengan mudah, cepat, dan aman.
            </p>
            {/* Social Media */}
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#2563EB] transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#2563EB] transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#2563EB] transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Menu</h3>
            <ul className="space-y-3">
              <li>
                <a href="#home" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#fitur" className="hover:text-white transition-colors">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#tentang" className="hover:text-white transition-colors">
                  Tentang
                </a>
              </li>
              <li>
                <a href="#kontak" className="hover:text-white transition-colors">
                  Kontak
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-6">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="flex-shrink-0 mt-1 text-[#2563EB]" />
                <span className="text-sm">
                  Jl. Diponegoro Kelurahan No. 01, Bukit Tempayan, Kec. Batu Aji, Kota Batam, Kepulauan Riau 29438
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="flex-shrink-0 text-[#2563EB]" />
                <span className="text-sm">0813-2438-1820</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="flex-shrink-0 text-[#2563EB]" />
                <span className="text-sm">info@smaitua.sch.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} SMA Islam Terpadu Ulil Albab Batam. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
