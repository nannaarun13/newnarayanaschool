
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSchool } from '@/contexts/SchoolContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { updateSchoolData } from '@/utils/schoolDataUtils';

const NoticeManager = () => {
  const { state, dispatch } = useSchool();
  const { toast } = useToast();
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [editingNotice, setEditingNotice] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', content: '' });

  const saveToFirestore = async () => {
    try {
      console.log('Saving notices to Firestore...');
      await updateSchoolData({ notices: state.data.notices });
      console.log('Notices saved to Firestore successfully');
    } catch (error: any) {
      console.error('Failed to save notices to Firestore:', error);
      if (error.code === 'permission-denied') {
        toast({
          title: "Notice Updated Locally",
          description: "Notice updated locally. Database permissions need configuration for persistence.",
          variant: "default",
        });
      }
    }
  };

  const handleAddNotice = async () => {
    if (!newNotice.title || !newNotice.content) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content.",
        variant: "destructive"
      });
      return;
    }

    const noticeData = {
      id: Date.now().toString(),
      title: newNotice.title,
      content: newNotice.content,
      date: new Date().toISOString().split('T')[0]
    };

    dispatch({
      type: 'ADD_NOTICE',
      payload: noticeData
    });

    setNewNotice({ title: '', content: '' });
    
    toast({
      title: "Notice Added",
      description: "New notice has been published.",
    });

    // Try to save to Firestore
    setTimeout(saveToFirestore, 100);
  };

  const handleEditNotice = (notice: any) => {
    setEditingNotice(notice.id);
    setEditData({ title: notice.title, content: notice.content });
  };

  const handleSaveEdit = async () => {
    if (!editData.title || !editData.content) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content.",
        variant: "destructive"
      });
      return;
    }

    dispatch({
      type: 'UPDATE_NOTICE',
      payload: { id: editingNotice!, title: editData.title, content: editData.content }
    });

    setEditingNotice(null);
    setEditData({ title: '', content: '' });
    
    toast({
      title: "Notice Updated",
      description: "Notice has been updated successfully.",
    });

    // Try to save to Firestore
    setTimeout(saveToFirestore, 100);
  };

  const handleCancelEdit = () => {
    setEditingNotice(null);
    setEditData({ title: '', content: '' });
  };

  const handleDeleteNotice = async (id: string) => {
    dispatch({
      type: 'DELETE_NOTICE',
      payload: id
    });
    
    toast({
      title: "Notice Deleted",
      description: "Notice has been removed.",
    });

    // Try to save to Firestore
    setTimeout(saveToFirestore, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Notice Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Notice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="noticeTitle">Notice Title</Label>
            <Input
              id="noticeTitle"
              value={newNotice.title}
              onChange={(e) => setNewNotice(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter notice title"
            />
          </div>
          <div>
            <Label htmlFor="noticeContent">Notice Content</Label>
            <Textarea
              id="noticeContent"
              value={newNotice.content}
              onChange={(e) => setNewNotice(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter notice content"
              rows={4}
            />
          </div>
          <Button onClick={handleAddNotice} className="bg-school-blue hover:bg-school-blue/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Notice
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Notices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.data.notices.map((notice) => (
              <div key={notice.id} className="border rounded-lg p-4">
                {editingNotice === notice.id ? (
                  <div className="space-y-4">
                    <Input
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Notice title"
                    />
                    <Textarea
                      value={editData.content}
                      onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Notice content"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{notice.title}</h3>
                      <p className="text-gray-600 mt-2">{notice.content}</p>
                      <p className="text-sm text-gray-500 mt-2">Posted on {notice.date}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditNotice(notice)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteNotice(notice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoticeManager;
