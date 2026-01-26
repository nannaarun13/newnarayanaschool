import { useSchool } from '@/contexts/SchoolContext';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact = () => {
  const { state } = useSchool();
  const { contactInfo } = state.data;
  const contactNumbers = contactInfo?.contactNumbers || [];

  const getEmbedUrl = (
    input: string | undefined,
    address: string | undefined
  ): string | null => {
    if (input) {
      if (input.includes('<iframe')) {
        const srcMatch = input.match(/src="([^"]+)"/);
        if (srcMatch?.[1]) return srcMatch[1];
      }

      if (
        input.includes('maps.google.com/maps') ||
        input.includes('google.com/maps/embed')
      ) {
        return input;
      }
    }

    if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://maps.google.com/maps?q=${encodedAddress}&z=15&output=embed`;
    }

    return null;
  };

  const mapUrl = getEmbedUrl(contactInfo?.mapEmbed, contactInfo?.address);

  return (
    <div className="min-h-screen bg-gradient-to-br from-school-blue-light via-white to-school-orange-light">
      <div className="container mx-auto px-4 py-8 space-y-12">

        {/* Header */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-school-blue mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with us for any queries, admissions, or general information
          </p>
        </section>

        {/* Contact Cards */}
        <section>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Address */}
            <Card className="text-center">
              <CardContent className="p-6">
                <MapPin className="h-10 w-10 mx-auto mb-3 text-school-blue" />
                <h3 className="font-semibold mb-2">Address</h3>
                <p className="text-gray-600 whitespace-pre-line">
                  {contactInfo?.address || 'Address not available'}
                </p>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="text-center">
              <CardContent className="p-6">
                <Phone className="h-10 w-10 mx-auto mb-3 text-school-blue" />
                <h3 className="font-semibold mb-2">Phone</h3>
                {contactNumbers.length > 0 ? (
                  contactNumbers.map((c) => (
                    <p key={c.id} className="text-gray-600 text-sm">
                      {c.number}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-600">+91 98765 43210</p>
                )}
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="text-center">
              <CardContent className="p-6">
                <Mail className="h-10 w-10 mx-auto mb-3 text-school-blue" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600">
                  {contactInfo?.email || 'info@newnarayanaschool.com'}
                </p>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card className="text-center">
              <CardContent className="p-6">
                <Clock className="h-10 w-10 mx-auto mb-3 text-school-blue" />
                <h3 className="font-semibold mb-2">Working Hours</h3>
                <p className="text-gray-600">
                  {contactInfo?.workingHours || 'Mon – Sat, 9:00 AM – 5:00 PM'}
                </p>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Map */}
        {mapUrl && (
          <section>
            <div className="w-full h-[400px] rounded-lg overflow-hidden border">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Contact;
