import { useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { updateSchoolData } from '@/utils/schoolDataUtils'; // Using the utility we fixed earlier
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit2, Trash2, Plus, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Define the Notice type based on your data structure
interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'General' | 'Event' | 'Academic' | 'Meeting';
}

const NoticeBoardManager = () => {
  const { state } = useSchool();
  const { notices } = state.data;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Notice, 'id'>>({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    type: 'General'
  });

  // Open Dialog for New Notice
  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      type: 'General'
    });
    setIsDialogOpen(true);
  };

  // Open Dialog for Edit
  const handleEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setFormData({
      title: notice.title,
      content: notice.content,
      date: notice.date,
      type: notice.type
    });
    setIsDialogOpen(true);
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    try {
      const updatedNotices = notices.filter(n => n.id !== id);
      await updateSchoolData({ notices: updatedNotices });
      toast.success('Notice deleted successfully');
    } catch (error) {
      toast.error('Failed to delete notice');
    }
  };

  // Handle Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let updatedNotices = [...notices];

      if (editingId) {
        // UPDATE existing notice
        updatedNotices = updatedNotices.map(n => 
          n.id === editingId 
            ? { ...n, ...formData } 
            : n
        );
        toast.success('Notice updated successfully');
      } else {
        // CREATE new notice
        const newNotice: Notice = {
          id: Date.now().toString(), // Simple ID generation
          ...formData
        };
        // Add to TOP of list
        updatedNotices = [newNotice, ...updatedNotices];
        toast.success('Notice added successfully');
      }

      // Save to Firebase
      await updateSchoolData({ notices: updatedNotices });
      setIsDialogOpen(false);
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to save notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Notice Board Manager</h2>
        <Button onClick={handleAddNew} className="bg-school-blue hover:bg-school-blue/90">
          <Plus className="mr-2 h-4 w-4" /> Add Notice
        </Button>
      </div>

      {/* Notices List */}
      <div className="grid gap-4">
        {notices.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No notices found. Add one to get started.</p>
        ) : (
          notices.map((notice: Notice) => (
            <Card key={notice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full text-white font-medium
                      ${notice.type === 'Event' ? 'bg-school-orange' : 
                        notice.type === 'Academic' ? 'bg-school-blue' : 
                        notice.type === 'Meeting' ? 'bg-green-500' : 'bg-gray-500'}`}
                    >
                      {notice.type}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {notice.date}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{notice.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{notice.content}</p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleEdit(notice)}
                  >
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="hover:bg-red-50"
                    onClick={() => handleDelete(notice.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Notice' : 'Add New Notice'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Summer Vacation Announcement"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val: any) => setFormData({...formData, type: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content"
                required
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Enter the full details of the notice here..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-school-blue">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update Notice' : 'Post Notice'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticeBoardManager;