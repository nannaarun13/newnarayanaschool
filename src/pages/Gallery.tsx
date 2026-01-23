
import { useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const Gallery = () => {
  const { state } = useSchool();
  const { galleryImages } = state.data;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'General', 'Event', 'Festivals', 'Activities', 'Facilities'];

  // Get unique categories from the images
  const uniqueCategories = ['All', ...new Set(galleryImages
    .filter(image => image.category)
    .map(image => image.category))];

  const categoriesToShow = uniqueCategories.length > 1 ? uniqueCategories : categories;

  const filteredImages = selectedCategory === 'All' 
    ? galleryImages 
    : galleryImages.filter(image => image.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <section className="text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-school-blue mb-4">
          School Gallery
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Explore our vibrant school life through photos and memories
        </p>
      </section>

      {/* Category Filters */}
      <section className="text-center">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categoriesToShow.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category 
                ? "bg-school-blue hover:bg-school-blue/90 text-white" 
                : "border-school-blue text-school-blue hover:bg-school-blue hover:text-white"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredImages.map((image) => (
            <Card 
              key={image.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => setSelectedImage(image.url)}
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={image.url}
                  alt={image.caption || image.altText}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">{image.caption || image.altText}</p>
                {image.category && (
                  <span className="inline-block mt-2 px-2 py-1 bg-school-blue text-white text-xs rounded">
                    {image.category}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Gallery Image"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
