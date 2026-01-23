
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchool } from '@/contexts/SchoolContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import ImageUpload from './ImageUpload';
import LatestUpdatesManager from './LatestUpdatesManager';
import FoundersManager from './FoundersManager';

const ContentManager = () => {
  const { state, dispatch } = useSchool();
  const { toast } = useToast();
  
  const [generalContent, setGeneralContent] = useState({
    welcomeMessage: state.data.welcomeMessage,
    welcomeImage: state.data.welcomeImage,
    aboutContent: state.data.aboutContent,
    missionStatement: state.data.missionStatement,
    visionStatement: state.data.visionStatement,
    schoolLogo: state.data.schoolLogo,
    schoolName: state.data.schoolName || 'New Narayana School',
    schoolNameImage: state.data.schoolNameImage || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGeneralContent(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log('Saving content changes...');
    
    try {
      // Dispatch update - context now handles Firestore sync automatically
      dispatch({
        type: 'UPDATE_SCHOOL_DATA',
        payload: generalContent
      });
      console.log('Content updated successfully');

      toast({
        title: "Content Updated",
        description: "School content has been saved and synchronized across all devices.",
      });
    } catch (error) {
      console.error("Failed to save content:", error);
      toast({
        title: "Save Failed",
        description: "Could not save your changes. Please try again.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Content Management</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Content</TabsTrigger>
          <TabsTrigger value="updates">Latest Updates</TabsTrigger>
          <TabsTrigger value="founders">Founders</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>General School Content</CardTitle>
                <Button onClick={handleSave} disabled={isSaving} className="bg-school-blue hover:bg-school-blue/90">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* School Logo Upload */}
              <ImageUpload
                label="School Logo"
                currentImage={generalContent.schoolLogo}
                onImageUpload={(url) => setGeneralContent(prev => ({ ...prev, schoolLogo: url }))}
              />

              {/* School Name Text Field */}
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  name="schoolName"
                  value={generalContent.schoolName}
                  onChange={handleInputChange}
                  placeholder="Enter school name"
                />
              </div>

              {/* School Name Image Upload */}
              <ImageUpload
                label="School Name Image (Optional)"
                currentImage={generalContent.schoolNameImage}
                onImageUpload={(url) => setGeneralContent(prev => ({ ...prev, schoolNameImage: url }))}
              />

              <div>
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Input
                  id="welcomeMessage"
                  name="welcomeMessage"
                  value={generalContent.welcomeMessage}
                  onChange={handleInputChange}
                  placeholder="Enter welcome message"
                />
              </div>

              <ImageUpload
                label="Welcome Image"
                currentImage={generalContent.welcomeImage}
                onImageUpload={(url) => setGeneralContent(prev => ({ ...prev, welcomeImage: url }))}
              />

              <div>
                <Label htmlFor="aboutContent">About Content</Label>
                <Textarea
                  id="aboutContent"
                  name="aboutContent"
                  value={generalContent.aboutContent}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter about content"
                />
              </div>

              <div>
                <Label htmlFor="missionStatement">Mission Statement</Label>
                <Textarea
                  id="missionStatement"
                  name="missionStatement"
                  value={generalContent.missionStatement}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter mission statement"
                />
              </div>

              <div>
                <Label htmlFor="visionStatement">Vision Statement</Label>
                <Textarea
                  id="visionStatement"
                  name="visionStatement"
                  value={generalContent.visionStatement}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter vision statement"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates">
          <LatestUpdatesManager />
        </TabsContent>

        <TabsContent value="founders">
          <FoundersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManager;
