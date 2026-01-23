import { useSchool } from '@/contexts/SchoolContext';
import { MapPin, Phone, Mail, MapPinIcon } from 'lucide-react';

const Footer = () => {
  const { state } = useSchool();
  const { contactInfo } = state.data;

  // Defaults (used if Admin Panel data is empty)
  const defaultAddress = '8G49+HFJ, Sri Laxmi Nagar Colony, Badangpet, Hyderabad, Telangana 500058';
  const defaultEmail = 'info@newnarayanaschool.edu';
  
  // Safe Accessors
  const contactNumbers = contactInfo?.contactNumbers || [];
  const address = contactInfo?.address || defaultAddress;
  const email = contactInfo?.email || defaultEmail;

  const handleMapClick = () => {
    // Dynamically generate a Google Maps Search Link based on the address
    const query = encodeURIComponent(address);
    // Uses the official Google Maps API for searching (works on mobile & desktop)
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapUrl, '_blank');
  };

  return (
    <footer className="bg-school-blue text-white py-12 print:hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          
          {/* Address */}
          <div>
            <div className="flex items-start space-x-3 mb-4">
              <MapPin className="h-6 w-6 mt-1 flex-shrink-0 text-school-orange" />
              <div>
                <h4 className="font-semibold text-lg mb-2">Address</h4>
                <p className="text-sm opacity-90 whitespace-pre-line leading-relaxed hover:text-school-orange transition-colors">
                  {address}
                </p>
              </div>
            </div>
          </div>

          {/* Phone Numbers */}
          <div>
            <div className="flex items-start space-x-3 mb-4">
              <Phone className="h-6 w-6 mt-1 flex-shrink-0 text-school-orange" />
              <div>
                <h4 className="font-semibold text-lg mb-2">Phone Numbers</h4>
                <div className="space-y-1">
                  {contactNumbers.length > 0 ? (
                    contactNumbers.map((contact) => (
                      <p key={contact.id} className="text-sm opacity-90">
                        {contact.number}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm opacity-90">+91 98765 43210</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="flex items-start space-x-3 mb-4">
              <Mail className="h-6 w-6 mt-1 flex-shrink-0 text-school-orange" />
              <div>
                <h4 className="font-semibold text-lg mb-2">Email</h4>
                <a href={`mailto:${email}`} className="text-sm opacity-90 hover:text-school-orange transition-colors">
                  {email}
                </a>
              </div>
            </div>
          </div>

          {/* Location Button */}
          <div>
            <div className="flex items-start space-x-3 mb-4">
              <MapPinIcon className="h-6 w-6 mt-1 flex-shrink-0 text-school-orange" />
              <div>
                <h4 className="font-semibold text-lg mb-2">Location</h4>
                <button 
                  onClick={handleMapClick}
                  className="bg-school-orange text-white px-6 py-2 rounded shadow-md hover:bg-white hover:text-school-orange transition-all duration-300 text-sm font-bold border border-transparent hover:border-school-orange"
                >
                  View on Google Maps
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="text-center mt-12 pt-6 border-t border-white/10">
          <p className="text-sm opacity-70">
            © {new Date().getFullYear()} New Narayana School. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;