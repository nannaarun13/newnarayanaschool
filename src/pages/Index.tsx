
import { useSchool } from '@/contexts/SchoolContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { state } = useSchool();
  const navigate = useNavigate();
  const { welcomeMessage, schoolLogo, galleryImages } = state.data;
  // Safely access properties that might be undefined with defaults
  const welcomeImage = state.data.welcomeImage || "https://via.placeholder.com/1200x600";
  const latestUpdates = state.data.latestUpdates || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Main Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={welcomeImage}
            alt="School Welcome"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="bg-white rounded-full p-4 mb-6 mx-auto w-32 h-32 flex items-center justify-center shadow-xl">
            <img 
              src={schoolLogo} 
              alt="School Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            {welcomeMessage}
          </h2>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Latest Updates */}
        <section className="animate-fade-in">
          <h3 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            Latest Updates
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {latestUpdates.map((update) => (
              <Card key={update.id} className="hover:shadow-lg transition-shadow duration-300 bg-white border">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-school-orange text-white font-medium px-3 py-1">New</Badge>
                    <div className="flex-1">
                      <p className="text-gray-700 font-medium leading-relaxed">{update.content}</p>
                      <p className="text-sm text-gray-500 mt-3">{update.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Gallery */}
        <section className="animate-fade-in">
          <h3 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            Our Gallery
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {galleryImages.slice(0, 6).map((image) => (
              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white border">
                <div className="h-48 overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.caption || image.altText}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 font-medium">{image.caption || image.altText}</p>
                  {image.category && (
                    <Badge variant="outline" className="mt-2 text-xs border-school-blue text-school-blue">
                      {image.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action - Updated to match attachment */}
        <section className="text-center bg-gradient-to-r from-blue-500 to-orange-500 text-white py-16 px-8 rounded-lg animate-fade-in shadow-lg">
          <h3 className="text-3xl font-bold mb-4">Join Our School Community</h3>
          <p className="text-xl mb-8 opacity-90">
            Discover excellence in education with our dedicated faculty and modern facilities
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/admissions')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg">
              Apply Now
            </button>
            <button 
              onClick={() => navigate('/about')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200">
              Learn More
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
