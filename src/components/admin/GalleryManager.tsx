import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchool } from '@/contexts/SchoolContext';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';
import ImageUpload from './ImageUpload';

const GalleryManager = () => {
  const { state, dispatch } = useSchool();
  const { toast } = useToast();
  const [newImage, setNewImage] = useState({ url: '', caption: '', category: '' });

  const categories = ['General', 'Event', 'Festivals', 'Activities'];

  const handleImageUpload = (imageUrl: string) => {
    setNewImage(prev => ({ ...prev, url: imageUrl }));
  };

  const handleAddImage = () => {
    if (!newImage.url || !newImage.caption || !newImage.category) {
      toast({
        title: "Missing Information",
        description: "Please provide image, caption, and category.",
        variant: "destructive"
      });
      return;
    }

    const imageData = {
      id: Date.now().toString(),
      url: newImage.url,
      altText: newImage.caption,
      caption: newImage.caption,
      category: newImage.category,
      date: new Date().toISOString().split('T')[0]
    };

    dispatch({
      type: 'ADD_GALLERY_IMAGE',
      payload: imageData
    });

    setNewImage({ url: '', caption: '', category: '' });
    toast({
      title: "Image Added",
      description: "New image has been added to the gallery.",
    });
  };

  const handleDeleteImage = (id: string) => {
    dispatch({
      type: 'DELETE_GALLERY_IMAGE',
      payload: id
    });
    toast({
      title: "Image Deleted",
      description: "Image has been removed from the gallery.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gallery Management</h2>
      </div>

      {/* Add New Image */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            label="Upload Gallery Image"
            currentImage={newImage.url}
            onImageUpload={handleImageUpload}
          />
          
          <div>
            <Label htmlFor="imageCaption">Caption</Label>
            <Input
              id="imageCaption"
              value={newImage.caption}
              onChange={(e) => setNewImage(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Enter image caption"
            />
          </div>

          <div>
            <Label htmlFor="imageCategory">Category *</Label>
            <Select value={newImage.category} onValueChange={(value) => setNewImage(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleAddImage} className="bg-school-blue hover:bg-school-blue/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </CardContent>
      </Card>

      {/* Current Images */}
      <Card>
        <CardHeader>
          <CardTitle>Current Gallery Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {state.data.galleryImages.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <p className="font-medium">{image.caption}</p>
                  <p className="text-sm text-gray-600 mt-1">{image.category}</p>
                  <p className="text-sm text-gray-600">{image.date}</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GalleryManager;
