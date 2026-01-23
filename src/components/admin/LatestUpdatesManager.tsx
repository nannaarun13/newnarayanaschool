
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSchool } from '@/contexts/SchoolContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

const LatestUpdatesManager = () => {
  const { state, dispatch } = useSchool();
  const { toast } = useToast();
  const [newUpdateContent, setNewUpdateContent] = useState('');

  const addLatestUpdate = () => {
    if (newUpdateContent.trim()) {
      const newUpdate = {
        id: Date.now().toString(),
        content: newUpdateContent,
        date: new Date().toISOString().split('T')[0]
      };
      
      dispatch({ type: 'ADD_LATEST_UPDATE', payload: newUpdate });
      setNewUpdateContent('');
      
      toast({
        title: "Update Added",
        description: "Latest update has been added successfully.",
      });
    }
  };

  const deleteLatestUpdate = (id: string) => {
    dispatch({ type: 'DELETE_LATEST_UPDATE', payload: id });
    toast({
      title: "Update Deleted",
      description: "Latest update has been removed.",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Latest Updates Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="updateContent">Update Content</Label>
            <Textarea
              id="updateContent"
              placeholder="Enter the latest update"
              value={newUpdateContent}
              onChange={(e) => setNewUpdateContent(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={addLatestUpdate} className="bg-school-blue hover:bg-school-blue/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Update
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.data.latestUpdates.map((update) => (
              <div key={update.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{update.content}</p>
                  <p className="text-sm text-gray-500 mt-1">{update.date}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteLatestUpdate(update.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {state.data.latestUpdates.length === 0 && (
              <p className="text-gray-500 text-center py-8">No updates yet. Add your first update above.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LatestUpdatesManager;
