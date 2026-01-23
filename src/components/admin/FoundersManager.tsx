
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSchool } from '@/contexts/SchoolContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import ImageUpload from './ImageUpload';

const FoundersManager = () => {
  const { state, dispatch } = useSchool();
  const { toast } = useToast();
  const [newFounder, setNewFounder] = useState({
    name: '',
    details: '',
    image: ''
  });

  const addFounder = () => {
    if (newFounder.name.trim() && newFounder.details.trim()) {
      const founder = {
        id: Date.now().toString(),
        name: newFounder.name,
        details: newFounder.details,
        image: newFounder.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face'
      };
      
      dispatch({ type: 'ADD_FOUNDER', payload: founder });
      setNewFounder({ name: '', details: '', image: '' });
      
      toast({
        title: "Founder Added",
        description: "New founder has been added successfully.",
      });
    }
  };

  const deleteFounder = (id: string) => {
    dispatch({ type: 'DELETE_FOUNDER', payload: id });
    toast({
      title: "Founder Deleted",
      description: "Founder has been removed.",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Founders Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Founder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="founderName">Founder Name</Label>
            <Input
              id="founderName"
              placeholder="Enter founder name"
              value={newFounder.name}
              onChange={(e) => setNewFounder(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="founderDescription">Description</Label>
            <Textarea
              id="founderDescription"
              placeholder="Enter founder description"
              value={newFounder.details}
              onChange={(e) => setNewFounder(prev => ({ ...prev, details: e.target.value }))}
              rows={3}
            />
          </div>
          <ImageUpload
            label="Founder Image"
            currentImage={newFounder.image}
            onImageUpload={(url) => setNewFounder(prev => ({ ...prev, image: url }))}
          />
          <Button onClick={addFounder} className="bg-school-blue hover:bg-school-blue/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Founder
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Founders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.data.founders.map((founder) => (
              <div key={founder.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <img 
                  src={founder.image} 
                  alt={founder.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-school-blue">{founder.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{founder.details}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteFounder(founder.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            ))}
            {state.data.founders.length === 0 && (
              <p className="text-gray-500 text-center py-8">No founders yet. Add your first founder above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FoundersManager;
