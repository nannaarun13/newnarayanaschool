import { useSchool } from '@/contexts/SchoolContext';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact = () => {
  const { state } = useSchool();
  const { contactInfo } = state.data;
  const contactNumbers = contactInfo?.contactNumbers || [];

  // Robust function to handle various Map inputs
  const getEmbedUrl = (input: string | undefined, address: string | undefined): string | null => {
    // 1. If user provided a specific Map Input (Embed Code or URL)
    if (input) {
      // CASE A: User pasted the full <iframe src="..."> code
      if (input.includes('<iframe')) {
        const srcMatch = input.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
          return srcMatch[1]; // Return just the URL part
        }
      }

      // CASE B: User pasted a valid Embed URL directly
      if (input.includes('maps.google.com/maps') || input.includes('google.com/maps/embed')) {
        return input;
      }
    }

    // 2. Fallback: Generate a map from the text address
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      // specific format that works without API keys
      return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    return null;
  };

  const mapUrl = getEmbedUrl(contactInfo?.mapEmbed, contactInfo?.address);

  return (
    <div className="min-h-screen bg-gradient-to-br from-school-blue-light via-white to-school-orange-light">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Page Header */}
        <section className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-school-blue mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with us for any queries, admissions, or general information
          </p>
        </section>

        {/* Contact Information Grid */}
        <section className="animate-fade-in">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border border-school-blue/20">
              <CardContent className="p-6">
                <MapPin className="h-12 w-12 text-school-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-school-blue mb-2">Address</h3>
                <p className="text-gray-600 whitespace-pre-line">
                  {contactInfo?.address || 'Address not available'}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border border-school-blue/20">
              <CardContent className="p-6">
                <Phone className="h-12 w-12 text-school-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-school-blue mb-2">Phone</h3>
                <div className="space-y-1">
                  {contactNumbers.map((contact) => (
                    <p key={contact.id} className="text-gray-600 text-sm">
                      {contact.number}
                    </p>
                  ))}
                  {contactNumbers.length === 0 && (
                    <p className="text-gray-600">+91 98765 43210</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="text